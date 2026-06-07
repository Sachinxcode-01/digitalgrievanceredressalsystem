const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable missing');
}

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
        .limit(1)
        .maybeSingle();
      console.log("Supabase response (sessionAuth):", session);
      console.log("Supabase error (sessionAuth):", error);

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

    // Block admin/super admin dashboard and API access if MFA has not been completed
    const userRole = decoded.role || 'student';
    if ((userRole === 'admin' || userRole === 'super admin') && !decoded.mfa_verified) {
      return res.status(403).json({ error: 'Multi-Factor Authentication (MFA) required. Access denied.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: userRole,
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

/**
 * Permission-Based Access Control Middleware.
 * Resolves user role, queries its permissions from the database, and enforces them.
 */
const authorizePermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized session.' });
    }

    const userRole = req.user.role;
    
    // Super admins bypass all permission checks
    if (userRole === 'super admin') {
      return next();
    }

    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Database service unavailable' });
      }

      // Query permissions associated with the user's role
      const { data: roleData, error } = await supabase
        .from('roles')
        .select(`
          id,
          role_permissions (
            permissions (name)
          )
        `)
        .eq('name', userRole)
        .maybeSingle();

      if (error || !roleData) {
        return res.status(403).json({ error: `Access denied. Role [${userRole}] has no registered permissions.` });
      }

      const permissions = (roleData.role_permissions || []).map(rp => rp.permissions?.name).filter(Boolean);

      // Verify that all required permissions are granted to the role
      const hasAllPermissions = requiredPermissions.every(perm => permissions.includes(perm));

      if (!hasAllPermissions) {
        return res.status(403).json({
          error: `Insufficient permissions. Required privileges: [${requiredPermissions.join(', ')}]. Access denied for role: ${userRole}`
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
  JWT_SECRET
};
