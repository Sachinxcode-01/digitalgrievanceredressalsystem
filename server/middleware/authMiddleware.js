const jwt = require('jsonwebtoken');
const { getAuth, clerkClient } = require('@clerk/express');
const userRepository = require('../repositories/userRepository');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
const userCache = new Map();

/**
 * Enterprise Authentication Middleware
 * Decodes and verifies incoming requests containing Clerk session tokens.
 * Automatically falls back to standard JWT validation for backward compatibility and test environments.
 */
const authenticateToken = async (req, res, next) => {
  // 1. Attempt Legacy/Local JWT Verification First
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  let tokenExpiredOrInvalid = false;

  if (!token && req.cookies) {
    token = req.cookies.access_token;
  }

  if (token && JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userRole = decoded.role || 'student';

      // Verify MFA requirement for legacy admin sessions
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
    } catch (jwtErr) {
      // If it's a valid bearer token format but verification fails,
      // it might be a Clerk token, so we fall through to Clerk.
      tokenExpiredOrInvalid = true;
    }
  }

  // 2. Attempt Clerk Authentication
  try {
    if (req.auth) {
      const authState = getAuth(req);
      const userId = authState?.userId;

      if (userId) {
        let email = null;
        let fullName = 'Clerk User';

        const cached = userCache.get(userId);
        if (cached && cached.expiresAt > Date.now()) {
          email = cached.email;
          fullName = cached.fullName;
        } else {
          const clerkUser = await clerkClient.users.getUser(userId);
          email = clerkUser.emailAddresses[0]?.emailAddress;
          fullName = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Clerk User';
          
          userCache.set(userId, {
            email,
            fullName,
            expiresAt: Date.now() + 5 * 60 * 1000
          });
        }

        if (!email) {
          return res.status(400).json({ error: 'Authenticated Clerk user has no primary email address.' });
        }

        // Lookup local user
        let dbUser = await userRepository.findByEmail(email).catch(() => null);
        if (!dbUser) {
          // Sync on demand (auto-register)
          const clerkUser = await clerkClient.users.getUser(userId);
          const role = clerkUser.unsafeMetadata?.role || 'student';
          const name = clerkUser.unsafeMetadata?.fullName || fullName;
          const mobile = clerkUser.unsafeMetadata?.mobileNumber || clerkUser.phoneNumbers[0]?.phoneNumber || null;

          dbUser = await userRepository.create({
            email,
            mobile_number: mobile,
            password_hash: 'clerk-managed',
            role: role,
            status: 'active',
            email_verified: true,
            phone_verified: !!clerkUser.phoneNumbers[0] || !!clerkUser.unsafeMetadata?.mobileNumber
          });

          await userRepository.createProfile({
            user_id: dbUser.id,
            full_name: name,
            notification_preferences: { email: true, sms: true }
          });

          // Refetch
          dbUser = await userRepository.findByEmail(email).catch(() => null);
        }

        if (!dbUser) {
          return res.status(500).json({ error: 'Failed to synchronize authenticated session with database.' });
        }

        if (dbUser.status === 'locked') {
          return res.status(403).json({ error: 'This account has been locked. Please contact support.' });
        }

        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          full_name: dbUser.full_name || fullName,
          clerk_id: userId
        };

        return next();
      }
    }
  } catch (clerkErr) {
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(__dirname, '../../server_errors.log');
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] Clerk Auth Middleware Error\nError: ${clerkErr.message}\nStack: ${clerkErr.stack}\n\n`;
      fs.appendFileSync(logPath, logMessage);
    } catch (fsErr) {
      console.error('Failed to write to server_errors.log:', fsErr.message);
    }
  }

  if (tokenExpiredOrInvalid) {
    return res.status(403).json({ error: 'Access denied: session invalid or expired.' });
  }

  return res.status(401).json({ error: 'Access token required. Authorization denied.' });
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
