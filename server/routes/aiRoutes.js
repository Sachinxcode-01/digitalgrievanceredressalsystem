const express = require('express');
const router = express.Router();
const { triageGrievance, suggestResolution } = require('../controllers/aiController');

// @route   POST /api/ai/analyze
// @desc    Perform AI triage on description
router.post('/analyze', triageGrievance);

// @route   POST /api/ai/suggest
// @desc    AI-generated resolution draft for admins
router.post('/suggest', suggestResolution);

module.exports = router;
