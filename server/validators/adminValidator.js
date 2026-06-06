const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

/**
 * Validation rules for admin broadcast transmissions
 */
const validateBroadcast = [
  body('subject')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters'),
  body('body')
    .trim()
    .isLength({ min: 10 }).withMessage('Body content must be at least 10 characters long'),
  validate
];

/**
 * Validation rules for custom role creation
 */
const validateCreateRole = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Role name is required and cannot exceed 50 characters')
    .matches(/^[a-zA-Z0-9_\s-]+$/).withMessage('Role name contains invalid characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array of permission IDs'),
  validate
];

/**
 * Validation rules for custom role update
 */
const validateUpdateRole = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array of permission IDs'),
  validate
];

module.exports = {
  validateBroadcast,
  validateCreateRole,
  validateUpdateRole
};
