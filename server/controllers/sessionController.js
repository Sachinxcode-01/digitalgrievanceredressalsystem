const supabase = require('../config/supabase');
const { revokeSession, revokeAllSessionsExcept, logAudit } = require('../services/sessionService');

/**
 * Retrieve active user sessions
 * GET /api/v1/sessions
 */
const getActiveSessions = async (req, res, next) => {
  const userId = req.user.id;
  const currentSessionId = req.user.session_id;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, ip_address, user_agent, device_info, login_location, last_active_at, expires_at, created_at')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    // Map sessions to specify which is current
    const formattedSessions = (sessions || []).map(s => ({
      ...s,
      isCurrent: s.id === currentSessionId
    }));

    res.json(formattedSessions);
  } catch (err) {
    next(err);
  }
};

/**
 * Revoke specific session ID
 * DELETE /api/v1/sessions/:id
 */
const deleteSession = async (req, res, next) => {
  const userId = req.user.id;
  const sessionId = req.params.id;
  const currentSessionId = req.user.session_id;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Call service to delete session record
    await revokeSession(sessionId, userId);
    await logAudit(userId, 'SESSION_REVOKED', req.ip, req.headers['user-agent'], { revoked_session_id: sessionId });

    // If they revoked their own active session, clear client cookies
    if (sessionId === currentSessionId) {
      res.clearCookie('refresh_token');
      return res.json({ message: 'Current session revoked. You have been logged out.', logoutRequired: true });
    }

    res.json({ message: 'Device session revoked successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Revoke all sessions except the current active session
 * DELETE /api/v1/sessions/all
 */
const deleteAllSessions = async (req, res, next) => {
  const userId = req.user.id;
  const currentSessionId = req.user.session_id;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    await revokeAllSessionsExcept(currentSessionId, userId);
    await logAudit(userId, 'ALL_SESSIONS_REVOKED_EXCEPT_CURRENT', req.ip, req.headers['user-agent']);

    res.json({ message: 'All other devices have been signed out successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActiveSessions,
  deleteSession,
  deleteAllSessions
};
