const express = require('express');
const router = express.Router();
const { 
  getAllGrievances, 
  createGrievance,
  getGrievanceById,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  getGrievanceTimeline
} = require('../controllers/grievanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateGrievanceSubmission } = require('../middleware/validationMiddleware');

router.use(authenticateToken);

// @route   GET /api/v1/grievances
// @desc    Fetch all reported grievances (scoped to user, or global if admin)
router.get('/', getAllGrievances);

// @route   POST /api/v1/grievances
// @desc    Report a new grievance
router.post('/', validateGrievanceSubmission, createGrievance);

// @route   GET /api/v1/grievances/:id
// @desc    Fetch a single grievance by ID
router.get('/:id', getGrievanceById);

// @route   PUT /api/v1/grievances/:id/status
// @desc    Update status of a grievance
router.put('/:id/status', updateGrievanceStatus);

// @route   PUT /api/v1/grievances/:id/assign
// @desc    Assign grievance to officer / department
router.put('/:id/assign', authorizeRoles('admin', 'super admin'), assignGrievance);

// @route   PUT /api/v1/grievances/:id/escalate
// @desc    Escalate grievance ticket
router.put('/:id/escalate', escalateGrievance);

// @route   GET /api/v1/grievances/:id/timeline
// @desc    Fetch timeline log for a grievance
router.get('/:id/timeline', getGrievanceTimeline);

module.exports = router;
