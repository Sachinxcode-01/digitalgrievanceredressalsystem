const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const notificationQueue = require('./notificationQueue');
const supabase = require('../config/supabase');
const configService = require('./configService');

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
    if (supabase) {
      const { data, error } = await supabase.from('email_templates').select('subject, body').eq('name', name).maybeSingle();
      if (data && !error) {
        return { subject: data.subject, body: data.body };
      }
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

/**
 * Preferences guard helper.
 */
const checkPreferenceAndQueue = async (userId, preferenceKey, subject, htmlContent, label, fallbackEmail = null) => {
  let recipientEmail = fallbackEmail;
  let preferences = null;

  if (userId && supabase) {
    try {
      const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
      if (user) recipientEmail = user.email;

      const { data: profile } = await supabase.from('user_profiles').select('notification_preferences').eq('user_id', userId).single();
      if (profile) preferences = profile.notification_preferences;
    } catch (err) {
      console.error('[Notification Preferences] Query failure:', err.message);
    }
  }

  // Critical events bypass preference configurations
  const isCritical = ['otp_verification', 'password_changed', 'account_deleted'].includes(preferenceKey);
  
  if (!isCritical && preferences) {
    const isEnabled = preferences[preferenceKey] !== false; // Default to true if undefined
    if (!isEnabled) {
      console.log(`[Email Service] Skipping dispatch of ${label} to ${recipientEmail} due to preference filter.`);
      return;
    }
  }

  if (!recipientEmail) {
    console.error(`[Email Service] Aborting dispatch: no recipient email found for user ${userId || 'unknown'}`);
    return;
  }

  return queueEmail(recipientEmail, subject, htmlContent, label);
};

// ==========================================
// AUTHENTICATION EMAILS
// ==========================================

const sendWelcomeEmail = async (email, fullName, userId = null) => {
  const htmlContent = compileEmail('welcomeEmail.html', { fullName, email }, 'Identity Verified', 'user');
  const subject = 'Welcome to ResolveNow: Identity Verified';
  return checkPreferenceAndQueue(userId, 'status_updates', subject, htmlContent, 'Welcome Dossier', email);
};

const sendOTPEmail = async (email, otp, purpose = 'registration') => {
  const purposeText = 
    purpose === 'login' ? 'login authentication' :
    purpose === 'forgot_password' ? 'password recovery' : 'account registration';

  const htmlContent = compileEmail('otpEmail.html', { otp, purpose: purposeText }, 'Authentication Dispatch', 'user');
  const subject = `Secure OTP Code: ${otp}`;
  return queueEmail(email, subject, htmlContent, 'OTP Verification');
};

const sendPasswordChangedEmail = async (userId) => {
  const htmlContent = compileEmail('passwordResetEmail.html', {}, 'Security Event: Password Updated', 'user');
  const subject = 'ResolveNow: Password Changed Successfully';
  return checkPreferenceAndQueue(userId, 'password_changed', subject, htmlContent, 'Password Changed Alert');
};

const sendNewDeviceLoginEmail = async (userId, device, browser, time, location = 'Unknown') => {
  const data = securityAlert.email.newDevice({ device, browser, time, location });
  const htmlContent = compileEmail(data.template, data.variables, 'Security Alert: Unknown Sign-in', 'user');
  return checkPreferenceAndQueue(userId, 'security_alerts', data.subject, htmlContent, 'New Device Sign-in');
};

// ==========================================
// GRIEVANCE EMAILS
// ==========================================

const sendGrievanceEmail = async (email, ticketId, title, userId = null) => {
  const data = grievanceCreated.email.user({
    ticketId,
    title,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });
  const htmlContent = compileEmail(data.template, data.variables, 'Filing Confirmation', 'user');
  return checkPreferenceAndQueue(userId, 'status_updates', data.subject, htmlContent, 'Ticket Confirmation', email);
};

const sendGrievanceAssignedEmail = async (officerEmail, ticketId, title, priority, category) => {
  const data = grievanceAssigned.email.officer({
    ticketId,
    title,
    category,
    priority,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });
  const htmlContent = compileEmail(data.template, data.variables, 'Officer Task Assigned', 'admin');
  return queueEmail(officerEmail, data.subject, htmlContent, 'Assignment Alert');
};

const sendGrievanceStatusUpdatedEmail = async (userId, ticketId, title, oldStatus, newStatus) => {
  const htmlContent = compileEmail('grievanceUpdatedEmail.html', {
    ticketId,
    title,
    oldStatus,
    newStatus
  }, 'Timeline Milestone Updated', 'user');
  const subject = `ResolveNow Status Update: #${ticketId}`;
  return checkPreferenceAndQueue(userId, 'status_updates', subject, htmlContent, 'Status Milestone Update');
};

const sendResolutionCompletedEmail = async (userId, ticketId, title, notes, time) => {
  const data = grievanceResolved.email.user({
    ticketId,
    title,
    notes,
    time: new Date(time).toLocaleString(),
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });
  const htmlContent = compileEmail(data.template, data.variables, 'Redressal Verification Complete', 'user');
  return checkPreferenceAndQueue(userId, 'status_updates', data.subject, htmlContent, 'Resolution Complete');
};

const sendCommentAddedEmail = async (targetUserId, commentText, ticketId, authorName) => {
  let isTargetAdmin = false;
  if (targetUserId && supabase) {
    try {
      const { data: user } = await supabase.from('users').select('role').eq('id', targetUserId).single();
      if (user && (user.role === 'admin' || user.role === 'super admin')) {
        isTargetAdmin = true;
      }
    } catch (err) {
      console.warn('[Email Service] Failed to resolve target user role status:', err.message);
    }
  }

  const formatter = isTargetAdmin ? commentAdded.email.admin : commentAdded.email.user;
  const data = formatter({
    ticketId,
    title: 'Grievance Comment',
    commentText,
    authorName,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });

  const htmlContent = compileEmail(data.template, data.variables, isTargetAdmin ? 'Response Received' : 'Grievance Comment Posted', isTargetAdmin ? 'admin' : 'user');
  return checkPreferenceAndQueue(targetUserId, 'comment_notifications', data.subject, htmlContent, 'Comment Notification');
};

// ==========================================
// ADMINISTRATIVE ALERTS
// ==========================================

const sendNewGrievanceAlertEmail = async (ticketId, title, category, urgency) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const data = grievanceCreated.email.admin({
    ticketId,
    title,
    category,
    urgency,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });
  const htmlContent = compileEmail(data.template, data.variables, 'Administrative Triage Alert', 'admin');
  return queueEmail(adminEmail, data.subject, htmlContent, 'New Grievance Notification');
};

const sendEscalatedGrievanceAlertEmail = async (ticketId, title, category, frustrationIndex) => {
  const seniorAdminEmail = process.env.ADMIN_EMAIL;
  if (!seniorAdminEmail) return;

  const htmlContent = compileEmail('grievanceSubmittedEmail.html', {
    message: `Ticket <strong>#${ticketId}</strong> has been escalated due to priority SLAs or neural frustration index alerts.`,
    cardTitle: 'Escalation Parameters',
    ticketId,
    title,
    extraDetails: `<p style="margin: 5px 0;"><strong>Sector:</strong> ${category}</p><p style="margin: 5px 0;"><strong>Frustration Level:</strong> <span style="color: #f87171; font-weight: bold;">${frustrationIndex}/10</span></p>`,
    actionText: 'Access the escalations queue immediately.',
    actionUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
    btnClass: 'btn-escalated',
    btnText: 'Access Escalations Queue'
  }, 'Emergency Escalation Briefing', 'admin');

  const subject = `CRITICAL ESCALATION: Ticket #${ticketId}`;
  return queueEmail(seniorAdminEmail, subject, htmlContent, 'Escalated Grievance Alert');
};

const sendHighPriorityTicketAlertEmail = async (officerEmail, ticketId, title, category) => {
  const data = grievanceAssigned.email.highPriority({
    ticketId,
    title,
    category,
    frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  });
  const htmlContent = compileEmail(data.template, data.variables, 'High-Priority Action Required', 'admin');
  return queueEmail(officerEmail, data.subject, htmlContent, 'High Priority Notification');
};

const sendSLABreachWarningEmail = async (ticketId, title, hoursRemaining) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const htmlContent = compileEmail('grievanceSubmittedEmail.html', {
    message: `SLA threshold warnings have triggered for ticket <strong>#${ticketId}</strong>.`,
    cardTitle: 'Breach Parameters',
    ticketId,
    title,
    extraDetails: `<p style="margin: 5px 0;"><strong>Time to Breach:</strong> <span style="color: #f87171; font-weight: 900;">&lt; ${hoursRemaining} Hours</span></p>`,
    actionText: 'Deploy remediation immediately to comply with SLAs.',
    actionUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
    btnClass: 'btn-admin',
    btnText: 'Deploy Remediation'
  }, 'SLA Compliance Warning', 'admin');

  const subject = `SLA BREACH WARNING: #${ticketId}`;
  return queueEmail(adminEmail, subject, htmlContent, 'SLA Warning Alert');
};

const sendDailySummaryReportEmail = async (adminEmail, stats) => {
  const htmlContent = compileEmail('grievanceSubmittedEmail.html', {
    message: 'Here is your daily operational summary of the grievance registry system.',
    cardTitle: 'Active Statistics Summary',
    ticketId: 'N/A',
    title: 'Daily System Diagnostics',
    extraDetails: `
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px 0;">Total Tickets in Registry:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ffffff;">${stats.total}</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px 0;">Awaiting Triage (Pending):</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f59e0b;">${stats.pending}</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px 0;">Escalated Incidents:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ef4444;">${stats.escalated}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">Resolved (Last 24 Hours):</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #10b981;">${stats.resolved}</td>
        </tr>
      </table>
    `,
    actionText: 'Open the admin console to view detailed performance metrics.',
    actionUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
    btnClass: 'btn-admin',
    btnText: 'View Analytics Dashboard'
  }, 'Daily Summary Report', 'admin');

  const subject = 'ResolveNow: Daily Operational Summary';
  return queueEmail(adminEmail, subject, htmlContent, 'Daily Summary Report');
};

// ==========================================
// SYSTEM DISPATCHES
// ==========================================

const sendMaintenanceNotificationEmail = async (emails, maintenanceTime, duration) => {
  const data = systemAnnouncement.email.maintenance({ maintenanceTime, duration });
  const htmlContent = compileEmail(data.template, data.variables, 'System Maintenance Broadcast', 'user');
  return queueEmail(emails, data.subject, htmlContent, 'Maintenance Notice');
};

const sendSecurityAlertEmail = async (userId, alertMessage, fallbackEmail = null) => {
  const data = securityAlert.email.alert({ alertMessage });
  const htmlContent = compileEmail(data.template, data.variables, 'Account Security Warning', 'user');
  return checkPreferenceAndQueue(userId, 'security_alerts', data.subject, htmlContent, 'Security Alert Email', fallbackEmail);
};

const sendAccountDeletionEmail = async (email, fullName) => {
  const htmlContent = compileEmail('accountDeletedEmail.html', { fullName }, 'Account Deactivated', 'user');
  const subject = 'Account Terminated Confirmation: ResolveNow';
  return queueEmail(email, subject, htmlContent, 'Account Deletion Notice');
};

const sendBroadcastEmail = async (emailList, subject, body) => {
  const data = systemAnnouncement.email.announcement({ subject, body });
  const htmlContent = compileEmail(data.template, data.variables, subject, 'user');
  for (const email of emailList) {
    queueEmail(email, subject, htmlContent, 'Broadcast Email');
  }
};

const sendSpecialistBriefing = async (officerEmail, department, ticketId, briefing) => {
  const htmlContent = compileEmail('grievanceSubmittedEmail.html', {
    message: `A ticket briefing has been generated for your review in the <strong>${department}</strong> department.`,
    cardTitle: `Briefing Details (Ticket #${ticketId})`,
    ticketId,
    title: 'Specialist Review Request',
    extraDetails: `<p style="white-space: pre-line; margin: 5px 0;">${briefing}</p>`,
    actionText: 'Open the admin dashboard to review compliance metrics.',
    actionUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances`,
    btnClass: 'btn-admin',
    btnText: 'Open Command Panel'
  }, 'Departmental Specialist Briefing', 'admin');

  const subject = `Specialist Briefing: Ticket #${ticketId}`;
  return queueEmail(officerEmail, subject, htmlContent, 'Specialist Briefing');
};

// ==========================================
// REAL-TIME SYSTEM DATABASE HOOKS
// ==========================================

const handleCommentAddedEvent = async (commentRow) => {
  try {
    const { data: grievance } = await supabase
      .from('grievances')
      .select('user_id, ticket_id, title')
      .eq('id', commentRow.grievance_id)
      .single();

    if (!grievance) return;

    const { data: authorProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', commentRow.user_id)
      .single();

    const authorName = authorProfile ? authorProfile.full_name : 'System Officer';

    const { data: authorUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', commentRow.user_id)
      .single();

    const isAdminComment = authorUser?.role === 'admin' || authorUser?.role === 'super admin';
    
    if (isAdminComment) {
      await sendCommentAddedEmail(grievance.user_id, commentRow.message, grievance.ticket_id, authorName);
    } else {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const data = commentAdded.email.admin({
          ticketId: grievance.ticket_id,
          title: grievance.title,
          commentText: commentRow.message,
          authorName,
          frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
        });
        const htmlContent = compileEmail(data.template, data.variables, `Response Received: #${grievance.ticket_id}`, 'admin');
        await queueEmail(adminEmail, data.subject, htmlContent, 'Admin Notification');
      }
    }
  } catch (err) {
    console.error('[Real-time Comment Hook Failure]:', err.message);
  }
};

const handleGrievanceUpdatedEvent = async (newRow, oldRow) => {
  try {
    const isStatusChanged = oldRow && oldRow.status !== newRow.status;
    
    if (isStatusChanged) {
      await sendGrievanceStatusUpdatedEmail(newRow.user_id, newRow.ticket_id, newRow.title, oldRow.status, newRow.status);

      if (newRow.status === 'Escalated') {
        await sendEscalatedGrievanceAlertEmail(newRow.ticket_id, newRow.title, newRow.category, newRow.frustration_index);
      }
      
      if (newRow.status === 'Resolved') {
        await sendResolutionCompletedEmail(newRow.user_id, newRow.ticket_id, newRow.title, newRow.resolution_notes, newRow.updated_at);
      }
    }
  } catch (err) {
    console.error('[Real-time Grievance Update Hook Failure]:', err.message);
  }
};

module.exports = {
  getTransporter,
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
  handleCommentAddedEvent,
  handleGrievanceUpdatedEvent
};
