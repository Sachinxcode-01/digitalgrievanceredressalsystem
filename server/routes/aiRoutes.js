const express = require('express');
const router = express.Router();
const { 
  triageGrievance, 
  suggestResolution, 
  draftOfficialResolutionHandler,
  predictiveSlaForecastHandler,
  predictiveTurnaroundForecast,
  departmentVelocityScorecard,
  converseVoiceAssistant,
  elevateBriefing, 
  summarizePerformance, 
  analyzeVision,
  verifyEvidenceHandler,
  composeBroadcast,
  smartRouteHandler,
  checkDuplicates,
  translateGrievance,
  transcribeVoice
} = require('../controllers/aiController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/securityMiddleware');

router.use(aiLimiter);

// @route   POST /api/v1/ai/voice-assistant/converse
// @desc    Interactive AI voice assistant conversational dialogue & entity extractor
router.post('/voice-assistant/converse', authenticateToken, converseVoiceAssistant);

// @route   GET /api/v1/ai/predictive-forecast
// @desc    Predictive Turnaround & Queue Backlog Estimation
router.get('/predictive-forecast', authenticateToken, predictiveTurnaroundForecast);

// @route   GET /api/v1/ai/velocity-scorecard
// @desc    Department velocity scorecard and SLA turnaround baselines
router.get('/velocity-scorecard', authenticateToken, departmentVelocityScorecard);

// @route   POST /api/v1/ai/analyze
// @desc    Perform AI triage on description (Available to authenticated users submitting tickets)
router.post('/analyze', authenticateToken, triageGrievance);

// @route   POST /api/v1/ai/smart-route
// @desc    Perform AI smart auto-routing and SLA prediction (Available to authenticated users)
router.post('/smart-route', authenticateToken, smartRouteHandler);

// @route   POST /api/v1/ai/check-duplicates
// @desc    Perform AI duplicate ticket similarity detection
router.post('/check-duplicates', authenticateToken, checkDuplicates);

// @route   POST /api/v1/ai/translate
// @desc    Perform Multilingual translation with source language detection
router.post('/translate', authenticateToken, translateGrievance);

// @route   POST /api/v1/ai/transcribe-voice
// @desc    Perform AI speech-to-text audio transcription
router.post('/transcribe-voice', authenticateToken, transcribeVoice);

// @route   POST /api/v1/ai/suggest
// @desc    AI-generated resolution draft (Restricted to admin / super admin)
router.post('/suggest', authenticateToken, authorizeRoles('admin', 'super admin'), suggestResolution);

// @route   POST /api/v1/ai/draft-resolution
// @desc    AI-generated official policy resolution dossier & formal letter (Restricted to admin / super admin / officer)
router.post('/draft-resolution', authenticateToken, authorizeRoles('admin', 'super admin', 'officer', 'staff'), draftOfficialResolutionHandler);

// @route   POST /api/v1/ai/sla-predictions
// @desc    Predictive SLA Breach Intelligence & Bottleneck Heatmap (Restricted to admin / super admin / officer)
router.post('/sla-predictions', authenticateToken, authorizeRoles('admin', 'super admin', 'officer'), predictiveSlaForecastHandler);

// @route   POST /api/v1/ai/elevate
// @desc    Brief a specialist for ticket elevation (Restricted to admin / super admin)
router.post('/elevate', authenticateToken, authorizeRoles('admin', 'super admin'), elevateBriefing);

// @route   POST /api/v1/ai/summarize
// @desc    Performance summary for reporting (Restricted to admin / super admin)
router.post('/summarize', authenticateToken, authorizeRoles('admin', 'super admin'), summarizePerformance);

// @route   POST /api/v1/ai/vision
// @desc    AI vision analysis of evidence (Restricted to admin / super admin)
router.post('/vision', authenticateToken, authorizeRoles('admin', 'super admin'), analyzeVision);

// @route   POST /api/v1/ai/verify-evidence
// @desc    Multimodal document OCR & tamper forensic inspection
router.post('/verify-evidence', authenticateToken, verifyEvidenceHandler);

// @route   POST /api/v1/ai/compose-broadcast
// @desc    Draft institutional emails using AI (Restricted to admin / super admin)
router.post('/compose-broadcast', authenticateToken, authorizeRoles('admin', 'super admin'), composeBroadcast);

module.exports = router;
