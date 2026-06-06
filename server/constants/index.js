const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  STAFF: 'staff',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super admin'
};

const PERMISSIONS = {
  VIEW_TICKETS: 'view_tickets',
  CREATE_TICKETS: 'create_tickets',
  ASSIGN_TICKETS: 'assign_tickets',
  RESOLVE_TICKETS: 'resolve_tickets',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_ANALYTICS: 'view_analytics'
};

const STATUSES = {
  NEW: 'New',
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated'
};

const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  IN_APP: 'IN_APP'
};

const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_RESOLVED: 'TICKET_RESOLVED',
  TICKET_ESCALATED: 'TICKET_ESCALATED',
  SESSION_REVOKED: 'SESSION_REVOKED'
};

const APP_CONFIG = {
  DEFAULT_PORT: 5000,
  SLA_HOURS_HIGH: 24,
  SLA_HOURS_MEDIUM: 72,
  SLA_HOURS_LOW: 120
};

module.exports = {
  ROLES,
  PERMISSIONS,
  STATUSES,
  PRIORITIES,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
  APP_CONFIG
};
