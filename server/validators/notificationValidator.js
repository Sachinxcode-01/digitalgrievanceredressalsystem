const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const validateUpdatePreferences = [
  body('emailEnabled')
    .optional()
    .isBoolean().withMessage('emailEnabled must be a boolean'),
  body('smsEnabled')
    .optional()
    .isBoolean().withMessage('smsEnabled must be a boolean'),
  body('inAppEnabled')
    .optional()
    .isBoolean().withMessage('inAppEnabled must be a boolean'),
  validate
];

const validateSendTestNotification = [
  body('recipient')
    .trim()
    .notEmpty().withMessage('Recipient is required'),
  body('type')
    .trim()
    .isIn(['EMAIL', 'SMS', 'IN_APP']).withMessage('Invalid notification type'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message content is required'),
  validate
];

module.exports = {
  validateUpdatePreferences,
  validateSendTestNotification
};
