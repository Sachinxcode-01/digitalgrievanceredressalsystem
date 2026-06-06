import React from 'react';
import { useAuth } from '../providers/AuthProvider';

/**
 * RoleGuard component checks user role level.
 * Can hide components or render fallbacks based on authorization.
 */
export const RoleGuard = ({ allowedRoles = [], fallback = null, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return fallback;
  }

  // Super Admin bypasses normal Admin limits, and Faculty/Staff can be configured
  const userRole = user.role?.toLowerCase();
  
  const hasAccess = allowedRoles.map(r => r.toLowerCase()).includes(userRole) || 
                    (userRole === 'super admin' && allowedRoles.map(r => r.toLowerCase()).includes('admin'));

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

export default RoleGuard;
