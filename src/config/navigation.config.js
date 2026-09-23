/**
 * Central Navigation Schema
 * Defines navigation links per role for sidebar, navbar, and quick access docks.
 */
export const NAVIGATION_CONFIG = {
  public: [
    { label: 'Overview', path: '/' },
    { label: 'Public Tracking', path: '/public-status' },
    { label: 'System Status', path: '/status' },
    { label: 'Transparency', path: '/transparency' },
    { label: 'Knowledge Base', path: '/knowledge-base' },
    { label: 'Officer Directory', path: '/officers' },
  ],

  student: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Submit Grievance', path: '/submit', icon: 'PlusCircle' },
    { label: 'My Grievances', path: '/my-grievances', icon: 'FileText' },
    { label: 'Reports & Analytics', path: '/reports', icon: 'BarChart3' },
    { label: 'Appeal Grievance', path: '/appeal', icon: 'AlertTriangle' },
  ],

  officer: [
    { label: 'Officer Console', path: '/officer/dashboard', icon: 'ShieldCheck' },
    { label: 'Grievance Queue', path: '/officer/queue', icon: 'Inbox' },
    { label: 'Knowledge Deflector', path: '/knowledge-base', icon: 'BookOpen' },
  ],

  admin: [
    { label: 'Executive Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'All Grievances', path: '/admin/grievances', icon: 'Inbox' },
    { label: 'User Directory', path: '/admin/users', icon: 'Users' },
    { label: 'Department Structure', path: '/admin/departments', icon: 'Building2' },
    { label: 'Officer Workloads', path: '/admin/officers', icon: 'UserCheck' },
    { label: 'Security & Audit Logs', path: '/admin/audit', icon: 'Shield' },
    { label: 'System Health', path: '/admin/health', icon: 'Activity' },
    { label: 'Compliance Telemetry', path: '/admin/compliance', icon: 'CheckCircle2' },
    { label: 'Predictive Insights', path: '/admin/insights', icon: 'TrendingUp' },
    { label: 'System Configuration', path: '/admin/system', icon: 'Settings' },
  ],
};

export default NAVIGATION_CONFIG;
