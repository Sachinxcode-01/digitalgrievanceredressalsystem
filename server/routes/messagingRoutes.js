const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super admin', 'officer'));

// @route   POST /api/v1/messaging/dispatch
// @desc    Dispatch live/simulated message to WhatsApp / Telegram / SMS
router.post('/dispatch', async (req, res) => {
  try {
    const { channel, recipient, ticket, eventType, customNote } = req.body;
    const result = await messagingService.dispatchMessage({
      channel,
      recipient,
      ticket,
      eventType,
      customNote
    });
    res.json(result);
  } catch (err) {
    console.error('Messaging Dispatch Error:', err);
    res.status(400).json({ error: err.message });
  }
});

// @route   GET /api/v1/messaging/logs
// @desc    Get recent mobile message dispatch logs
router.get('/logs', (req, res) => {
  res.json({ logs: messagingService.getMessageLogs() });
});

// @route   POST /api/v1/messaging/simulate-reply
// @desc    Simulate interactive citizen reply (Acknowledge / Rate)
router.post('/simulate-reply', async (req, res) => {
  try {
    const { ticketId, actionType, rating, comment } = req.body;
    const result = await messagingService.simulateCitizenResponse({
      ticketId,
      actionType,
      rating,
      comment
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
