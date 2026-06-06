const crypto = require('crypto');

const otpUtils = {
  /**
   * Generate a secure random numeric OTP code
   * @param {number} length - Default is 6 digits
   */
  generateOTP(length = 6) {
    const chars = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += chars[bytes[i] % chars.length];
    }
    return otp;
  },

  /**
   * Check if a timestamp is within the OTP validity period (default 5 minutes)
   * @param {string|Date} createdAt 
   * @param {number} expiryMinutes 
   */
  isExpired(createdAt, expiryMinutes = 5) {
    const createdTime = new Date(createdAt).getTime();
    const expiryTime = createdTime + expiryMinutes * 60 * 1000;
    return Date.now() > expiryTime;
  }
};

module.exports = otpUtils;
