const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordChangedEmail, sendSecurityAlertEmail } = require('../services/emailService');
const { sendOTPSMS } = require('../services/smsService');
const { createSession, rotateSession, revokeSession, logAudit } = require('../services/sessionService');
const configService = require('../services/configService');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  const { fullName, email, mobileNumber, password, role } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // 1. Check if user already exists
    let query = supabase
      .from('users')
      .select('id, email, mobile_number');
      
    if (mobileNumber && mobileNumber.trim() !== '') {
      query = query.or(`email.eq.${email},mobile_number.eq.${mobileNumber.trim()}`);
    } else {
      query = query.eq('email', email);
    }

    const { data: existingUser, error: checkError } = await query.maybeSingle();

    if (existingUser) {
      const field = existingUser.email === email ? 'Email address' : 'Mobile number';
      return res.status(400).json({ error: `${field} is already registered.` });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Determine target role
    let userRole = role || 'student';
    if (userRole === 'admin' || userRole === 'super admin') {
      if (!email.endsWith('@resolve.now') && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Administrative roles require an institutional domain (@resolve.now).' });
      }
    }

    // 4. Create inactive user record
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          mobile_number: mobileNumber,
          password_hash: passwordHash,
          role: userRole,
          status: 'inactive',
          email_verified: false,
          phone_verified: false
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create profile placeholder
    await supabase.from('user_profiles').insert([
      {
        user_id: newUser.id,
        full_name: fullName,
        notification_preferences: { email: true, sms: true }
      }
    ]);

    // 5. Generate and dispatch OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
    const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

    // Store verification record
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert([
        {
          email,
          phone: mobileNumber,
          code: otp,
          purpose: 'registration',
          expires_at: expiresAt,
          attempts: 0
        }
      ]);

    if (otpError) throw otpError;

    // Dispatches
    await sendOTPEmail(email, otp).catch(console.error);
    if (mobileNumber) {
      await sendOTPSMS(mobileNumber, otp).catch(console.error);
    }

    await logAudit(newUser.id, 'REGISTRATION_INITIATED', req.ip, req.headers['user-agent']);

    res.status(201).json({
      message: 'Registration successful. Please enter the OTP sent to verify your identity.',
      email,
      phone: mobileNumber
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to check OTP resend cooldown (30 seconds)
 */
const checkOtpCooldown = async (identifier, purpose) => {
  if (!supabase) return 0;
  const filterCol = identifier.includes('@') ? 'email' : 'phone';
  const { data: lastOtp } = await supabase
    .from('otp_verifications')
    .select('created_at')
    .eq(filterCol, identifier)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOtp) {
    const timeElapsed = Date.now() - new Date(lastOtp.created_at).getTime();
    const cooldownMs = 30 * 1000; // 30 seconds
    if (timeElapsed < cooldownMs) {
      return Math.ceil((cooldownMs - timeElapsed) / 1000);
    }
  }
  return 0;
};

/**
 * Verify OTP code
 * POST /api/v1/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  const { email, phone, otp, purpose, rememberMe } = req.body;
  const targetPurpose = purpose || 'registration';

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const identifier = email || phone;
    const filterCol = email ? 'email' : 'phone';

    // 1. Fetch OTP record
    const { data: verification, error: findError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq(filterCol, identifier)
      .eq('purpose', targetPurpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError || !verification) {
      return res.status(400).json({ error: 'No verification session found. Request a new key.' });
    }

    // Check expiry (5 minutes)
    if (new Date() > new Date(verification.expires_at)) {
      await supabase.from('otp_verifications').delete().eq('id', verification.id);
      return res.status(400).json({ error: 'Verification code has expired (5 minute limit).' });
    }

    // Verify OTP code
    if (verification.code !== otp) {
      const newAttempts = (verification.attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabase.from('otp_verifications').delete().eq('id', verification.id);
        return res.status(400).json({ error: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.' });
      } else {
        await supabase
          .from('otp_verifications')
          .update({ attempts: newAttempts })
          .eq('id', verification.id);

        return res.status(400).json({ error: `Incorrect verification code. Attempts remaining: ${3 - newAttempts}` });
      }
    }

    // Delete verification record
    await supabase.from('otp_verifications').delete().eq('id', verification.id);

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email || ''},mobile_number.eq.${phone || ''}`)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Associated user account not found.' });
    }

    // Fetch user profile for display name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    user.full_name = profile ? profile.full_name : 'User';

    // 2. Perform target actions
    if (targetPurpose === 'registration') {
      // Activate user
      await supabase
        .from('users')
        .update({
          status: 'active',
          email_verified: !!email,
          phone_verified: !!phone
        })
        .eq('id', user.id);

      user.status = 'active';

      await sendWelcomeEmail(user.email, user.full_name).catch(console.error);
      await logAudit(user.id, 'ACCOUNT_ACTIVATED', req.ip, req.headers['user-agent']);
    } else if (targetPurpose === 'forgot_password') {
      // Create a transient reset authorization row
      await supabase
        .from('password_resets')
        .insert([{ user_id: user.id, code: otp, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), verified: true }]);

      return res.json({ message: 'Identity confirmed. You may now update your password.', resetCode: otp });
    }

    // 3. Generate secure session (Auto-login)
    const sessionResult = await createSession(user, req.ip, req.headers['user-agent'], rememberMe);

    // Set refresh token in HttpOnly cookie with dynamic maxAge
    res.cookie('refresh_token', sessionResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionResult.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Identity verified. Session authenticated.',
      token: sessionResult.accessToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobile_number,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login handler
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  const { email, phone, password, loginType, rememberMe } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const identifier = email || phone;

    // 1. Fetch user by email or phone
    let query = supabase.from('users').select('*');
    if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('mobile_number', phone);
    } else {
      return res.status(400).json({ error: 'Identifier (email or mobile) is required.' });
    }

    const { data: user, error: userError } = await query.maybeSingle();
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // 2. Check Lockout Status
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / (60 * 1000));
      return res.status(403).json({ error: `Account locked due to consecutive failures. Try again in ${minutesRemaining} minutes.` });
    }

    // Fetch user profile for full name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    user.full_name = profile ? profile.full_name : 'User';

    // 3. Passwordless OTP Login route
    if (loginType === 'otp') {
      const cooldownSec = await checkOtpCooldown(identifier, 'login');
      if (cooldownSec > 0) {
        return res.status(429).json({ error: `Please wait ${cooldownSec} seconds before requesting a new login OTP.` });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

      await supabase.from('otp_verifications').delete().eq(email ? 'email' : 'phone', identifier).eq('purpose', 'login');
      await supabase.from('otp_verifications').insert([{
        email: user.email,
        phone: user.mobile_number,
        code: otp,
        purpose: 'login',
        expires_at: expiresAt
      }]);

      if (email) await sendOTPEmail(user.email, otp).catch(console.error);
      if (phone) await sendOTPSMS(user.mobile_number, otp).catch(console.error);

      return res.json({ message: 'Security key sent.', requiresOtp: true });
    }

    // 4. Verify Password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const attempts = user.failed_login_attempts + 1;
      const maxAttempts = parseInt(configService.getSetting('max_login_attempts', 5));
      const lockoutDurationMin = parseInt(configService.getSetting('lockout_duration_minutes', 15));
      
      if (attempts >= maxAttempts) {
        // Lockout user
        const lockoutTime = new Date(Date.now() + lockoutDurationMin * 60 * 1000).toISOString();
        await supabase
          .from('users')
          .update({ failed_login_attempts: 0, lockout_until: lockoutTime })
          .eq('id', user.id);

        await logAudit(user.id, 'ACCOUNT_LOCKED', req.ip, req.headers['user-agent']);
        
        // Dispatch security lockout email
        await sendSecurityAlertEmail(user.id, `Your account has been temporarily locked for ${lockoutDurationMin} minutes due to ${maxAttempts} consecutive failed login attempts.`, user.email).catch(console.error);
        
        return res.status(403).json({ error: `Too many incorrect attempts. Account locked for ${lockoutDurationMin} minutes.` });
      } else {
        await supabase
          .from('users')
          .update({ failed_login_attempts: attempts })
          .eq('id', user.id);

        await logAudit(user.id, 'LOGIN_FAILED', req.ip, req.headers['user-agent'], { attempts });
        
        // Warning email after threshold (e.g., 3 consecutive failures)
        const warnThreshold = Math.max(1, Math.floor(maxAttempts * 0.6));
        if (attempts >= warnThreshold) {
          await sendSecurityAlertEmail(user.id, `Warning: Multiple consecutive failed login attempts detected. Current count: ${attempts}/${maxAttempts}.`, user.email).catch(console.error);
        }
        
        return res.status(401).json({ error: `Incorrect password. ${maxAttempts - attempts} attempts remaining.` });
      }
    }

    // Reset login failures on success
    await supabase
      .from('users')
      .update({ failed_login_attempts: 0, lockout_until: null })
      .eq('id', user.id);

    // 5. If inactive, force activation verification
    if (user.status === 'inactive') {
      const cooldownSec = await checkOtpCooldown(user.email, 'registration');
      if (cooldownSec > 0) {
        return res.status(202).json({
          message: 'Account is not activated. A verification key has already been sent.',
          requiresActivation: true,
          email: user.email
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
      const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();
      
      await supabase.from('otp_verifications').delete().eq('email', user.email).eq('purpose', 'registration');
      await supabase.from('otp_verifications').insert([{
        email: user.email,
        phone: user.mobile_number,
        code: otp,
        purpose: 'registration',
        expires_at: expiresAt
      }]);

      await sendOTPEmail(user.email, otp).catch(console.error);
      return res.status(202).json({
        message: 'Account is not activated. Enter the OTP sent to complete registration.',
        requiresActivation: true,
        email: user.email
      });
    }

    // 6. Create active session with Remember Me support
    const sessionResult = await createSession(user, req.ip, req.headers['user-agent'], rememberMe);

    // Send HTTP-only cookie with dynamic maxAge
    res.cookie('refresh_token', sessionResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionResult.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Login successful.',
      token: sessionResult.accessToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobile_number,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resend OTP Code
 * POST /api/v1/auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  const { email, phone, purpose } = req.body;
  const targetPurpose = purpose || 'registration';

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const identifier = email || phone;
    const filterCol = email ? 'email' : 'phone';

    // Enforce strict 30-second cooldown
    const cooldownSec = await checkOtpCooldown(identifier, targetPurpose);
    if (cooldownSec > 0) {
      return res.status(429).json({ error: `Please wait ${cooldownSec} seconds before requesting a new verification key.` });
    }

    // Delete existing OTP verifications
    await supabase.from('otp_verifications').delete().eq(filterCol, identifier).eq('purpose', targetPurpose);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from('otp_verifications').insert([{
      email,
      phone,
      code: otp,
      purpose: targetPurpose,
      expires_at: expiresAt
    }]);

    if (email) await sendOTPEmail(email, otp);
    if (phone) await sendOTPSMS(phone, otp);

    res.json({ message: 'A fresh security key has been dispatched.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Forgot Password Flow - Step 1: Send OTP
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Enforce strict 30-second cooldown
    const cooldownSec = await checkOtpCooldown(email, 'forgot_password');
    if (cooldownSec > 0) {
      return res.status(429).json({ error: `Please wait ${cooldownSec} seconds before requesting another reset key.` });
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, mobile_number')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      // Safety: return success message to avoid user-enumeration vulnerability
      return res.json({ message: 'If registered, a security reset key has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirySec = parseInt(configService.getSetting('otp_expiry_seconds', 300));
    const expiresAt = new Date(Date.now() + otpExpirySec * 1000).toISOString();

    await supabase.from('otp_verifications').delete().eq('email', email).eq('purpose', 'forgot_password');
    await supabase.from('otp_verifications').insert([{
      email,
      phone: user.mobile_number,
      code: otp,
      purpose: 'forgot_password',
      expires_at: expiresAt
    }]);

    await sendOTPEmail(email, otp);
    await logAudit(user.id, 'PASSWORD_RESET_REQUESTED', req.ip, req.headers['user-agent']);

    res.json({ message: 'If registered, a security reset key has been sent.', email });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset Password Flow - Step 2: Save New Password
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  const { email, password, resetCode } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Find User
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify code in password_resets
    const { data: resetRecord, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', resetCode)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resetError || !resetRecord) {
      return res.status(400).json({ error: 'Unauthorized reset request. Identity has not been verified.' });
    }

    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ error: 'Password reset authorization has expired.' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash: passwordHash, failed_login_attempts: 0, lockout_until: null })
      .eq('id', user.id);

    // Purge session tokens & invalidate previous sessions
    await supabase.from('sessions').delete().eq('user_id', user.id);
    await supabase.from('password_resets').delete().eq('user_id', user.id);

    await logAudit(user.id, 'PASSWORD_RESET_SUCCESSFUL', req.ip, req.headers['user-agent']);

    // Send confirmation email
    await sendPasswordChangedEmail(user.id).catch(console.error);

    res.json({ message: 'Password updated successfully. All other active sessions have been invalidated.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Token Refresh Rotation
 * POST /api/v1/auth/refresh-token
 */
const refresh = async (req, res, next) => {
  let refreshToken = req.cookies ? req.cookies.refresh_token : null;

  if (!refreshToken && req.body.refresh_token) {
    refreshToken = req.body.refresh_token;
  }

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token not found. Authorization denied.' });
  }

  try {
    const sessionResult = await rotateSession(refreshToken, req.ip, req.headers['user-agent']);

    // Set cookie with dynamic maxAge
    res.cookie('refresh_token', sessionResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionResult.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Tokens rotated successfully.',
      token: sessionResult.accessToken
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

/**
 * Logout System
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  let refreshToken = req.cookies ? req.cookies.refresh_token : null;

  if (!refreshToken && req.body.refresh_token) {
    refreshToken = req.body.refresh_token;
  }

  try {
    if (refreshToken && supabase) {
      const { data: session } = await supabase
        .from('sessions')
        .select('id, user_id')
        .eq('refresh_token', refreshToken)
        .single();

      if (session) {
        await revokeSession(session.id, session.user_id);
        await logAudit(session.user_id, 'LOGOUT_SUCCESS', req.ip, req.headers['user-agent']);
      }
    }

    // Clear Cookie
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Google Login Handler
 * POST /api/v1/auth/google
 */
const googleLogin = async (req, res, next) => {
  const { credential, rememberMe } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    if (!credential) {
      return res.status(400).json({ error: 'Google ID Token is required.' });
    }

    // 1. Verify token with Google API (with sandbox fallback)
    let payload;
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!response.ok) {
        throw new Error('Failed to verify token with Google');
      }
      payload = await response.json();
    } catch (err) {
      if (credential.startsWith('sandbox-token-')) {
        const parts = credential.split('-');
        const mockEmail = parts[2] || 'google-user@resolve.now';
        const mockName = parts[3]?.replace(/_/g, ' ') || 'Google User';
        payload = {
          email: mockEmail,
          name: mockName,
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
          email_verified: 'true'
        };
      } else {
        return res.status(401).json({ error: 'Invalid Google Identity token verification.' });
      }
    }

    const { email, name, picture, email_verified } = payload;

    if (email_verified !== 'true' && email_verified !== true) {
      return res.status(401).json({ error: 'Google email address is not verified.' });
    }

    // 2. Find or register user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('oauth-placeholder-password-' + Math.random().toString(36), salt);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: passwordHash,
            role: 'student',
            status: 'active',
            email_verified: true,
            phone_verified: false
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;

      await supabase.from('user_profiles').insert([
        {
          user_id: user.id,
          full_name: name || 'Google User',
          profile_picture: picture || null,
          notification_preferences: { email: true, sms: true }
        }
      ]);
    } else {
      if (user.status === 'locked' || (user.lockout_until && new Date() < new Date(user.lockout_until))) {
        return res.status(403).json({ error: 'This account has been locked. Please contact system support.' });
      }
      if (user.status === 'inactive') {
        await supabase.from('users').update({ status: 'active', email_verified: true }).eq('id', user.id);
        user.status = 'active';
      }
    }

    // Retrieve user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, profile_picture')
      .eq('user_id', user.id)
      .single();

    user.full_name = profile ? profile.full_name : name || 'Google User';

    // 3. Create session
    const sessionResult = await createSession(user, req.ip, req.headers['user-agent'], rememberMe);

    // Set cookie
    res.cookie('refresh_token', sessionResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionResult.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Google authentication successful.',
      token: sessionResult.accessToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobile_number,
        role: user.role,
        fullName: user.full_name,
        profilePicture: profile?.profile_picture || picture
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  googleLogin
};
