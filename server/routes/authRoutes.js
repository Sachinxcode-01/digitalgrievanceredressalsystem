const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/authController');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
router.post('/send-otp', sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP from email
router.post('/verify-otp', verifyOtp);

module.exports = router;
