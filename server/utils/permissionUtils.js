const { ROLES } = require('../constants');

const roleHierarchy = {
  [ROLES.STUDENT]: [ROLES.STUDENT],
  [ROLES.FACULTY]: [ROLES.FACULTY],
  [ROLES.STAFF]: [ROLES.STAFF],
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY, ROLES.STUDENT],
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY, ROLES.STUDENT]
};

const permissionUtils = {
  /**
   * Evaluates if a role is authorized based on hierarchy level.
   */
  hasRoleAccess(userRole, requiredRole) {
    if (!userRole) return false;
    if (userRole === requiredRole) return true;
    
    const inherited = roleHierarchy[userRole];
    return inherited ? inherited.includes(requiredRole) : false;
  }
};

module.exports = permissionUtils;
