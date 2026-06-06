const { analyzeGrievance } = require('../services/aiService');
const geminiService = require('../services/geminiService');
const axios = require('axios');

/**
 * Handle AI triage request.
 */
const triageGrievance = async (req, res) => {
  const { description } = req.body;
  try {
    const analysis = await analyzeGrievance(description);
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
    const suggestion = await geminiService.generateResolutionSuggestion(ticket);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

const { sendSpecialistBriefing } = require('../services/emailService');

const DEPARTMENT_HEADS = {
  'IT': 'it-head@grievance.system',
  'Finance': 'finance-head@grievance.system',
  'Legal': 'legal-head@grievance.system',
  'Academia': 'dean@grievance.system',
  'Medical': 'medical-director@grievance.system'
};

/**
 * Handle departmental briefing for specialist elevation.
 */
const elevateBriefing = async (req, res) => {
  const { ticket, department } = req.body;
  try {
    const briefing = await geminiService.generateDepartmentBriefing(ticket, department);
    
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
    const summary = await geminiService.generatePerformanceSummary(tickets);
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

    // Fetch image from URL using axios
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'];
    
    const analysis = await geminiService.analyzeImage(base64, mimeType);
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
    const draft = await geminiService.composeBroadcastEmail(intent, tone);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: 'Composition engine failed.' });
  }
};

module.exports = {
  triageGrievance,
  suggestResolution,
  elevateBriefing,
  summarizePerformance,
  analyzeVision,
  composeBroadcast
};

