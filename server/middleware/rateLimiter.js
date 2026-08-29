const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter for Auth & OTP Verifications.
 * Prevents credential stuffing, password brute-forcing & OTP guessing attacks (5 attempts per 15 minutes per IP).
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

/**
 * AI Engine Rate Limiter.
 * Protects Google Gemini AI quota and downstream LLM inference from flood attacks (25 requests per minute per IP/User).
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI Inference Rate Limit: You are submitting AI analysis requests too quickly. Please wait a moment.'
  }
});

/**
 * Grievance Submission Anti-Spam Rate Limiter.
 * Prevents automated denial-of-service grievance flooding (10 ticket submissions per 15 minutes per IP).
 */
const grievanceSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Submission Rate Limit: You have exceeded the allowable grievance submissions window. Please wait 15 minutes before filing another ticket.'
  }
});

/**
 * Public Tracking & API Rate Limiter.
 * Allows transparent tracking queries while preventing scraping (60 requests per minute per IP).
 */
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Public API Rate Limit Exceeded: Too many tracking queries. Please wait a minute.'
  }
});

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

module.exports = {
  strictAuthLimiter,
  aiLimiter,
  grievanceSubmissionLimiter,
  publicApiLimiter,
  anonymousPasskeyLimiter,
  publicVerifyHashLimiter
};
