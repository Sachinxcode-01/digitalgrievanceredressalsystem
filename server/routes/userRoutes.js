const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  updateAccount, 
  changePassword, 
  deleteAccount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  validateProfileUpdate, 
  validateAccountUpdate, 
  validateChangePassword 
} = require('../validators/userValidator');

// Ensure all user profile routes require authentication
router.use(authenticateToken);

// @route   GET /api/v1/user/profile
// @desc    Retrieve profile parameter options and security log
router.get('/profile', getProfile);

// @route   PUT /api/v1/user/profile
// @desc    Update user profile configurations (avatar, notifications, name)
router.put('/profile', validateProfileUpdate, updateProfile);

// @route   PUT /api/v1/user/account
// @desc    Update core user account settings (email, mobile)
router.put('/account', validateAccountUpdate, updateAccount);

// @route   POST /api/v1/user/change-password
// @desc    Change password and invalidate other device sessions
router.post('/change-password', validateChangePassword, changePassword);

// @route   DELETE /api/v1/user/account
// @desc    Delete user account and cascade erase all associated DB rows
router.delete('/account', deleteAccount);

// @route   GET /api/v1/user/notifications
// @desc    Retrieve user unread in-app alerts
router.get('/notifications', getNotifications);

// @route   PUT /api/v1/user/notifications/read-all
// @desc    Mark all in-app notices as read
router.put('/notifications/read-all', markAllNotificationsRead);

// @route   PUT /api/v1/user/notifications/:id/read
// @desc    Mark in-app notice as read
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
