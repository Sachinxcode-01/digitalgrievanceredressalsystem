const express = require('express');
const router = express.Router();
const { triageGrievance } = require('../controllers/aiController');

// @route   POST /api/ai/analyze
// @desc    Perform AI triage on description
router.post('/analyze', triageGrievance);

module.exports = router;
