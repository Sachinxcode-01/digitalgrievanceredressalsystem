const express = require('express');
const router = express.Router();
const { getActiveSessions, deleteSession, deleteAllSessions } = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Ensure all session routes require authorization
router.use(authenticateToken);

// @route   GET /api/v1/sessions
// @desc    Retrieve all active login sessions
router.get('/', getActiveSessions);

// @route   DELETE /api/v1/sessions/all
// @desc    Revoke all sessions except current active
router.delete('/all', deleteAllSessions);

// @route   DELETE /api/v1/sessions/:id
// @desc    Revoke single session ID
router.delete('/:id', deleteSession);

module.exports = router;
