const express = require('express');
const router = express.Router();
const { 
  broadcastToAll, 
  getHealthMetrics,
  listUsers,
  updateUserRole,
  updateUserStatus,
  listSystemAuditLogs,
  createUser,
  updateUser,
  deleteUser,
  getUserActivity,
  getComplianceStats,
  getComplianceReports,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
} = require('../controllers/adminController');
const { authenticateToken, authorizeRoles, authorizePermissions } = require('../middleware/authMiddleware');
const { 
  validateBroadcast, 
  validateCreateRole, 
  validateUpdateRole 
} = require('../validators/adminValidator');
const {
  validateCreateUser,
  validateUpdateUser,
  validateRoleAssignment,
  validateUserStatusUpdate
} = require('../validators/userValidator');
const {
  validateUpdateSettings,
  validateTestEmail,
  validateTestSms,
  validateCreateDepartment,
  validateUpdateDepartment,
  validateCreateSlaRule,
  validateUpdateSlaRule,
  validateCreateEscalationRule,
  validateUpdateEscalationRule
} = require('../validators/settingsValidator');
const {
  getSettings,
  updateSettings,
  testEmail,
  testSms,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSlaRules,
  createSlaRule,
  updateSlaRule,
  deleteSlaRule,
  getEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  getEmailTemplates,
  updateEmailTemplate,
  getSmsTemplates,
  updateSmsTemplate,
  clearCache,
  runBackup,
  checkSlaBreachesRoute
} = require('../controllers/settingsController');

// Ensure all routes are protected
router.use(authenticateToken);

// --- 1. Broadcast & Health Telemetry ---
// Broadcast email (restricted to admin clearance)
router.post('/broadcast', authorizePermissions('manage_settings'), validateBroadcast, broadcastToAll);

// Retrieve detailed server and database telemetry
router.get('/health-metrics', authorizePermissions('view_analytics'), getHealthMetrics);

// --- 2. Users Management Routes ---
// Retrieve all registered system users
router.get('/users', authorizePermissions('manage_users'), listUsers);

// Create user
router.post('/users', authorizePermissions('manage_users'), validateCreateUser, createUser);

// Update user details
router.put('/users/:id', authorizePermissions('manage_users'), validateUpdateUser, updateUser);

// Delete user
router.delete('/users/:id', authorizePermissions('manage_users'), deleteUser);

// Update clearance role for specific user (legacy fallback support)
router.put('/users/:id/role', authorizePermissions('manage_users'), validateRoleAssignment, updateUserRole);

// Update lockout status for specific user
router.put('/users/:id/status', authorizePermissions('manage_users'), validateUserStatusUpdate, updateUserStatus);

// Fetch logs for a specific user
router.get('/users/:id/activity', authorizePermissions('view_audit_logs'), getUserActivity);

// --- 3. Audit & Compliance Routes ---
// Retrieve system security logs
router.get('/audit', authorizePermissions('view_audit_logs'), listSystemAuditLogs);

// Retrieve Compliance Metrics
router.get('/compliance/stats', authorizePermissions('view_analytics'), getComplianceStats);

// Generate Compliance reports (CSV/JSON)
router.get('/compliance/reports', authorizePermissions('view_analytics'), getComplianceReports);

// --- 4. Roles & Permissions Management ---
// Fetch all roles with their assigned permissions
router.get('/roles', authorizePermissions('manage_roles'), getRoles);

// Create a new role
router.post('/roles', authorizePermissions('manage_roles'), validateCreateRole, createRole);

// Update role permissions
router.put('/roles/:id', authorizePermissions('manage_roles'), validateUpdateRole, updateRole);

// Delete custom role
router.delete('/roles/:id', authorizePermissions('manage_roles'), deleteRole);

// Get all available permissions
router.get('/permissions', authorizePermissions('manage_roles'), getPermissions);

// --- 5. System Settings & Configuration Center ---
// Get all system settings grouped by category
router.get('/settings', authorizePermissions('manage_settings'), getSettings);

// Bulk update settings
router.put('/settings', authorizePermissions('manage_settings'), validateUpdateSettings, updateSettings);

// SMTP email check dispatch
router.post('/settings/test-email', authorizePermissions('manage_settings'), validateTestEmail, testEmail);

// SMS Gateway check dispatch
router.post('/settings/test-sms', authorizePermissions('manage_settings'), validateTestSms, testSms);

// CRUD Departments
router.get('/departments', authorizePermissions('manage_settings'), getDepartments);
router.post('/departments', authorizePermissions('manage_settings'), validateCreateDepartment, createDepartment);
router.put('/departments/:id', authorizePermissions('manage_settings'), validateUpdateDepartment, updateDepartment);
router.delete('/departments/:id', authorizePermissions('manage_settings'), deleteDepartment);

// CRUD SLA Rules
router.get('/settings/sla-rules', authorizePermissions('manage_settings'), getSlaRules);
router.post('/settings/sla-rules', authorizePermissions('manage_settings'), validateCreateSlaRule, createSlaRule);
router.put('/settings/sla-rules/:id', authorizePermissions('manage_settings'), validateUpdateSlaRule, updateSlaRule);
router.delete('/settings/sla-rules/:id', authorizePermissions('manage_settings'), deleteSlaRule);

// CRUD Escalation Rules
router.get('/settings/escalation-rules', authorizePermissions('manage_settings'), getEscalationRules);
router.post('/settings/escalation-rules', authorizePermissions('manage_settings'), validateCreateEscalationRule, createEscalationRule);
router.put('/settings/escalation-rules/:id', authorizePermissions('manage_settings'), validateUpdateEscalationRule, updateEscalationRule);
router.delete('/settings/escalation-rules/:id', authorizePermissions('manage_settings'), deleteEscalationRule);

// Templates Management
router.get('/settings/templates/email', authorizePermissions('manage_settings'), getEmailTemplates);
router.put('/settings/templates/email/:id', authorizePermissions('manage_settings'), updateEmailTemplate);
router.get('/settings/templates/sms', authorizePermissions('manage_settings'), getSmsTemplates);
router.put('/settings/templates/sms/:id', authorizePermissions('manage_settings'), updateSmsTemplate);

// Maintenance Mode Operations
router.post('/settings/maintenance/cache', authorizePermissions('manage_settings'), clearCache);
router.post('/settings/maintenance/backup', authorizePermissions('manage_settings'), runBackup);

// SLA Background Breach Trigger (Cron)
router.post('/settings/cron/check-slas', authorizePermissions('manage_settings'), checkSlaBreachesRoute);

// --- 6. Executive Board Governance Digest ---
router.get('/reports/executive-digest/preview', async (req, res, next) => {
  const reportService = require('../services/reportService');
  try {
    const digest = await reportService.generateExecutiveBoardDigest();
    res.json({ success: true, digest });
  } catch (err) {
    next(err);
  }
});

router.post('/reports/executive-digest/email', async (req, res, next) => {
  const reportService = require('../services/reportService');
  const emailService = require('../services/emailService');
  const { recipientEmail } = req.body;
  try {
    const digest = await reportService.generateExecutiveBoardDigest();
    const targetEmail = recipientEmail || process.env.ADMIN_EMAIL || 'executive-board@institution.edu';
    
    await emailService.sendGrievanceEmail(
      targetEmail,
      'GOVERNANCE-DIGEST',
      `🏛️ Executive Board Governance Digest (${new Date().toLocaleDateString('en-IN')})`,
      'Executive Governance',
      'HIGH',
      'Administration',
      new Date().toISOString(),
      req.user ? req.user.id : null
    );

    res.json({
      success: true,
      message: `Executive Board Governance Digest successfully dispatched to ${targetEmail}.`,
      metrics: digest.metrics
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
