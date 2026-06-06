const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/securityMiddleware');

router.use(chatLimiter);

// @route   POST /api/v1/chat
// @desc    Secure AI resolve bot conversational endpoint
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "I didn't quite catch that." });
    }
    
    // --- Neural AI Intercept (Gemini Pro) ---
    const neuralReply = await geminiService.getChatResponse(message);
    if (neuralReply) {
      return res.json({ reply: neuralReply });
    }

    // --- Legacy Fallback Logic ---
    const text = message.toLowerCase();
    let reply = "I'm a digital assistant. Could you provide a bit more detail about your issue so I can help you correctly categorize it before we submit a ticket?";

    // Intelligent Mock Resolution Rules
    if (text.includes('password') || text.includes('cannot login') || text.includes('reset')) {
      reply = "It sounds like you need a password reset! You don't actually need to file an IT Ticket for this. You can instantly reset your credentials by visiting the 'Account' settings tab, bypassing the wait time. 🚀";
    } else if (text.includes('wifi') || text.includes('internet connecting')) {
      reply = "Campus Wi-Fi (EduNet) is currently undergoing scheduled maintenance in Wing B. If you are in Wing A or C, please ensure your DNS is set to automatic. Does this solve your issue, or should we still file a ticket?";
    } else if (text.includes('scholarship') || text.includes('fee') || text.includes('payment')) {
      reply = "Financial queries are generally processed within 48 hours. If you need immediate tuition receipts, you can download them directly from the Student Portal without filing a grievance.";
    } else if (text.includes('hello') || text.includes('hi ')) {
      reply = "Hello there! I am your AI Resolve Assistant. Before you file a manual ticket, describe your issue to me and I will see if I can resolve it instantly!";
    }

    res.json({ reply });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/chat/stream
// @desc    Secure streaming AI resolve bot conversational endpoint
router.post('/stream', authenticateToken, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const hasApiKey = !!process.env.GEMINI_API_KEY;
    if (hasApiKey) {
      const stream = geminiService.getChatResponseStream(message);
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    } else {
      // Mock streaming
      const text = message.toLowerCase();
      let reply = "I'm a digital assistant. Could you provide a bit more detail about your issue so I can help you correctly categorize it before we submit a ticket?";

      if (text.includes('password') || text.includes('cannot login') || text.includes('reset')) {
        reply = "It sounds like you need a password reset! You don't actually need to file an IT Ticket for this. You can instantly reset your credentials by visiting the 'Account' settings tab, bypassing the wait time. 🚀";
      } else if (text.includes('wifi') || text.includes('wifi connecting') || text.includes('internet')) {
        reply = "Campus Wi-Fi (EduNet) is currently undergoing scheduled maintenance in Wing B. If you are in Wing A or C, please ensure your DNS is set to automatic. Does this solve your issue, or should we still file a ticket?";
      } else if (text.includes('scholarship') || text.includes('fee') || text.includes('payment')) {
        reply = "Financial queries are generally processed within 48 hours. If you need immediate tuition receipts, you can download them directly from the Student Portal without filing a grievance.";
      } else if (text.includes('hello') || text.includes('hi ')) {
        reply = "Hello there! I am your AI Resolve Assistant. Before you file a manual ticket, describe your issue to me and I will see if I can resolve it instantly!";
      }

      const words = reply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise(r => setTimeout(r, 60)); // realistic streaming speed
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error("Chat streaming failed:", error);
    res.write(`data: ${JSON.stringify({ error: "AI stream connection interrupted." })}\n\n`);
    res.end();
  }
});

module.exports = router;
