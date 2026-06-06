const express = require('express');
const router = express.Router();
const { 
  broadcastToAll, 
  getHealthMetrics,
  listUsers,
  updateUserRole,
  updateUserStatus,
  listSystemAuditLogs
} = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateBroadcast } = require('../middleware/validationMiddleware');

// Ensure all routes are protected
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super admin'));

// @route   POST /api/v1/admin/broadcast
// @desc    Send bulk email to all users (restricted to admin clearance)
router.post('/broadcast', validateBroadcast, broadcastToAll);

// @route   GET /api/v1/admin/health-metrics
// @desc    Retrieve detailed server and database telemetry
router.get('/health-metrics', getHealthMetrics);

// @route   GET /api/v1/admin/users
// @desc    Retrieve all registered system users
router.get('/users', listUsers);

// @route   PUT /api/v1/admin/users/:id/role
// @desc    Update clearance role for specific user
router.put('/users/:id/role', updateUserRole);

// @route   PUT /api/v1/admin/users/:id/status
// @desc    Update lockout status for specific user
router.put('/users/:id/status', updateUserStatus);

// @route   GET /api/v1/admin/audit
// @desc    Retrieve system security logs
router.get('/audit', listSystemAuditLogs);

module.exports = router;
