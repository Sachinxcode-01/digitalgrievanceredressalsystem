/**
 * Application Configuration & Global Constants
 * Centralizes environment configs, SLA thresholds, and domain metadata.
 */
export const APP_CONFIG = {
  name: 'ResolveNow',
  shortName: 'ResolveNow',
  version: '2.4.0',
  tagline: 'AI-Powered Digital Grievance Redressal System',
  supportEmail: 'grievance-support@institution.edu',
  apiPrefix: '/api/v1',
  clerkFallbackKey: 'pk_test_Zml0dGluZy1veC00Ny5jbGVyay5hY2NvdW50cy5kZXYk',

  slaHours: {
    critical: 12,
    high: 24,
    medium: 48,
    low: 72,
  },

  roles: {
    STUDENT: 'student',
    OFFICER: 'officer',
    FACULTY: 'faculty',
    STAFF: 'staff',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super admin',
  },

  urgencyLevels: [
    { value: 'low', label: 'Low (Within 72 Hours)', color: 'text-slate-400 bg-slate-800/40' },
    { value: 'medium', label: 'Medium (Within 48 Hours)', color: 'text-blue-400 bg-blue-900/30' },
    { value: 'high', label: 'High (Within 24 Hours)', color: 'text-amber-400 bg-amber-900/30' },
    { value: 'critical', label: 'Critical (Within 12 Hours)', color: 'text-rose-400 bg-rose-900/30' },
  ],

  categories: [
    'Academic & Curriculum',
    'Hostel & Residential Facilities',
    'Examinations & Grading',
    'Financial, Scholarships & Accounts',
    'Campus Infrastructure & Maintenance',
    'Harassment & Discrimination',
    'Library & Laboratory Resources',
    'Placement & Career Guidance',
    'Other Administration',
  ],

  statuses: {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    REJECTED: 'Rejected',
    ESCALATED: 'Escalated',
  },
};

export default APP_CONFIG;
