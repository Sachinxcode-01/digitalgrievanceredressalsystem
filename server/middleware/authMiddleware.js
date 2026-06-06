const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'resolvenow-enterprise-secret-2026';

/**
 * Enterprise Authentication Middleware
 * Decodes and verifies incoming requests containing JWT authorization.
 * Supports header tokens and cookie fallbacks, checking active session revocation.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Fallback to cookie
  if (!token && req.cookies) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Authorization denied.' });
  }

  // Verify JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check database session active status (revocation capability)
    if (supabase && decoded.session_id) {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('id, expires_at')
        .eq('id', decoded.session_id)
        .single();

      if (error || !session) {
        return res.status(401).json({ error: 'Your session has been revoked or signed out.' });
      }

      if (new Date() > new Date(session.expires_at)) {
        return res.status(401).json({ error: 'Session has expired.' });
      }

      // Async update last active time to avoid blocking
      supabase
        .from('sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', decoded.session_id)
        .then(() => {})
        .catch(err => console.error('Failed to update session activity:', err.message));
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'student',
      full_name: decoded.full_name,
      session_id: decoded.session_id
    };

    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Access denied: session invalid or expired.' });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Restricts route access to specified roles. Supports Student, Faculty, Staff, Admin, Super Admin.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized session.' });
    }

    // Role hierarchy checking or exact match
    // Super Admin inherits Admin roles
    let userRole = req.user.role;
    if (userRole === 'super admin' && allowedRoles.includes('admin')) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Clearance level required: [${allowedRoles.join(', ')}]. Access denied for: ${req.user.role}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
