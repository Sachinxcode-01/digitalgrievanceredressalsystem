const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, sendWelcome } = require('../controllers/authController');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
router.post('/send-otp', sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP from email
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/send-welcome
// @desc    Send welcome email
router.post('/send-welcome', sendWelcome);

module.exports = router;

