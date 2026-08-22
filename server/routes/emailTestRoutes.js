/**
 * Email Test Routes — /api/v1/test-email
 *
 * Provides endpoints to:
 *   1. Verify SMTP connectivity (GET /api/v1/test-email/verify)
 *   2. Send all email types for delivery proof (POST /api/v1/test-email/send-all)
 *   3. Send a single email type (POST /api/v1/test-email/send)
 *
 * Usage:
 *   POST /api/v1/test-email/send-all
 *   Body: { "to": "recipient@example.com" }
 */

const express = require('express');
const router  = express.Router();
const nodemailer   = require('nodemailer');
const emailService = require('../services/emailService');
const configService = require('../services/configService');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Ensure email test endpoints require authenticated administrator session
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'super admin'));

// ─── Helper: run one email dispatch and capture result ──────────────────────
const runTest = async (label, fn) => {
  const start = Date.now();
  try {
    const info = await fn();
    const duration = Date.now() - start;
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
      label,
      status: 'sent',
      duration_ms: duration,
      messageId: info.messageId || null,
      previewUrl: previewUrl || null
    };
  } catch (err) {
    return {
      label,
      status: 'failed',
      duration_ms: Date.now() - start,
      error: err.message
    };
  }
};

// ─── GET /api/v1/test-email/verify ──────────────────────────────────────────
// Checks SMTP connectivity without sending any mail.
router.get('/verify', async (req, res) => {
  const start = Date.now();
  try {
    await emailService.verifyTransporter();
    const host        = configService.getSetting('smtp_host', process.env.SMTP_HOST || 'unknown');
    const port        = configService.getSetting('smtp_port', process.env.SMTP_PORT || 587);
    const user        = configService.getSetting('smtp_username', process.env.SMTP_EMAIL || 'unknown');
    const ssl         = configService.getSetting('smtp_ssl', false);
    const senderEmail = configService.getSetting('sender_email', process.env.SMTP_EMAIL || 'unknown');

    return res.json({
      status: 'ok',
      smtp: {
        host,
        port,
        user,
        ssl,
        senderEmail
      },
      latency_ms: Date.now() - start,
      message: '✅ SMTP connection verified successfully.'
    });
  } catch (err) {
    const host = configService.getSetting('smtp_host', process.env.SMTP_HOST || 'unknown');
    const port = configService.getSetting('smtp_port', process.env.SMTP_PORT || 587);
    const user = configService.getSetting('smtp_username', process.env.SMTP_EMAIL || 'unknown');

    return res.status(500).json({
      status: 'error',
      smtp: { host, port, user },
      error: err.message,
      latency_ms: Date.now() - start,
      message: '❌ SMTP connection failed.',
      troubleshooting: [
        'Check SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD in .env',
        'For Gmail: ensure SMTP_PASSWORD is an App Password (not your regular password)',
        'Enable 2FA on Gmail then generate App Password at myaccount.google.com/apppasswords',
        'For Gmail, SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_SSL=false',
        'Check that "Less Secure Apps" or App Passwords is enabled for the Gmail account'
      ]
    });
  }
});

// ─── POST /api/v1/test-email/send-all ───────────────────────────────────────
// Sends one of each email type to the given address. Returns full delivery report.
router.post('/send-all', async (req, res) => {
  const to = req.body.to || req.query.to || process.env.ADMIN_EMAIL;

  if (!to) {
    return res.status(400).json({ error: 'Provide a recipient email in body: { "to": "your@email.com" }' });
  }

  console.log(`\n📧 [Test Email] Starting full delivery suite to: ${to}\n`);

  // 1. Verify SMTP first
  let smtpOk = false;
  let smtpError = null;
  try {
    await emailService.verifyTransporter();
    smtpOk = true;
  } catch (err) {
    smtpError = err.message;
  }

  const results = [];
  const MOCK_OTP         = '847293';
  const MOCK_TICKET_ID   = 'TKT-TEST-001';
  const MOCK_TICKET_TITLE = 'Test Grievance: Hostel Water Supply Issue';

  // ── 2. OTP Email (Registration) ─────────────────────────────────────────
  results.push(await runTest('OTP Email (Registration)', () =>
    emailService.sendOTPEmail(to, MOCK_OTP, 'registration')
  ));

  // ── 3. OTP Email (Forgot Password) ──────────────────────────────────────
  results.push(await runTest('OTP Email (Forgot Password)', () =>
    emailService.sendForgotPasswordOTPEmail(to, MOCK_OTP)
  ));

  // ── 4. OTP Email (MFA / Login) ──────────────────────────────────────────
  results.push(await runTest('OTP Email (MFA)', () =>
    emailService.sendMFAOTPEmail(to, MOCK_OTP)
  ));

  // ── 5. Welcome Email ────────────────────────────────────────────────────
  results.push(await runTest('Welcome Email', () =>
    emailService.sendWelcomeEmail(to, 'Test User', null)
  ));

  // ── 6. Grievance Created Email ──────────────────────────────────────────
  const mockSla = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  results.push(await runTest('Grievance Created Email', () =>
    emailService.sendGrievanceEmail(to, MOCK_TICKET_ID, MOCK_TICKET_TITLE, 'Hostel & Infrastructure', 'High', 'Facilities & Maintenance', mockSla, null)
  ));

  // ── 7. Grievance Assigned Email ─────────────────────────────────────────
  results.push(await runTest('Grievance Assigned Email (Officer)', () =>
    emailService.sendGrievanceAssignedEmail(to, MOCK_TICKET_ID, MOCK_TICKET_TITLE, 'High', 'Infrastructure')
  ));

  // ── 8. Grievance Resolved Email ─────────────────────────────────────────
  results.push(await runTest('Grievance Resolved Email', async () => {
    // Use sendDirectEmail directly since userId is null in test context
    const notificationService = require('../services/notificationService');
    const data = require('../templates/notifications/grievanceResolved');
    const templateData = data.email.user({
      ticketId: MOCK_TICKET_ID,
      title: MOCK_TICKET_TITLE,
      notes: 'Test resolution: Issue resolved by maintenance team.',
      time: new Date().toLocaleString(),
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(templateData.template, templateData.variables, 'Redressal Verification Complete', 'user');
    return emailService.sendDirectEmail(to, templateData.subject, htmlContent, 'Grievance Resolved (Test)');
  }));

  // ── 9. Security Alert Email ─────────────────────────────────────────────
  results.push(await runTest('Security Alert Email', () =>
    emailService.sendSecurityAlertEmail(null, 'Test security alert: suspicious login detected.', to)
  ));

  // ── 10. SMTP Test Handshake ─────────────────────────────────────────────
  results.push(await runTest('SMTP Handshake Test', () =>
    emailService.sendTestEmail(to)
  ));

  // ─── Build report ───────────────────────────────────────────────────────
  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  const smtpConfig = {
    host:        configService.getSetting('smtp_host', process.env.SMTP_HOST || 'unknown'),
    port:        configService.getSetting('smtp_port', process.env.SMTP_PORT || 587),
    user:        configService.getSetting('smtp_username', process.env.SMTP_EMAIL || 'unknown'),
    ssl:         configService.getSetting('smtp_ssl', false),
    senderEmail: configService.getSetting('sender_email', process.env.SMTP_EMAIL || 'unknown'),
    senderName:  configService.getSetting('sender_name', process.env.SENDER_NAME || 'ResolveNow System')
  };

  const productionScore = Math.round((sent / results.length) * 100);

  console.log(`\n📊 [Test Email] Delivery Report: ${sent}/${results.length} sent\n`);

  return res.json({
    recipient: to,
    smtp_verify: smtpOk ? '✅ SMTP OK' : `❌ SMTP FAILED: ${smtpError}`,
    smtp_config: smtpConfig,
    production_readiness_score: `${productionScore}%`,
    summary: {
      total: results.length,
      sent,
      failed
    },
    results,
    dns_requirements: {
      note: 'For production email deliverability, configure these DNS records for your sender domain:',
      SPF: 'v=spf1 include:_spf.google.com ~all  (for Gmail)',
      DKIM: 'Enable DKIM signing in Google Workspace Admin or use Resend for automatic DKIM',
      DMARC: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
      MX: 'Your domain must have valid MX records pointing to your mail server'
    }
  });
});

// ─── POST /api/v1/test-email/send ───────────────────────────────────────────
// Sends a single email type.
router.post('/send', async (req, res) => {
  const { to, type = 'otp' } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Provide a recipient email in body: { "to": "your@email.com", "type": "otp" }' });
  }

  const validTypes = ['otp', 'forgot-password', 'mfa', 'welcome', 'grievance-created', 'grievance-assigned', 'grievance-resolved', 'security-alert', 'smtp-test'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Valid types: ${validTypes.join(', ')}`
    });
  }

  let result;
  const MOCK_OTP   = '847293';
  const MOCK_TID   = 'TKT-TEST-001';
  const MOCK_TITLE = 'Test Grievance Subject';

  switch (type) {
    case 'otp':
      result = await runTest('OTP Email', () => emailService.sendOTPEmail(to, MOCK_OTP, 'registration'));
      break;
    case 'forgot-password':
      result = await runTest('Forgot Password OTP', () => emailService.sendForgotPasswordOTPEmail(to, MOCK_OTP));
      break;
    case 'mfa':
      result = await runTest('MFA OTP', () => emailService.sendMFAOTPEmail(to, MOCK_OTP));
      break;
    case 'welcome':
      result = await runTest('Welcome Email', () => emailService.sendWelcomeEmail(to, 'Test User', null));
      break;
    case 'grievance-created': {
      const mockSla = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      result = await runTest('Grievance Created', () => emailService.sendGrievanceEmail(to, MOCK_TID, MOCK_TITLE, 'Hostel & Infrastructure', 'High', 'Facilities & Maintenance', mockSla, null));
      break;
    }
    case 'grievance-assigned':
      result = await runTest('Grievance Assigned', () => emailService.sendGrievanceAssignedEmail(to, MOCK_TID, MOCK_TITLE, 'High', 'Infrastructure'));
      break;
    case 'grievance-resolved': {
      const data = require('../templates/notifications/grievanceResolved');
      const templateData = data.email.user({
        ticketId: MOCK_TID,
        title: MOCK_TITLE,
        notes: 'Resolved by test.',
        time: new Date().toLocaleString(),
        frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
      });
      const htmlContent = emailService.compileEmail(templateData.template, templateData.variables, 'Redressal Verification Complete', 'user');
      result = await runTest('Grievance Resolved', () => emailService.sendDirectEmail(to, templateData.subject, htmlContent, 'Grievance Resolved (Test)'));
      break;
    }
    case 'security-alert':
      result = await runTest('Security Alert', () => emailService.sendSecurityAlertEmail(null, 'Test security alert.', to));
      break;
    case 'smtp-test':
      result = await runTest('SMTP Handshake', () => emailService.sendTestEmail(to));
      break;
    default:
      return res.status(400).json({ error: 'Unknown type' });
  }

  return res.json(result);
});

module.exports = router;
