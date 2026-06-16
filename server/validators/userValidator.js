const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

const VALID_ROLES = ['student', 'faculty', 'staff', 'admin', 'super admin'];
const VALID_STATUSES = ['active', 'inactive', 'locked'];

/**
 * Validation rules for user creation by admin
 */
const validateCreateUser = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role')
    .isIn(VALID_ROLES).withMessage('Invalid role specified'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Invalid status specified'),
  validate
];

/**
 * Validation rules for user update by admin
 */
const validateUpdateUser = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(VALID_ROLES).withMessage('Invalid role specified'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Invalid status specified'),
  validate
];

/**
 * Validation rules for user role assignment
 */
const validateRoleAssignment = [
  body('role')
    .isIn(VALID_ROLES).withMessage('Invalid role specified'),
  validate
];

/**
 * Validation rules for user account lock/unlock status updates
 */
const validateUserStatusUpdate = [
  body('status')
    .isIn(VALID_STATUSES).withMessage('Invalid status specified'),
  validate
];

/**
 * Validation rules for profile updates by the user themselves
 */
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('profilePicture')
    .optional({ nullable: true })
    .trim()
    .custom((val) => {
      if (val === null || val === '') return true;
      if (/^(http|https):\/\/[^ "]+$/.test(val)) return true;
      throw new Error('Profile picture must be a valid URL');
    }),
  body('notificationPreferences')
    .optional()
    .isObject().withMessage('Notification preferences must be an object'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Department cannot exceed 150 characters'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Institution cannot exceed 150 characters'),
  validate
];

/**
 * Validation rules for self account details update (email, phone)
 */
const validateAccountUpdate = [
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  validate
];

/**
 * Validation rules for password change
 */
const validateChangePassword = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  validate
];

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateRoleAssignment,
  validateUserStatusUpdate,
  validateProfileUpdate,
  validateAccountUpdate,
  validateChangePassword
};
