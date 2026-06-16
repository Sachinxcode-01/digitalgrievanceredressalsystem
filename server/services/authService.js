const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const notificationRepository = require('../repositories/notificationRepository');
const configService = require('./configService');
const emailService = require('./emailService');
const smsService = require('./smsService');
const sessionService = require('./sessionService');
const { logAudit, logSecurityEvent } = require('./auditService');

const createError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const checkOtpCooldown = async (identifier, purpose) => {
  const filterCol = identifier.includes('@') ? 'email' : 'phone';
  const lastOtp = await notificationRepository.findOtpVerification(identifier, filterCol, purpose).catch(() => null);

  if (lastOtp) {
    const timeElapsed = Date.now() - new Date(lastOtp.created_at).getTime();
    const cooldownMs = 30 * 1000; // 30 seconds
    if (timeElapsed < cooldownMs) {
      return Math.ceil((cooldownMs - timeElapsed) / 1000);
    }
  }
  return 0;
};

const authService = {
  async register(fullName, email, password, role, ip, userAgent) {
    const normalizedEmail   = email.toLowerCase().trim();

    // 1. Hash password
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Atomic check-and-insert via PostgreSQL function (eliminates race condition)
    //    Throws 'Email address is already registered.' or 'Phone number is already registered.'
    //    with status 400 if duplicates exist.
    const newUser = await userRepository.registerAtomic(
      normalizedEmail,
      null,
      passwordHash,
      'student',   // always force student for public registration
      'inactive'
    );

    // 3. Create profile (non-critical – do not let a profile failure roll back the user)
    await userRepository.createProfile({
      user_id: newUser.id,
      full_name: fullName,
      notification_preferences: { email: true, sms: false }
    }).catch(console.error);

    // 4. Generate and dispatch OTP
    const otp          = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
    const expiresAt    = new Date(Date.now() + otpExpirySec * 1000).toISOString();

    // Clear any previous OTPs for this email before inserting fresh one
    await notificationRepository.deleteOtpVerification(normalizedEmail, 'email', 'registration').catch(() => null);

    await notificationRepository.insertOtpVerification({
      email:      normalizedEmail,
      phone:      null,
      code:       otp,
      purpose:    'registration',
      expires_at: expiresAt,
      attempts:   0
    });

    // Dispatch notifications
    await emailService.sendOTPEmail(normalizedEmail, otp).catch(console.error);

    await logAudit(newUser.id, 'REGISTRATION_INITIATED', ip, userAgent);

    return {
      message: 'Registration successful. Please enter the OTP sent to verify your identity.',
      email:   normalizedEmail,
      phone:   null
    };
  },

  async verifyOtp(email, otp, purpose, rememberMe, ip, userAgent) {
    const targetPurpose = purpose || 'registration';

    // 1. Fetch OTP record
    const verification = await notificationRepository.findOtpVerification(email, 'email', targetPurpose);
    if (!verification) {
      throw createError('No verification session found. Request a new key.', 400);
    }

    // Check expiry
    if (new Date() > new Date(verification.expires_at)) {
      await notificationRepository.deleteOtpVerificationById(verification.id);
      throw createError('Verification code has expired (5 minute limit).', 400);
    }

    // Verify code
    if (verification.code !== otp) {
      const newAttempts = (verification.attempts || 0) + 1;
      if (newAttempts >= 3) {
        await notificationRepository.deleteOtpVerificationById(verification.id);
        throw createError('Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.', 400);
      } else {
        await notificationRepository.updateOtpAttempts(verification.id, newAttempts);
        throw createError(`Incorrect verification code. Attempts remaining: ${3 - newAttempts}`, 400);
      }
    }

    // Delete verification record
    await notificationRepository.deleteOtpVerificationById(verification.id);

    // Fetch user
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw createError('Associated user account not found.', 404);
    }

    // Fetch profile
    const profile = await userRepository.findProfileByUserId(user.id);
    user.full_name = profile ? profile.full_name : 'User';

    // 2. Actions on verification
    if (targetPurpose === 'registration') {
      await userRepository.update(user.id, {
        status: 'active',
        email_verified: true,
        phone_verified: false
      });
      user.status = 'active';

      await emailService.sendWelcomeEmail(user.email, user.full_name, user.id).catch(console.error);
      await logAudit(user.id, 'ACCOUNT_ACTIVATED', ip, userAgent);
    } else if (targetPurpose === 'forgot_password') {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      await notificationRepository.insertPasswordReset({
        user_id: user.id,
        code: resetToken,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: true
      });
      return { requiresReset: true, resetCode: resetToken };
    }

    // 3. Create active session
    const sessionResult = await sessionService.createSession(user, ip, userAgent, rememberMe);
    return {
      token: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      expiresAt: sessionResult.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: null,
        role: user.role,
        fullName: user.full_name
      }
    };
  },

  async login(email, password, loginType, rememberMe, ip, userAgent) {
    // 1. Fetch user
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw createError('Invalid credentials.', 401);
    }

    // 2. Check Lockout Status
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / (60 * 1000));
      throw createError(`Account locked due to consecutive failures. Try again in ${minutesRemaining} minutes.`, 403);
    }

    // Fetch profile
    const profile = await userRepository.findProfileByUserId(user.id);
    user.full_name = profile ? profile.full_name : 'User';

    // 3. Passwordless OTP Login
    if (loginType === 'otp') {
      const cooldownSec = await checkOtpCooldown(email, 'login');
      if (cooldownSec > 0) {
        throw createError(`Please wait ${cooldownSec} seconds before requesting a new login OTP.`, 429);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

      await notificationRepository.deleteOtpVerification(email, 'email', 'login');
      await notificationRepository.insertOtpVerification({
        email: user.email,
        phone: null,
        code: otp,
        purpose: 'login',
        expires_at: expiresAt
      });

      await emailService.sendOTPEmail(user.email, otp).catch(console.error);

      return { requiresOtp: true };
    }

    // 4. Verify Password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const attempts = user.failed_login_attempts + 1;
      const maxAttempts = parseInt(configService.getSetting('max_login_attempts', 5));
      const lockoutDurationMin = parseInt(configService.getSetting('lockout_duration_minutes', 15));
      
      if (attempts >= maxAttempts) {
        const lockoutTime = new Date(Date.now() + lockoutDurationMin * 60 * 1000).toISOString();
        await userRepository.update(user.id, { failed_login_attempts: 0, lockout_until: lockoutTime });
        await logAudit(user.id, 'ACCOUNT_LOCKED', ip, userAgent);
        
        await emailService.sendSecurityAlertEmail(user.id, `Your account has been temporarily locked for ${lockoutDurationMin} minutes due to ${maxAttempts} consecutive failed login attempts.`, user.email).catch(console.error);
        throw createError(`Too many incorrect attempts. Account locked for ${lockoutDurationMin} minutes.`, 403);
      } else {
        await userRepository.update(user.id, { failed_login_attempts: attempts });
        await logAudit(user.id, 'LOGIN_FAILED', ip, userAgent, { attempts });
        
        const warnThreshold = Math.max(1, Math.floor(maxAttempts * 0.6));
        if (attempts >= warnThreshold) {
          await emailService.sendSecurityAlertEmail(user.id, `Warning: Multiple consecutive failed login attempts detected. Current count: ${attempts}/${maxAttempts}.`, user.email).catch(console.error);
        }
        throw createError('Invalid credentials.', 401);
      }
    }

    // Reset login failures
    await userRepository.update(user.id, { failed_login_attempts: 0, lockout_until: null });

    // 5. If inactive, force activation verification
    if (user.status === 'inactive') {
      const cooldownSec = await checkOtpCooldown(user.email, 'registration');
      if (cooldownSec > 0) {
        return {
          requiresActivation: true,
          email: user.email
        };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();
      
      await notificationRepository.deleteOtpVerification(user.email, 'email', 'registration');
      await notificationRepository.insertOtpVerification({
        email: user.email,
        phone: null,
        code: otp,
        purpose: 'registration',
        expires_at: expiresAt
      });

      await emailService.sendOTPEmail(user.email, otp).catch(console.error);
      return {
        requiresActivation: true,
        email: user.email
      };
    }

    // Enforce MFA for Admin/Super Admin
    if (user.role === 'admin' || user.role === 'super admin') {
      const cooldownSec = await checkOtpCooldown(email, 'login');
      if (cooldownSec > 0) {
        throw createError(`Please wait ${cooldownSec} seconds before requesting a new login OTP.`, 429);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

      await notificationRepository.deleteOtpVerification(email, 'email', 'login');
      await notificationRepository.insertOtpVerification({
        email: user.email,
        phone: null,
        code: otp,
        purpose: 'login',
        expires_at: expiresAt
      });

      await emailService.sendOTPEmail(user.email, otp).catch(console.error);

      return {
        requiresOtp: true,
        message: 'Administrative accounts require a second factor. An OTP has been sent to your registered email.'
      };
    }

    // 6. Create active session
    const sessionResult = await sessionService.createSession(user, ip, userAgent, rememberMe);
    return {
      token: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      expiresAt: sessionResult.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: null,
        role: user.role,
        fullName: user.full_name
      }
    };
  },

  async resendOtp(email, purpose) {
    const targetPurpose = purpose || 'registration';

    const cooldownSec = await checkOtpCooldown(email, targetPurpose);
    if (cooldownSec > 0) {
      throw createError(`Please wait ${cooldownSec} seconds before requesting a new verification key.`, 429);
    }

    await notificationRepository.deleteOtpVerification(email, 'email', targetPurpose);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await notificationRepository.insertOtpVerification({
      email,
      phone: null,
      code: otp,
      purpose: targetPurpose,
      expires_at: expiresAt
    });

    await emailService.sendOTPEmail(email, otp);

    return { message: 'A fresh security key has been dispatched.' };
  },

  async forgotPassword(email, ip, userAgent) {
    const cooldownSec = await checkOtpCooldown(email, 'forgot_password');
    if (cooldownSec > 0) {
      throw createError(`Please wait ${cooldownSec} seconds before requesting another reset key.`, 429);
    }

    const user = await userRepository.findByEmail(email).catch(() => null);
    if (!user) {
      return { message: 'If registered, a security reset key has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
    const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

    await notificationRepository.deleteOtpVerification(email, 'email', 'forgot_password');
    await notificationRepository.insertOtpVerification({
      email,
      phone: null,
      code: otp,
      purpose: 'forgot_password',
      expires_at: expiresAt
    });

    await emailService.sendOTPEmail(email, otp);
    await logAudit(user.id, 'PASSWORD_RESET_REQUESTED', ip, userAgent);

    return { message: 'If registered, a security reset key has been sent.', email };
  },

  async resetPassword(email, password, resetCode, ip, userAgent) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw createError('User not found.', 404);
    }

    const resetRecord = await notificationRepository.findPasswordReset(user.id, resetCode);
    if (!resetRecord) {
      await logSecurityEvent(user.id, 'PASSWORD_RESET_FAILED', 'WARNING', ip, userAgent, { reason: 'Invalid reset code' }).catch(() => null);
      throw createError('Unauthorized reset request. Identity has not been verified.', 400);
    }

    if (new Date() > new Date(resetRecord.expires_at)) {
      await logSecurityEvent(user.id, 'PASSWORD_RESET_FAILED', 'WARNING', ip, userAgent, { reason: 'Expired reset code' }).catch(() => null);
      throw createError('Password reset authorization has expired.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await userRepository.update(user.id, {
      password_hash: passwordHash,
      failed_login_attempts: 0,
      lockout_until: null
    });

    const sessionRepository = require('../repositories/sessionRepository');
    await sessionRepository.deleteByUserId(user.id);
    await notificationRepository.deletePasswordResetsByUserId(user.id);

    await logAudit(user.id, 'PASSWORD_RESET_SUCCESSFUL', ip, userAgent);
    await emailService.sendPasswordChangedEmail(user.id).catch(console.error);

    return { message: 'Password updated successfully. All other active sessions have been invalidated.' };
  },

  async googleLogin(credential, rememberMe, ip, userAgent) {
    let payload;
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        throw new Error('Failed to verify token with Google');
      }
      payload = await response.json();
    } catch (err) {
      throw createError('Invalid Google Identity token verification.', 401);
    }

    const { email, name, picture, email_verified, aud, iss, exp } = payload;

    // Validate Google Client ID (Audience)
    if (aud !== process.env.GOOGLE_CLIENT_ID) {
      throw createError('Google token audience verification failed.', 401);
    }

    // Validate Issuer
    if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
      throw createError('Google token issuer verification failed.', 401);
    }

    // Validate Expiration
    if (exp && parseInt(exp) * 1000 < Date.now()) {
      throw createError('Google token has expired.', 401);
    }

    if (email_verified !== 'true' && email_verified !== true) {
      throw createError('Google email address is not verified.', 401);
    }

    let user = await userRepository.findByEmail(email);
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('oauth-placeholder-password-' + Math.random().toString(36), salt);

      user = await userRepository.create({
        email,
        password_hash: passwordHash,
        role: 'student',
        status: 'active',
        email_verified: true,
        phone_verified: false
      });

      await userRepository.createProfile({
        user_id: user.id,
        full_name: name || 'Google User',
        profile_picture: picture || null,
        notification_preferences: { email: true, sms: true }
      });
    } else {
      if (user.status === 'locked' || (user.lockout_until && new Date() < new Date(user.lockout_until))) {
        throw createError('This account has been locked. Please contact system support.', 403);
      }
      if (user.status === 'inactive') {
        await userRepository.update(user.id, { status: 'active', email_verified: true });
        user.status = 'active';
      }
    }

    const profile = await userRepository.findProfileByUserId(user.id);
    user.full_name = profile ? profile.full_name : name || 'Google User';

    // Enforce MFA for Admin/Super Admin in Google login
    if (user.role === 'admin' || user.role === 'super admin') {
      const cooldownSec = await checkOtpCooldown(email, 'login');
      if (cooldownSec > 0) {
        throw createError(`Please wait ${cooldownSec} seconds before requesting a new login OTP.`, 429);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

      await notificationRepository.deleteOtpVerification(email, 'email', 'login');
      await notificationRepository.insertOtpVerification({
        email: user.email,
        phone: null,
        code: otp,
        purpose: 'login',
        expires_at: expiresAt
      });

      await emailService.sendOTPEmail(user.email, otp).catch(console.error);

      return {
        requiresOtp: true,
        message: 'Administrative accounts require a second factor. An OTP has been sent to your registered email.'
      };
    }

    const sessionResult = await sessionService.createSession(user, ip, userAgent, rememberMe);
    return {
      token: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      expiresAt: sessionResult.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobile_number,
        role: user.role,
        fullName: user.full_name
      }
    };
  }
};

module.exports = authService;
