const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');

/**
 * Validation rules for grievance creation
 */
const validateCreateGrievance = [
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
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department name cannot exceed 100 characters'),
  body('frustration_index')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Frustration index must be an integer between 1 and 10'),
  body('attachment_url')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Attachment must be a valid URL'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 250 }).withMessage('Location cannot exceed 250 characters'),
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be a valid float coordinate'),
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be a valid float coordinate'),
  validate
];

/**
 * Validation rules for ticket status updates
 */
const validateUpdateGrievanceStatus = [
  body('status')
    .isIn(['New', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid ticket status'),
  body('resolution_notes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Resolution notes cannot exceed 2000 characters'),
  validate
];

/**
 * Validation rules for grievance assignment
 */
const validateAssignGrievance = [
  body('assigned_to')
    .optional({ nullable: true })
    .trim()
    .notEmpty().withMessage('Assigned to ID cannot be empty if provided'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Department must be a string up to 100 characters'),
  validate
];

/**
 * Validation rules for grievance escalation
 */
const validateEscalateGrievance = [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Escalation reason must be between 5 and 1000 characters'),
  validate
];

/**
 * Validation rules for grievance comments
 */
const validateComment = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Comment message must be between 1 and 5000 characters'),
  body('grievance_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Grievance ID cannot be empty if provided'),
  validate
];

module.exports = {
  validateCreateGrievance,
  validateUpdateGrievanceStatus,
  validateAssignGrievance,
  validateEscalateGrievance,
  validateComment
};
