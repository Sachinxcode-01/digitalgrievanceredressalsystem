const express = require('express');
const router = express.Router();
const { getAllGrievances, createGrievance } = require('../controllers/grievanceController');

// @route   GET /api/grievances
// @desc    Fetch all reported grievances
router.get('/', getAllGrievances);

// @route   POST /api/grievances
// @desc    Report a new grievance
router.post('/', createGrievance);

module.exports = router;
