const express = require('express');
const router = express.Router();
const { 
  triageGrievance, 
  suggestResolution, 
  elevateBriefing, 
  summarizePerformance, 
  analyzeVision,
  composeBroadcast
} = require('../controllers/aiController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/securityMiddleware');

router.use(aiLimiter);

// @route   POST /api/v1/ai/analyze
// @desc    Perform AI triage on description (Available to authenticated users submitting tickets)
router.post('/analyze', authenticateToken, triageGrievance);

// @route   POST /api/v1/ai/suggest
// @desc    AI-generated resolution draft (Restricted to admin)
router.post('/suggest', authenticateToken, authorizeRoles('admin'), suggestResolution);

// @route   POST /api/v1/ai/elevate
// @desc    Brief a specialist for ticket elevation (Restricted to admin)
router.post('/elevate', authenticateToken, authorizeRoles('admin'), elevateBriefing);

// @route   POST /api/v1/ai/summarize
// @desc    Performance summary for reporting (Restricted to admin)
router.post('/summarize', authenticateToken, authorizeRoles('admin'), summarizePerformance);

// @route   POST /api/v1/ai/vision
// @desc    AI vision analysis of evidence (Restricted to admin)
router.post('/vision', authenticateToken, authorizeRoles('admin'), analyzeVision);

// @route   POST /api/v1/ai/compose-broadcast
// @desc    Draft institutional emails using AI (Restricted to admin)
router.post('/compose-broadcast', authenticateToken, authorizeRoles('admin'), composeBroadcast);

module.exports = router;
