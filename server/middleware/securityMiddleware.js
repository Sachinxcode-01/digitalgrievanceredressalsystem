const rateLimit = require('express-rate-limit');

/**
 * Limit registration requests (Sign up spam prevention)
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Limit each IP to 10 registration requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts from this IP. Please try again after an hour.' }
});

/**
 * Limit login requests (Brute force prevention)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Limit each IP to 15 login requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again after 15 minutes.' }
});

/**
 * Limit OTP request/resend operations
 */
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 5, // Limit each IP to 5 OTP requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests from this IP. Please try again after 5 minutes.' }
});

/**
 * Limit AI triage and analysis requests (cost control)
 */
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 30, // Limit each IP to 30 requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI analysis requests from this IP. Please try again after 10 minutes.' }
});

/**
 * Limit Chat stream/ResolveBot requests
 */
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 35, // Limit each IP to 35 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat interactions from this IP. Please try again after 5 minutes.' }
});

module.exports = {
  registrationLimiter,
  loginLimiter,
  otpLimiter,
  aiLimiter,
  chatLimiter
};
