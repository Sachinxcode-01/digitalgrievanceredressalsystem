const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'resolvenow-enterprise-secret-2026';

const securityUtils = {
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  signToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};

module.exports = securityUtils;
