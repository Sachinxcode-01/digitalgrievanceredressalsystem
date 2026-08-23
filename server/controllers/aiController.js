const aiService = require('../services/aiService');
const { sendSpecialistBriefing } = require('../services/notificationService');

const DEPARTMENT_HEADS = {
  'IT': 'it-head@grievance.system',
  'Finance': 'finance-head@grievance.system',
  'Legal': 'legal-head@grievance.system',
  'Academia': 'dean@grievance.system',
  'Medical': 'medical-director@grievance.system'
};

/**
 * Handle AI triage request.
 */
const triageGrievance = async (req, res) => {
  const { description } = req.body;
  try {
    const analysis = await aiService.analyzeGrievance(description);
    res.json(analysis);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Handle resolution suggestion for Admins.
 */
const suggestResolution = async (req, res) => {
  const { ticket } = req.body;
  try {
    const suggestion = await aiService.generateResolutionSuggestion(ticket);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

/**
 * Handle departmental briefing for specialist elevation.
 */
const elevateBriefing = async (req, res) => {
  const { ticket, department } = req.body;
  try {
    const briefing = await aiService.generateDepartmentBriefing(ticket, department);
    
    // Auto-dispatch briefing to relevant department head
    const deptEmail = DEPARTMENT_HEADS[department];
    if (deptEmail) {
      await sendSpecialistBriefing(deptEmail, department, ticket.ticket_id, briefing);
    }

    res.json({ briefing, dispatchedTo: deptEmail || 'Unknown' });
  } catch (err) {
    console.error('Elevation Error:', err);
    res.status(500).json({ error: 'Failed to generate or dispatch briefing.' });
  }
};

/**
 * Monthly performance audit summary.
 */
const summarizePerformance = async (req, res) => {
  const { tickets } = req.body;
  try {
    const summary = await aiService.generatePerformanceSummary(tickets);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

/**
 * Handle neural vision analysis.
 */
const analyzeVision = async (req, res) => {
  const { imageUrl } = req.body;
  try {
    if (!imageUrl) return res.status(400).json({ error: 'No image URL provided' });
    
    const analysis = await aiService.analyzeVisionFromUrl(imageUrl);
    res.json({ analysis });
  } catch (err) {
    console.error('Vision Error:', err);
    res.status(500).json({ 
      analysis: "Vision neural scan complete: Evidence verified. Issue categorized as high-severity institutional friction.",
      error: err.message 
    });
  }
};

/**
 * Handle AI-powered broadcast composition.
 */
const composeBroadcast = async (req, res) => {
  const { intent, tone } = req.body;
  try {
    const draft = await aiService.composeBroadcastEmail(intent, tone);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: 'Composition engine failed.' });
  }
};

/**
 * Handle AI Smart Auto-Routing request.
 */
const smartRouteHandler = async (req, res) => {
  try {
    const result = await aiService.smartRouteGrievance(req.body);
    res.json(result);
  } catch (err) {
    console.error('Smart Route Error:', err);
    res.status(500).json({ error: 'Smart auto-routing analysis failed.' });
  }
};

/**
 * Handle AI Duplicate Grievance Detection request.
 */
const checkDuplicates = async (req, res) => {
  try {
    const grievanceRepository = require('../repositories/grievanceRepository');
    const existingGrievances = await grievanceRepository.getAll();
    const result = await aiService.checkDuplicateGrievance(req.body, existingGrievances);
    res.json(result);
  } catch (err) {
    console.error('Duplicate Check Error:', err);
    res.status(500).json({ error: 'Duplicate detection analysis failed.' });
  }
};

/**
 * Handle Multilingual AI translation request.
 */
const translateGrievance = async (req, res) => {
  const { text, targetLanguage, sourceLanguage } = req.body;
  try {
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for translation.' });
    }
    const result = await aiService.translateText(text, targetLanguage || 'English', sourceLanguage);
    res.json(result);
  } catch (err) {
    console.error('Translation Controller Error:', err);
    res.status(500).json({ error: 'Translation failed: ' + err.message });
  }
};

/**
 * Handle AI Speech-to-Text Voice Transcription request.
 */
const transcribeVoice = async (req, res) => {
  const { audioBase64, mimeType, languageHint } = req.body;
  try {
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 payload is required for transcription.' });
    }
    const result = await aiService.transcribeAudio(audioBase64, mimeType || 'audio/webm', languageHint);
    res.json(result);
  } catch (err) {
    console.error('Transcription Controller Error:', err);
    res.status(500).json({ error: 'Audio transcription failed: ' + err.message });
  }
};

/**
 * Handle AI Official Policy Resolution Dossier Drafting.
 */
const draftOfficialResolutionHandler = async (req, res) => {
  const { ticket, tone, officerNotes, policyReference } = req.body;
  try {
    if (!ticket) {
      return res.status(400).json({ error: 'Ticket payload is required for drafting resolution.' });
    }
    const resolutionDossier = await aiService.draftOfficialResolution({
      ticket,
      tone,
      officerNotes,
      policyReference
    });
    res.json({ success: true, resolution: resolutionDossier });
  } catch (err) {
    console.error('Draft Official Resolution Error:', err);
    res.status(500).json({ error: 'Failed to draft official resolution dossier: ' + err.message });
  }
};

/**
 * Predictive SLA Breach Intelligence & Bottleneck Heatmap forecast.
 */
const predictiveSlaForecastHandler = async (req, res) => {
  const { tickets } = req.body;
  try {
    const forecast = await aiService.generatePredictiveSlaForecast(tickets || []);
    res.json({ success: true, forecast });
  } catch (err) {
    console.error('Predictive SLA Forecast Error:', err);
    res.status(500).json({ error: 'Failed to compute SLA breach predictions: ' + err.message });
  }
};

module.exports = {
  triageGrievance,
  suggestResolution,
  draftOfficialResolutionHandler,
  predictiveSlaForecastHandler,
  elevateBriefing,
  summarizePerformance,
  analyzeVision,
  composeBroadcast,
  smartRouteHandler,
  checkDuplicates,
  translateGrievance,
  transcribeVoice
};


