const { body, validationResult } = require('express-validator');

/**
 * Validates the results of express-validator rules.
 * Throws a structured 400 Bad Request error if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Request validation failed', 
      details: errors.array().map(e => ({ field: e.param, message: e.msg })) 
    });
  }
  next();
};

/**
 * Validation rules for user/admin OTP request
 */
const validateOtpRequest = [
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Invalid role specified'),
  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error('Either email or phone must be provided');
    }
    return true;
  }),
  validate
];

/**
 * Validation rules for OTP verification
 */
const validateOtpVerification = [
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
  body().custom(body => {
    if (!body.email && !body.phone) {
      throw new Error('Either email or phone must be provided');
    }
    return true;
  }),
  validate
];

/**
 * Validation rules for grievance submission
 */
const validateGrievanceSubmission = [
  body('ticket_id')
    .notEmpty().withMessage('Ticket ID is required'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .isIn(['Financial', 'Academic', 'Maintenance', 'IT Support']).withMessage('Invalid grievance category'),
  body('urgency')
    .isIn(['High', 'Medium', 'Low']).withMessage('Invalid urgency level'),
  body('email')
    .optional()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  validate
];

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
 * Validation rules for ticket status updates
 */
const validateStatusUpdate = [
  body('status')
    .isIn(['Pending', 'In-Progress', 'Resolved']).withMessage('Invalid ticket status'),
  body('resolution_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Resolution notes cannot exceed 2000 characters'),
  validate
];

/**
 * Validation rules for user registration
 */
const validateRegistration = [
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

module.exports = {
  validateOtpRequest,
  validateOtpVerification,
  validateGrievanceSubmission,
  validateBroadcast,
  validateStatusUpdate,
  validateRegistration,
  validateLogin
};
