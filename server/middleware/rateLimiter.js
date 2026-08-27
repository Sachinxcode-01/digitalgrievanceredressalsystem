const rateLimit = require('express-rate-limit');

/**
 * Anti-Brute-Force Rate Limiter for Whistleblower Anonymous Passkey Lookups & Messaging.
 * Strictly limits requests to 10 per 15 minutes per IP address to prevent brute-forcing secret passkeys.
 */
const anonymousPasskeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Security Rate Limit Exceeded: Too many Whistleblower passkey verification attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

/**
 * Rate Limiter for SHA-256 Merkle Audit Verification Inspection.
 * Limits hash verification queries to 30 per 15 minutes per IP address.
 */
const publicVerifyHashLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Security Rate Limit Exceeded: Too many cryptographic hash verification requests. Please wait 15 minutes.'
  }
});

/**
 * Strict Rate Limiter for Auth & OTP Verifications.
 * Prevents credential stuffing & OTP guessing attacks (5 attempts per 15 minutes per IP).
 */
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login or verification attempts. For your account safety, access is locked for 15 minutes.'
  }
});

module.exports = {
  anonymousPasskeyLimiter,
  publicVerifyHashLimiter,
  strictAuthLimiter
};
