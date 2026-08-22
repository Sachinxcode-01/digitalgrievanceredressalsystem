const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { optionalAuth } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/securityMiddleware');

router.use(chatLimiter);

// @route   POST /api/v1/chat
// @desc    Secure AI resolve bot conversational endpoint
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "I didn't quite catch that." });
    }
    
    const reply = await aiService.getChatResponse(message);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/chat/stream
// @desc    Secure streaming AI resolve bot conversational endpoint
router.post('/stream', optionalAuth, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    const stream = aiService.getChatResponseStream(message);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error("Chat streaming error:", error);
    try {
      const fallbackReply = "Hello! I am your AI Resolution Assistant. Describe your issue and I can help evaluate urgency or assist in quick resolution!";
      res.write(`data: ${JSON.stringify({ text: fallbackReply })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch {
      res.end();
    }
  }
});

module.exports = router;
