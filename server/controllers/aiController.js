const { analyzeGrievance } = require('../services/aiService');
const geminiService = require('../services/geminiService');

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

/**
 * Handle departmental briefing for specialist elevation.
 */
const elevateBriefing = async (req, res) => {
  const { ticket, department } = req.body;
  try {
    const briefing = await geminiService.generateDepartmentBriefing(ticket, department);
    res.json({ briefing });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
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

module.exports = {
  triageGrievance,
  suggestResolution,
  elevateBriefing,
  summarizePerformance
};
