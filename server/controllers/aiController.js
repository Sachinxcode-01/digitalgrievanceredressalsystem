const { analyzeGrievance } = require('../services/aiService');

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

module.exports = {
  triageGrievance
};
