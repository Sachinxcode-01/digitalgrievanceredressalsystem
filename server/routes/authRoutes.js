const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyOtp, 
  resendOtp, 
  forgotPassword, 
  resetPassword, 
  refresh, 
  logout,
  googleLogin
} = require('../controllers/authController');

const { loginLimiter, registrationLimiter, otpLimiter } = require('../middleware/securityMiddleware');
const { 
  validateRegister, 
  validateLogin, 
  validateVerifyOtp, 
  validateOtpRequest,
  validateForgotPassword,
  validateResetPassword
} = require('../validators/authValidator');

// @route   POST /api/v1/auth/register
// @desc    Register a new user account (inactive)
router.post('/register', registrationLimiter, validateRegister, register);

// @route   POST /api/v1/auth/login
// @desc    Login and retrieve access token / secure cookie
router.post('/login', loginLimiter, validateLogin, login);

// @route   POST /api/v1/auth/google
// @desc    Authenticate via Google Identity
router.post('/google', loginLimiter, googleLogin);

// @route   POST /api/v1/auth/verify-otp
// @desc    Verify OTP code for activation / authentication
router.post('/verify-otp', validateVerifyOtp, verifyOtp);

// @route   POST /api/v1/auth/resend-otp
// @desc    Resend OTP to email/phone
router.post('/resend-otp', otpLimiter, validateOtpRequest, resendOtp);

// @route   POST /api/v1/auth/forgot-password
// @desc    Initiate forgot-password workflow
router.post('/forgot-password', otpLimiter, validateForgotPassword, forgotPassword);

// @route   POST /api/v1/auth/reset-password
// @desc    Save new password
router.post('/reset-password', validateResetPassword, resetPassword);

// @route   POST /api/v1/auth/refresh-token
// @desc    Rotate access/refresh token pair
router.post('/refresh-token', refresh);

// @route   POST /api/v1/auth/logout
// @desc    Revoke session
router.post('/logout', logout);

module.exports = router;
