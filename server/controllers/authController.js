const authService = require('../services/authService');
const sessionService = require('../services/sessionService');
const auditService = require('../services/auditService');

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    const result = await authService.register(fullName, email, password, role, req.ip, req.headers['user-agent']);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Verify OTP code
 * POST /api/v1/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  console.log('📬 [verifyOtp] Request Body:', req.body);
  const { email, otp, purpose, rememberMe } = req.body;

  try {
    const result = await authService.verifyOtp(email, otp, purpose, rememberMe, req.ip, req.headers['user-agent']);
    
    if (result.requiresReset) {
      return res.json({ message: 'Identity confirmed. You may now update your password.', resetCode: result.resetCode });
    }

    // Set refresh token in HttpOnly cookie with dynamic maxAge
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Identity verified. Session authenticated.',
      token: result.token,
      user: result.user
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
  const { email, password, loginType, rememberMe } = req.body;

  try {
    const result = await authService.login(email, password, loginType, rememberMe, req.ip, req.headers['user-agent']);

    if (result.requiresOtp) {
      return res.json({ message: result.message || 'Security key sent.', requiresOtp: true });
    }

    if (result.requiresActivation) {
      return res.status(202).json({
        message: 'Account is not activated. Enter the OTP sent to complete registration.',
        requiresActivation: true,
        email: result.email
      });
    }

    // Set HTTP-only cookie with dynamic maxAge
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Login successful.',
      token: result.token,
      user: result.user
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
  const { email, purpose } = req.body;

  try {
    const result = await authService.resendOtp(email, purpose);
    res.json(result);
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
    const result = await authService.forgotPassword(email, req.ip, req.headers['user-agent']);
    res.json(result);
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
    const result = await authService.resetPassword(email, password, resetCode, req.ip, req.headers['user-agent']);
    res.json(result);
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
    const sessionResult = await sessionService.rotateSession(refreshToken, req.ip, req.headers['user-agent']);

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
    if (refreshToken) {
      const sessionRepository = require('../repositories/sessionRepository');
      const session = await sessionRepository.findByRefreshToken(refreshToken).catch(() => null);

      if (session) {
        await sessionService.revokeSession(session.id, session.user_id);
        await auditService.logAudit(session.user_id, 'LOGOUT_SUCCESS', req.ip, req.headers['user-agent']);
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
    const result = await authService.googleLogin(credential, rememberMe, req.ip, req.headers['user-agent']);

    // Set cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: result.expiresAt.getTime() - Date.now()
    });

    res.json({
      message: 'Google authentication successful.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    next(err);
  }
};

const syncUser = async (req, res, next) => {
  const { getAuth, clerkClient } = require('@clerk/express');
  const userRepository = require('../repositories/userRepository');

  try {
    const authState = getAuth(req);
    const clerkId   = authState.userId;

    // Log diagnostic data
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(__dirname, '../../sync_diagnostic.log');
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] Sync Request\nHeaders: ${JSON.stringify(req.headers)}\nCookies: ${JSON.stringify(req.cookies)}\nClerk ID: ${clerkId}\nAuth State: ${JSON.stringify(authState)}\n\n`;
      fs.appendFileSync(logPath, logMessage);
    } catch (fsErr) {
      console.error('Failed to write to sync_diagnostic.log:', fsErr.message);
    }

    if (!clerkId) {
      return res.status(401).json({ error: 'Access token required. Authorization denied.' });
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email     = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return res.status(400).json({ error: 'Authenticated Clerk user has no primary email address.' });
    }

    const role     = clerkUser.publicMetadata?.role || 'student';
    const fullName = clerkUser.unsafeMetadata?.fullName
      || (clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Clerk User');
    const mobile   = clerkUser.unsafeMetadata?.mobileNumber
      || clerkUser.phoneNumbers[0]?.phoneNumber
      || null;

    // Atomic upsert: creates or updates the user row without a race condition.
    // Calls the PostgreSQL sync_clerk_user() function which uses ON CONFLICT (email).
    let user = await userRepository.syncClerkUserAtomic(email, clerkId, mobile, role, fullName);

    // Ensure the user profile exists (created outside the upsert for flexibility)
    const profile = await userRepository.findProfileByUserId(user.id).catch(() => null);
    if (!profile) {
      await userRepository.createProfile({
        user_id: user.id,
        full_name: fullName,
        notification_preferences: { email: true, sms: true }
      }).catch(console.error);
    } else if (profile.full_name !== fullName) {
      await userRepository.updateProfile(user.id, { full_name: fullName }).catch(console.error);
    }

    // Create local session for legacy fallback/testing support
    let localSessionData = null;
    try {
      localSessionData = await sessionService.createSession(
        {
          id: user.id,
          email: user.email,
          mobile_number: user.mobile_number,
          role: user.role,
          full_name: fullName
        },
        req.ip,
        req.headers['user-agent']
      );
      
      // Set the secure cookie
      res.cookie('refresh_token', localSessionData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: localSessionData.expiresAt.getTime() - Date.now()
      });
    } catch (sessionErr) {
      console.error('Failed to create local session during sync:', sessionErr.message);
    }

    res.json({
      message: 'User synchronized successfully.',
      token: localSessionData?.accessToken || null,
      user: {
        id:           user.id,
        email:        user.email,
        mobileNumber: user.mobile_number,
        role:         user.role,
        fullName
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
  googleLogin,
  syncUser
};
