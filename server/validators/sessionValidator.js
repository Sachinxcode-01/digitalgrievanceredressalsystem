const { param, body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const validateRevokeSession = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  validate
];

const validateRevokeAllSessions = [
  body('keepCurrent')
    .optional()
    .isBoolean().withMessage('keepCurrent must be a boolean'),
  validate
];

module.exports = {
  validateRevokeSession,
  validateRevokeAllSessions
};
