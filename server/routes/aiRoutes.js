const express = require('express');
const router = express.Router();
const { triageGrievance, suggestResolution, elevateBriefing, summarizePerformance } = require('../controllers/aiController');

// @route   POST /api/ai/analyze
// @desc    Perform AI triage on description
router.post('/analyze', triageGrievance);

// @route   POST /api/ai/suggest
// @desc    AI-generated resolution draft for admins
router.post('/suggest', suggestResolution);

// @route   POST /api/ai/elevate
// @desc    Brief a specialist for ticket elevation
router.post('/elevate', elevateBriefing);

// @route   POST /api/ai/summarize
// @desc    Performance summary for reporting
router.post('/summarize', summarizePerformance);

module.exports = router;
