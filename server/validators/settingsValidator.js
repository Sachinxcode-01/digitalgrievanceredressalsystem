const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

/**
 * Validation rules for bulk settings update
 */
const validateUpdateSettings = [
  body()
    .isObject().withMessage('Settings payload must be an object')
    .custom(obj => Object.keys(obj).length > 0).withMessage('Settings payload cannot be empty'),
  body('sender_email')
    .optional()
    .isEmail().withMessage('Sender email must be a valid email address'),
  body('smtp_port')
    .optional()
    .isInt({ min: 1, max: 65535 }).withMessage('SMTP port must be a valid port number'),
  body('otp_expiry_seconds')
    .optional()
    .isInt({ min: 10 }).withMessage('OTP expiry must be at least 10 seconds'),
  body('session_expiry_minutes')
    .optional()
    .isInt({ min: 1 }).withMessage('Session expiry must be a positive integer'),
  body('max_login_attempts')
    .optional()
    .isInt({ min: 1 }).withMessage('Max login attempts must be a positive integer'),
  body('lockout_duration_minutes')
    .optional()
    .isInt({ min: 1 }).withMessage('Lockout duration must be a positive integer'),
  body('sms_api_url')
    .optional({ checkFalsy: true })
    .isURL().withMessage('SMS API URL must be a valid URL'),
  body('smtp_ssl')
    .optional()
    .isBoolean().withMessage('SMTP SSL setting must be a boolean'),
  body('enable_email_notifications')
    .optional()
    .isBoolean().withMessage('Enable email notifications must be a boolean'),
  body('enable_sms_notifications')
    .optional()
    .isBoolean().withMessage('Enable SMS notifications must be a boolean'),
  body('enable_ai_triage')
    .optional()
    .isBoolean().withMessage('Enable AI triage must be a boolean'),
  validate
];

/**
 * Validation rules for test email dispatch
 */
const validateTestEmail = [
  body('testEmail')
    .isEmail().withMessage('Recipient test email address is required')
    .normalizeEmail(),
  validate
];

/**
 * Validation rules for test SMS dispatch
 */
const validateTestSms = [
  body('testPhone')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('A valid E.164 phone number is required'),
  validate
];

/**
 * Validation rules for department creation
 */
const validateCreateDepartment = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Department name is required and cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('headUserId')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('Head user ID cannot be empty if provided'),
  body('assignmentRules')
    .optional()
    .isObject().withMessage('Assignment rules must be an object'),
  validate
];

/**
 * Validation rules for department update
 */
const validateUpdateDepartment = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Department name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('headUserId')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('Head user ID cannot be empty if provided'),
  body('assignmentRules')
    .optional()
    .isObject().withMessage('Assignment rules must be an object'),
  validate
];

/**
 * Validation rules for SLA rule creation
 */
const validateCreateSlaRule = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('SLA Rule name is required'),
  body('category')
    .isIn(['Financial', 'Academic', 'Maintenance', 'IT Support']).withMessage('Invalid grievance category'),
  body('priority')
    .isIn(['High', 'Medium', 'Low']).withMessage('Invalid urgency/priority level'),
  body('resolutionTimeHours')
    .isInt({ min: 1 }).withMessage('Resolution time (hours) must be a positive integer'),
  body('warningTimeHours')
    .optional()
    .isInt({ min: 1 }).withMessage('Warning time (hours) must be a positive integer'),
  validate
];

/**
 * Validation rules for SLA rule update
 */
const validateUpdateSlaRule = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('SLA Rule name cannot exceed 100 characters'),
  body('category')
    .optional()
    .isIn(['Financial', 'Academic', 'Maintenance', 'IT Support']).withMessage('Invalid grievance category'),
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low']).withMessage('Invalid urgency/priority level'),
  body('resolutionTimeHours')
    .optional()
    .isInt({ min: 1 }).withMessage('Resolution time (hours) must be a positive integer'),
  body('warningTimeHours')
    .optional()
    .isInt({ min: 1 }).withMessage('Warning time (hours) must be a positive integer'),
  validate
];

/**
 * Validation rules for Escalation rule creation
 */
const validateCreateEscalationRule = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Escalation Rule name is required'),
  body('slaRuleId')
    .notEmpty().withMessage('SLA Rule association ID is required'),
  body('triggerDelayHours')
    .isInt({ min: 1 }).withMessage('Trigger delay (hours) must be a positive integer'),
  body('escalateToUserId')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('Escalation officer user ID cannot be empty if provided'),
  validate
];

/**
 * Validation rules for Escalation rule update
 */
const validateUpdateEscalationRule = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Escalation Rule name cannot exceed 100 characters'),
  body('slaRuleId')
    .optional()
    .notEmpty().withMessage('SLA Rule association ID cannot be empty if provided'),
  body('triggerDelayHours')
    .optional()
    .isInt({ min: 1 }).withMessage('Trigger delay (hours) must be a positive integer'),
  body('escalateToUserId')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('Escalation officer user ID cannot be empty if provided'),
  validate
];

module.exports = {
  validateUpdateSettings,
  validateTestEmail,
  validateTestSms,
  validateCreateDepartment,
  validateUpdateDepartment,
  validateCreateSlaRule,
  validateUpdateSlaRule,
  validateCreateEscalationRule,
  validateUpdateEscalationRule
};
