const express = require('express');
const router = express.Router();
const { 
  getAllGrievances, 
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  getGrievanceTimeline,
  submitFeedback
} = require('../controllers/grievanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { 
  validateCreateGrievance, 
  validateUpdateGrievanceStatus, 
  validateAssignGrievance, 
  validateEscalateGrievance,
  validateFeedback
} = require('../validators/grievanceValidator');

router.use(authenticateToken);

// @route   GET /api/v1/grievances
// @desc    Fetch all reported grievances (scoped to user, or global if admin)
router.get('/', getAllGrievances);

// @route   POST /api/v1/grievances
// @desc    Report a new grievance
router.post('/', validateCreateGrievance, createGrievance);

// @route   GET /api/v1/grievances/:id
// @desc    Fetch a single grievance by ID
router.get('/:id', getGrievanceById);

// @route   PUT /api/v1/grievances/:id/status
// @desc    Update status of a grievance
router.put('/:id/status', validateUpdateGrievanceStatus, updateGrievanceStatus);

// @route   PUT /api/v1/grievances/:id/assign
// @desc    Assign grievance to officer / department
router.put('/:id/assign', authorizeRoles('admin', 'super admin'), validateAssignGrievance, assignGrievance);

// @route   PUT /api/v1/grievances/:id/escalate
// @desc    Escalate grievance ticket
router.put('/:id/escalate', validateEscalateGrievance, escalateGrievance);

// @route   GET /api/v1/grievances/:id/timeline
// @desc    Fetch timeline log for a grievance
router.get('/:id/timeline', getGrievanceTimeline);

// @route   POST /api/v1/grievances/:id/feedback
// @desc    Submit user satisfaction feedback rating and close ticket
router.post('/:id/feedback', validateFeedback, submitFeedback);

module.exports = router;
