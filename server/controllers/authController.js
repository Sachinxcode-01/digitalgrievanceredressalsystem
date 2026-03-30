const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');


// Global store for OTPs for simple state management.
// In a real application, you'd store this in Redis or Supabase.
global.otpStore = {};

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the OTP with a 5-minute expiry
  global.otpStore[email] = {
    otp,
    expiresIn: Date.now() + 5 * 60 * 1000
  };

  try {
    const info = await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to your email successfully!', testUrl: require('nodemailer').getTestMessageUrl(info) || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP email: ' + err.message });
  }
};

const verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const storedData = global.otpStore[email];

  if (!storedData) {
    return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
  }

  if (Date.now() > storedData.expiresIn) {
    delete global.otpStore[email];
    return res.status(400).json({ error: 'OTP has expired.' });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ error: 'Incorrect OTP.' });
  }

  // Valid OTP!
  delete global.otpStore[email]; // clean it up after successful verification
  
  res.json({ message: 'OTP verified successfully.', token: 'dummy_jwt_token_for_auth' });
};

const sendWelcome = async (req, res) => {
  const { email, fullName } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  try {
    await sendWelcomeEmail(email, fullName || 'New User');
    res.json({ message: 'Welcome email transmitted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send welcome email.' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  sendWelcome
};

