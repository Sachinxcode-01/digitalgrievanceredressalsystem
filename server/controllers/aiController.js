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
    res.status(500).json({ error: 'Failed to generate AI suggestion' });
  }
};

module.exports = {
  triageGrievance,
  suggestResolution
};
