const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Full name can only contain letters and spaces'),
  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('mobileNumber')
    .optional({ checkFalsy: true })
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .optional()
    .isIn(['student', 'faculty', 'staff', 'admin', 'super admin']).withMessage('Invalid role specified'),
  validate
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  body('loginType')
    .optional()
    .isIn(['password', 'otp']).withMessage('Invalid login type'),
  body('password')
    .custom((val, { req }) => {
      if (req.body.loginType !== 'otp' && (!val || val.length === 0)) {
        throw new Error('Password is required for standard login');
      }
      return true;
    }),
  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error('Either email or phone must be provided to sign in');
    }
    return true;
  }),
  validate
];

/**
 * Validation rules for OTP verification
 */
const validateVerifyOtp = [
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'forgot_password']).withMessage('Invalid OTP purpose'),
  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error('Either email or phone must be provided');
    }
    return true;
  }),
  validate
];

/**
 * Validation rules for requesting OTP/Forgot Password
 */
const validateOtpRequest = [
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  body('purpose')
    .optional()
    .isIn(['registration', 'login', 'forgot_password']).withMessage('Invalid OTP purpose'),
  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error('Either email or phone must be provided');
    }
    return true;
  }),
  validate
];

/**
 * Validation rules for Forgot Password
 */
const validateForgotPassword = [
  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  validate
];

/**
 * Validation rules for Reset Password
 */
const validateResetPassword = [
  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('resetCode')
    .notEmpty().withMessage('Reset code is required'),
  validate
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateOtpRequest,
  validateForgotPassword,
  validateResetPassword
};
