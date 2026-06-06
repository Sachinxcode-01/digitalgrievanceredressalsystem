const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const notificationQueue = require('./notificationQueue');
const configService = require('./configService');
const notificationRepository = require('../repositories/notificationRepository');

// Load notification templates
const grievanceCreated = require('../templates/notifications/grievanceCreated');
const grievanceAssigned = require('../templates/notifications/grievanceAssigned');
const grievanceResolved = require('../templates/notifications/grievanceResolved');
const commentAdded = require('../templates/notifications/commentAdded');
const securityAlert = require('../templates/notifications/securityAlert');
const systemAnnouncement = require('../templates/notifications/systemAnnouncement');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let currentTransporter = null;
let activeSmtpConfigHash = null;

/**
 * Returns a cached transporter or creates a new one if settings changed.
 */
const getTransporter = async () => {
  const emailEnabled = configService.getSetting('enable_email_notifications', true);
  if (!emailEnabled) {
    throw new Error('Email notification delivery is disabled in system settings.');
  }

  const host = configService.getSetting('smtp_host', process.env.SMTP_HOST || 'smtp.ethereal.email');
  const port = parseInt(configService.getSetting('smtp_port', process.env.SMTP_PORT || 587));
  const user = configService.getSetting('smtp_username', process.env.SMTP_EMAIL || '');
  const pass = configService.getSetting('smtp_password', process.env.SMTP_PASSWORD || '');
  const ssl = configService.getSetting('smtp_ssl', false);

  const configHash = `${host}:${port}:${user}:${pass}:${ssl}`;
  if (currentTransporter && activeSmtpConfigHash === configHash) {
    return currentTransporter;
  }

  // Initialize SMTP transport
  if (user && pass && host !== 'smtp.ethereal.email') {
    currentTransporter = nodemailer.createTransport({
      host,
      port,
      secure: ssl,
      auth: { user, pass }
    });
    activeSmtpConfigHash = configHash;
    console.log('📧 Dynamic Real SMTP Transporter initialized.');
  } else {
    // Fallback Ethereal test mail
    const account = await nodemailer.createTestAccount();
    currentTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    activeSmtpConfigHash = configHash;
    console.log('📧 Dynamic Ethereal Test Email Transporter initialized.');
  }

  return currentTransporter;
};

/**
 * Strips HTML tags for plain-text fallback.
 */
const stripHtml = (html) => {
  return html
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const templatesCache = new Map();

/**
 * Reads a template file from templates directory.
 */
const readTemplateFile = (fileName) => {
  const filePath = path.join(__dirname, '../templates/emails', fileName);
  if (!templatesCache.has(filePath)) {
    try {
      if (fs.existsSync(filePath)) {
        templatesCache.set(filePath, fs.readFileSync(filePath, 'utf8'));
      } else {
        templatesCache.set(filePath, null);
      }
    } catch (err) {
      console.warn(`[Email Service] Failed to read template file: ${filePath}`, err.message);
      templatesCache.set(filePath, null);
    }
  }
  return templatesCache.get(filePath);
};

/**
 * Interpolates template variables.
 */
const interpolateTemplate = (text, variables = {}) => {
  let result = text;
  Object.entries(variables).forEach(([key, val]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, val !== undefined && val !== null ? val : '');
  });
  return result;
};

/**
 * Generates email html using layout and individual templates.
 */
const compileEmail = (templateName, variables = {}, title = '', type = 'user') => {
  const layout = readTemplateFile('emailLayout.html');
  const header = readTemplateFile('header.html');
  const footer = readTemplateFile('footer.html');
  const content = readTemplateFile(templateName);

  if (!layout || !content) {
    return getBaseTemplateLegacy(title, interpolateTemplate(content || '', variables), type);
  }

  const headerClass = type === 'admin' ? 'header-admin' : 'header-user';
  const headerBg = type === 'admin' 
    ? 'linear-gradient(135deg, #1e1b4b 0%, #311080 100%)' 
    : 'linear-gradient(135deg, #090e1a 0%, #1e3a8a 100%)';

  const institutionName = configService.getSetting('institution_name', 'ResolveNow');
  const supportEmail = configService.getSetting('support_email', 'support@resolvenow.system');
  const year = new Date().getFullYear().toString();

  const baseVars = {
    title,
    headerBg,
    headerClass,
    institution_name: institutionName,
    support_email: supportEmail,
    year,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  };

  const allVars = { ...baseVars, ...variables };

  const compiledHeader = header ? interpolateTemplate(header, allVars) : '';
  const compiledFooter = footer ? interpolateTemplate(footer, allVars) : '';
  const compiledContent = interpolateTemplate(content, allVars);

  const emailHtml = layout
    .replace('{{header}}', compiledHeader)
    .replace('{{content}}', compiledContent)
    .replace('{{footer}}', compiledFooter);

  return interpolateTemplate(emailHtml, allVars);
};

/**
 * Legacy HTML template generator (fallback)
 */
const getBaseTemplateLegacy = (title, content, type = 'user') => {
  const headerBg = type === 'admin' 
    ? 'linear-gradient(135deg, #1e1b4b 0%, #311080 100%)' 
    : 'linear-gradient(135deg, #090e1a 0%, #1e3a8a 100%)';
  const accentColor = type === 'admin' ? '#7209b7' : '#4361ee';
  
  const institutionName = configService.getSetting('institution_name', 'ResolveNow');
  const supportEmail = configService.getSetting('support_email', 'support@resolvenow.system');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      background-color: #020617;
      color: #cbd5e1;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #020617;
      padding: 30px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0b1329;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: ${headerBg};
      padding: 35px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    .content {
      padding: 40px;
      color: #94a3b8;
      line-height: 1.6;
      font-size: 14px;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content strong {
      color: #f8fafc;
    }
    .card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      margin: 25px 0;
    }
    .card h3 {
      margin-top: 0;
      color: #ffffff;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 8px;
    }
    .highlight {
      background: rgba(67, 97, 238, 0.08);
      color: #38bdf8;
      padding: 18px;
      border-radius: 14px;
      font-weight: 900;
      font-size: 26px;
      text-align: center;
      letter-spacing: 0.25em;
      border: 1px dashed rgba(56, 189, 248, 0.3);
      margin: 25px 0;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-top: 10px;
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.25);
      text-align: center;
    }
    .footer {
      background: #050814;
      padding: 25px;
      text-align: center;
      color: #475569;
      font-size: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${institutionName} Network Operations Center</p>
        <p>Support channel: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        <p>This is an automated operational dispatch. Do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Queries templates from database with fallbacks
 */
const getEmailTemplate = async (name, fallbackSubject, fallbackBody) => {
  try {
    const data = await notificationRepository.findEmailTemplate(name);
    if (data) {
      return { subject: data.subject, body: data.body };
    }
  } catch (err) {
    console.error(`[Email Service] Template fetch failed for ${name}:`, err.message);
  }
  return { subject: fallbackSubject, body: fallbackBody };
};

/**
 * Core enqueuing function
 */
const queueEmail = (email, subject, htmlContent, label) => {
  const taskFn = async () => {
    const transporter = await getTransporter();
    
    const senderName = configService.getSetting('sender_name', 'ResolveNow Core Dispatch');
    const senderEmail = configService.getSetting('sender_email', 'no-reply@resolvenow.system');

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject,
      html: htmlContent,
      text: stripHtml(htmlContent)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ${label} dispatched to ${email}`);
    if (info.messageId && !process.env.SMTP_EMAIL) {
       console.log(`➡️ Preview Email (Test URL): ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  };

  notificationQueue.enqueue('EMAIL', { to: email, subject, type: label }, taskFn);
};

// ==========================================
// AUTHENTICATION EMAILS (Backward Compatible Wrappers calling notificationService)
// ==========================================
const sendWelcomeEmail = async (email, fullName, userId = null) => {
  const notificationService = require('./notificationService');
  return notificationService.sendWelcomeEmail(email, fullName, userId);
};

const sendOTPEmail = async (email, otp, purpose = 'registration') => {
  const notificationService = require('./notificationService');
  return notificationService.sendOTPEmail(email, otp, purpose);
};

const sendPasswordChangedEmail = async (userId) => {
  const notificationService = require('./notificationService');
  return notificationService.sendPasswordChangedEmail(userId);
};

const sendNewDeviceLoginEmail = async (userId, device, browser, time, location = 'Unknown') => {
  const notificationService = require('./notificationService');
  return notificationService.sendNewDeviceLoginEmail(userId, device, browser, time, location);
};

// ==========================================
// GRIEVANCE EMAILS
// ==========================================
const sendGrievanceEmail = async (email, ticketId, title, userId = null) => {
  const notificationService = require('./notificationService');
  return notificationService.sendGrievanceEmail(email, ticketId, title, userId);
};

const sendGrievanceAssignedEmail = async (officerEmail, ticketId, title, priority, category) => {
  const notificationService = require('./notificationService');
  return notificationService.sendGrievanceAssignedEmail(officerEmail, ticketId, title, priority, category);
};

const sendGrievanceStatusUpdatedEmail = async (userId, ticketId, title, oldStatus, newStatus) => {
  const notificationService = require('./notificationService');
  return notificationService.sendGrievanceStatusUpdatedEmail(userId, ticketId, title, oldStatus, newStatus);
};

const sendResolutionCompletedEmail = async (userId, ticketId, title, notes, time) => {
  const notificationService = require('./notificationService');
  return notificationService.sendResolutionCompletedEmail(userId, ticketId, title, notes, time);
};

const sendCommentAddedEmail = async (targetUserId, commentText, ticketId, authorName) => {
  const notificationService = require('./notificationService');
  return notificationService.sendCommentAddedEmail(targetUserId, commentText, ticketId, authorName);
};

// ==========================================
// ADMINISTRATIVE ALERTS
// ==========================================
const sendNewGrievanceAlertEmail = async (ticketId, title, category, urgency) => {
  const notificationService = require('./notificationService');
  return notificationService.sendNewGrievanceAlertEmail(ticketId, title, category, urgency);
};

const sendEscalatedGrievanceAlertEmail = async (ticketId, title, category, frustrationIndex) => {
  const notificationService = require('./notificationService');
  return notificationService.sendEscalatedGrievanceAlertEmail(ticketId, title, category, frustrationIndex);
};

const sendHighPriorityTicketAlertEmail = async (officerEmail, ticketId, title, category) => {
  const notificationService = require('./notificationService');
  return notificationService.sendHighPriorityTicketAlertEmail(officerEmail, ticketId, title, category);
};

const sendSLABreachWarningEmail = async (ticketId, title, hoursRemaining) => {
  const notificationService = require('./notificationService');
  return notificationService.sendSLABreachWarningEmail(ticketId, title, hoursRemaining);
};

const sendDailySummaryReportEmail = async (adminEmail, stats) => {
  const notificationService = require('./notificationService');
  return notificationService.sendDailySummaryReportEmail(adminEmail, stats);
};

// ==========================================
// SYSTEM DISPATCHES
// ==========================================
const sendMaintenanceNotificationEmail = async (emails, maintenanceTime, duration) => {
  const notificationService = require('./notificationService');
  return notificationService.sendMaintenanceNotificationEmail(emails, maintenanceTime, duration);
};

const sendSecurityAlertEmail = async (userId, alertMessage, fallbackEmail = null) => {
  const notificationService = require('./notificationService');
  return notificationService.sendSecurityAlertEmail(userId, alertMessage, fallbackEmail);
};

const sendAccountDeletionEmail = async (email, fullName) => {
  const notificationService = require('./notificationService');
  return notificationService.sendAccountDeletionEmail(email, fullName);
};

const sendBroadcastEmail = async (emailList, subject, body) => {
  const notificationService = require('./notificationService');
  return notificationService.sendBroadcastEmail(emailList, subject, body);
};

const sendSpecialistBriefing = async (officerEmail, department, ticketId, briefing) => {
  const notificationService = require('./notificationService');
  return notificationService.sendSpecialistBriefing(officerEmail, department, ticketId, briefing);
};

const sendTestEmail = async (testEmail) => {
  const transporter = await getTransporter();
  const senderName = configService.getSetting('sender_name', 'ResolveNow Core Dispatch');
  const senderEmail = configService.getSetting('sender_email', 'no-reply@resolvenow.system');

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: testEmail,
    subject: 'ResolveNow System Configuration Test Handshake',
    text: 'SMTP Link Operational. Your system settings handshake succeeded.',
    html: `
      <div style="font-family: sans-serif; background-color: #020617; color: #cbd5e1; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.05);">
        <h2 style="color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">SMTP Test Success</h2>
        <p>SMTP Link Operational. Your system settings handshake succeeded.</p>
        <p style="color: #64748b; font-size: 11px;">Dispatched from host: ${configService.getSetting('smtp_host', '')}</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  getTransporter,
  compileEmail,
  queueEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendPasswordChangedEmail,
  sendNewDeviceLoginEmail,
  sendGrievanceEmail,
  sendGrievanceAssignedEmail,
  sendGrievanceStatusUpdatedEmail,
  sendResolutionCompletedEmail,
  sendCommentAddedEmail,
  sendNewGrievanceAlertEmail,
  sendEscalatedGrievanceAlertEmail,
  sendHighPriorityTicketAlertEmail,
  sendSLABreachWarningEmail,
  sendDailySummaryReportEmail,
  sendMaintenanceNotificationEmail,
  sendSecurityAlertEmail,
  sendAccountDeletionEmail,
  sendBroadcastEmail,
  sendSpecialistBriefing,
  sendTestEmail
};
