const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const notificationQueue = require('./notificationQueue');
const supabase = require('../config/supabase');
const configService = require('./configService');

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

/**
 * Generates unified ResolveNow enterprise branding wrapper.
 */
const getBaseTemplate = (title, content, type = 'user') => {
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
 * Placeholder interpolation helper
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
  const fallbackSubject = 'Welcome to ResolveNow: Identity Verified';
  const fallbackBody = `
    <p>Hello <strong>{{fullName}}</strong>,</p>
    <p>Welcome to the <strong>ResolveNow Institutional Network</strong>. Your account registration was successful and your access has been initialized.</p>
    <div class="card">
      <h3>Access Dossier</h3>
      <p style="margin: 5px 0;"><strong>Identity Reference:</strong> {{email}}</p>
      <p style="margin: 5px 0;"><strong>Portal Status:</strong> Operational</p>
    </div>
    <p>Use the link below to enter the console and track your filings.</p>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}" class="btn">Enter Secure Portal</a>
  `;

  const { subject, body } = await getEmailTemplate('welcome_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { fullName, email });
  const interpolatedBody = interpolateTemplate(body, { fullName, email });

  return checkPreferenceAndQueue(userId, 'status_updates', interpolatedSubject, getBaseTemplate('Identity Verified', interpolatedBody), 'Welcome Dossier', email);
};

const sendOTPEmail = async (email, otp, purpose = 'registration') => {
  const purposeText = 
    purpose === 'login' ? 'login authentication' :
    purpose === 'forgot_password' ? 'password recovery' : 'account registration';

  const fallbackSubject = 'Secure OTP Code: {{otp}}';
  const fallbackBody = `
    <p>Hello,</p>
    <p>A One-Time Password (OTP) has been generated to verify your identity for <strong>{{purpose}}</strong>.</p>
    <div class="highlight">{{otp}}</div>
    <p>For your security, this code is valid for exactly <strong>5 minutes</strong>. Do not share this credential with anyone.</p>
    <p>If you did not initiate this request, contact system security response immediately.</p>
  `;

  const { subject, body } = await getEmailTemplate('otp_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { otp, purpose: purposeText });
  const interpolatedBody = interpolateTemplate(body, { otp, purpose: purposeText });

  return queueEmail(email, interpolatedSubject, getBaseTemplate('Authentication Dispatch', interpolatedBody), 'OTP Verification');
};

const sendPasswordChangedEmail = async (userId) => {
  const fallbackSubject = 'ResolveNow: Password Changed Successfully';
  const fallbackBody = `
    <p>Hello,</p>
    <p>This is confirmation that the password for your ResolveNow account has been <strong>successfully updated</strong>.</p>
    <p>All other active sessions on different browsers and devices have been automatically terminated for safety.</p>
    <div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);">
      <h3>Security Warning</h3>
      <p style="margin: 0; color: #f87171;">If you did not authorize this change, please recover your account immediately or notify system security.</p>
    </div>
  `;

  const { subject, body } = await getEmailTemplate('password_changed_email', fallbackSubject, fallbackBody);

  return checkPreferenceAndQueue(userId, 'password_changed', subject, getBaseTemplate('Security Event: Password Updated', body), 'Password Changed Alert');
};

const sendNewDeviceLoginEmail = async (userId, device, browser, time, location = 'Unknown') => {
  const content = `
    <p>Hello,</p>
    <p>We detected a new sign-in to your account from an unknown device.</p>
    <div class="card">
      <h3>Session Details</h3>
      <p style="margin: 5px 0;"><strong>Device OS:</strong> ${device}</p>
      <p style="margin: 5px 0;"><strong>Browser Engine:</strong> ${browser}</p>
      <p style="margin: 5px 0;"><strong>Access Time:</strong> ${time}</p>
      <p style="margin: 5px 0;"><strong>Geographic Origin:</strong> ${location}</p>
    </div>
    <p>If this was you, no action is required. Otherwise, change your credentials immediately.</p>
  `;
  return checkPreferenceAndQueue(userId, 'security_alerts', 'ResolveNow: Access from New Device Detected', getBaseTemplate('Security Alert: Unknown Sign-in', content), 'New Device Sign-in');
};

// ==========================================
// GRIEVANCE EMAILS
// ==========================================

const sendGrievanceEmail = async (email, ticketId, title, userId = null) => {
  const fallbackSubject = 'Grievance Recorded: #{{ticketId}}';
  const fallbackBody = `
    <p>Hello,</p>
    <p>We have successfully registered your grievance. An administrative officer will review the report shortly.</p>
    <div class="card">
      <h3>Filing Metadata</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Subject sector:</strong> {{title}}</p>
      <p style="margin: 5px 0;"><strong>Processing Status:</strong> Pending Review</p>
    </div>
    <p>Use the link below to track real-time milestones and read administrator updates.</p>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/track?ticketId={{ticketId}}" class="btn">Track Filing Milestones</a>
  `;

  const { subject, body } = await getEmailTemplate('grievance_created_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { ticketId, title });
  const interpolatedBody = interpolateTemplate(body, { ticketId, title });

  return checkPreferenceAndQueue(userId, 'status_updates', interpolatedSubject, getBaseTemplate('Filing Confirmation', interpolatedBody), 'Ticket Confirmation', email);
};

const sendGrievanceAssignedEmail = async (officerEmail, ticketId, title, priority, category) => {
  const fallbackSubject = 'ASSIGNMENT ALERT: Ticket #{{ticketId}}';
  const fallbackBody = `
    <p>Hello Officer,</p>
    <p>A new grievance ticket has been assigned to your review queue.</p>
    <div class="card">
      <h3>Assignment Parameters</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> {{title}}</p>
      <p style="margin: 5px 0;"><strong>Category Group:</strong> {{category}}</p>
      <p style="margin: 5px 0;"><strong>Urgency Rating:</strong> {{priority}}</p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #7209b7;">Open Command Panel</a>
  `;

  const { subject, body } = await getEmailTemplate('grievance_assigned_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { ticketId, title, category, priority });
  const interpolatedBody = interpolateTemplate(body, { ticketId, title, category, priority });

  return queueEmail(officerEmail, interpolatedSubject, getBaseTemplate('Officer Task Assigned', interpolatedBody, 'admin'), 'Assignment Alert');
};

const sendGrievanceStatusUpdatedEmail = async (userId, ticketId, title, oldStatus, newStatus) => {
  const fallbackSubject = 'ResolveNow Status Update: #{{ticketId}}';
  const fallbackBody = `
    <p>Hello,</p>
    <p>Your grievance filing <strong>#{{ticketId}}</strong> has advanced to a new status milestone.</p>
    <div class="card" style="text-align: center; background: rgba(67, 97, 238, 0.05);">
      <p style="font-size: 16px; margin: 0;">
        <span style="color: #64748b; text-decoration: line-through;">{{oldStatus}}</span> 
        <strong style="color: #38bdf8; margin: 0 15px;">➡️</strong> 
        <strong style="color: #38bdf8; text-transform: uppercase;">{{newStatus}}</strong>
      </p>
    </div>
    <p>Subject: <em>"{{title}}"</em></p>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">View Timeline Log</a>
  `;

  const { subject, body } = await getEmailTemplate('grievance_status_updated_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { ticketId, title, oldStatus, newStatus });
  const interpolatedBody = interpolateTemplate(body, { ticketId, title, oldStatus, newStatus });

  return checkPreferenceAndQueue(userId, 'status_updates', interpolatedSubject, getBaseTemplate('Timeline Milestone Updated', interpolatedBody), 'Status Milestone Update');
};

const sendResolutionCompletedEmail = async (userId, ticketId, title, notes, time) => {
  const fallbackSubject = 'RESOLVED: Grievance #{{ticketId}} Resolved';
  const fallbackBody = `
    <p>Hello,</p>
    <p>Your grievance filing <strong>#{{ticketId}}</strong> has been successfully resolved.</p>
    <div class="card">
      <h3>Resolution Statement</h3>
      <p style="font-style: italic;">"{{notes}}"</p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;"><strong>Resolved At:</strong> {{time}}</p>
    </div>
    <p>Your feedback is valuable to our quality metrics. Please take a brief moment to rate the redressal process.</p>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn" style="background: #10b981;">Complete Feedback Survey</a>
  `;

  const { subject, body } = await getEmailTemplate('resolution_completed_email', fallbackSubject, fallbackBody);
  const interpolatedSubject = interpolateTemplate(subject, { ticketId, title, notes, time: new Date(time).toLocaleString() });
  const interpolatedBody = interpolateTemplate(body, { ticketId, title, notes, time: new Date(time).toLocaleString() });

  return checkPreferenceAndQueue(userId, 'status_updates', interpolatedSubject, getBaseTemplate('Redressal Verification Complete', interpolatedBody), 'Resolution Complete');
};

const sendCommentAddedEmail = async (targetUserId, commentText, ticketId, authorName) => {
  const content = `
    <p>Hello,</p>
    <p>A new comment has been added to ticket <strong>#${ticketId}</strong> by <strong>${authorName}</strong>.</p>
    <div class="card">
      <h3>Comment Details</h3>
      <p style="font-style: italic; margin: 0;">"${commentText}"</p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Reply to Message</a>
  `;
  return checkPreferenceAndQueue(targetUserId, 'comment_notifications', `New Response: #${ticketId}`, getBaseTemplate('Grievance Comment Posted', content), 'Comment Notification');
};

// ==========================================
// ADMINISTRATIVE ALERTS
// ==========================================

const sendNewGrievanceAlertEmail = async (ticketId, title, category, urgency) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const content = `
    <p>Hello Operations Team,</p>
    <p>A new ticket has been reported on the network index and is awaiting triage clearance.</p>
    <div class="card">
      <h3>Ticket Index</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>Sector Category:</strong> ${category}</p>
      <p style="margin: 5px 0;"><strong>Urgency Rating:</strong> <span style="color: #ef4444; font-weight: 900;">${urgency}</span></p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #7209b7;">Access Command Panel</a>
  `;
  return queueEmail(adminEmail, `ALERT: New Grievance #${ticketId} Submitted`, getBaseTemplate('Administrative Alert: New Grievance', content, 'admin'), 'New Grievance Notification');
};

const sendEscalatedGrievanceAlertEmail = async (ticketId, title, category, frustrationIndex) => {
  const seniorAdminEmail = process.env.ADMIN_EMAIL;
  if (!seniorAdminEmail) return;

  const content = `
    <p>Attention Senior Admin,</p>
    <p>Ticket <strong>#${ticketId}</strong> has been escalated due to priority SLAs or neural frustration index alerts.</p>
    <div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);">
      <h3>Escalation Parameters</h3>
      <p style="margin: 5px 0;"><strong>Ticket:</strong> #${ticketId} - ${title}</p>
      <p style="margin: 5px 0;"><strong>Sector:</strong> ${category}</p>
      <p style="margin: 5px 0;"><strong>Frustration Level:</strong> <span style="color: #f87171; font-weight: bold;">${frustrationIndex}/10</span></p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #ef4444;">Access Escalations Queue</a>
  `;
  return queueEmail(seniorAdminEmail, `CRITICAL ESCALATION: Ticket #${ticketId}`, getBaseTemplate('Emergency Escalation Briefing', content, 'admin'), 'Escalated Grievance Alert');
};

const sendHighPriorityTicketAlertEmail = async (officerEmail, ticketId, title, category) => {
  const content = `
    <p>Hello Officer,</p>
    <p>A high-priority incident is registered in your segment queue requiring immediate intervention.</p>
    <div class="card" style="border-left: 4px solid #f59e0b;">
      <h3>Incident parameters</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #f59e0b;">Triage Incident</a>
  `;
  return queueEmail(officerEmail, `HIGH PRIORITY ASSIGNMENT: #${ticketId}`, getBaseTemplate('High-Priority Action Required', content, 'admin'), 'High Priority Notification');
};

const sendSLABreachWarningEmail = async (ticketId, title, hoursRemaining) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const content = `
    <p>Hello Operations Team,</p>
    <p>SLA threshold warnings have triggered for ticket <strong>#${ticketId}</strong>.</p>
    <div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);">
      <h3>Breach Parameters</h3>
      <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
      <p style="margin: 5px 0;"><strong>Subject:</strong> ${title}</p>
      <p style="margin: 5px 0;"><strong>Time to Breach:</strong> <span style="color: #f87171; font-weight: 900;">&lt; ${hoursRemaining} Hours</span></p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #7209b7;">Deploy Remediation</a>
  `;
  return queueEmail(adminEmail, `SLA BREACH WARNING: #${ticketId}`, getBaseTemplate('SLA Compliance Warning', content, 'admin'), 'SLA Warning Alert');
};

const sendDailySummaryReportEmail = async (adminEmail, stats) => {
  const content = `
    <p>Hello Administrator,</p>
    <p>Here is your daily operational summary of the grievance registry system.</p>
    <div class="card">
      <h3>Active Statistics Summary</h3>
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
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard" class="btn">View Analytics Dashboard</a>
  `;
  return queueEmail(adminEmail, 'ResolveNow: Daily Operational Summary', getBaseTemplate('Daily Summary Report', content, 'admin'), 'Daily Summary Report');
};

// ==========================================
// SYSTEM DISPATCHES
// ==========================================

const sendMaintenanceNotificationEmail = async (emails, maintenanceTime, duration) => {
  const content = `
    <p>Hello,</p>
    <p>The ResolveNow institutional network has scheduled system maintenance to deploy kernel upgrades.</p>
    <div class="card" style="border-left: 4px solid #38bdf8;">
      <h3>Maintenance Window</h3>
      <p style="margin: 5px 0;"><strong>Start Time:</strong> ${maintenanceTime}</p>
      <p style="margin: 5px 0;"><strong>Estimated Period:</strong> ${duration}</p>
    </div>
    <p>During this window, neural classifiers and real-time synchronizations might be temporarily degraded.</p>
  `;
  return queueEmail(emails, 'ResolveNow Scheduled Maintenance Notification', getBaseTemplate('System Maintenance Broadcast', content), 'Maintenance Notice');
};

const sendSecurityAlertEmail = async (userId, alertMessage, fallbackEmail = null) => {
  const content = `
    <p>Hello,</p>
    <p>A security alert has been logged on your account.</p>
    <div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);">
      <h3>Security Log</h3>
      <p style="margin: 0; color: #f87171;">${alertMessage}</p>
    </div>
    <p>If you did not execute this action, lock your account immediately and contact security support.</p>
  `;
  return checkPreferenceAndQueue(userId, 'security_alerts', 'ResolveNow: Security Alert', getBaseTemplate('Account Security Warning', content), 'Security Alert Email', fallbackEmail);
};

const sendAccountDeletionEmail = async (email, fullName) => {
  const content = `
    <p>Hello ${fullName},</p>
    <p>Your account deletion request has been processed. All associated profile data, active sessions, and verification profiles have been permanently removed from the primary databases.</p>
    <p>Thank you for using ResolveNow. We wish you the best.</p>
  `;
  return queueEmail(email, 'Account Terminated Confirmation: ResolveNow', getBaseTemplate('Account Deactivated', content), 'Account Deletion Notice');
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
        const content = `
          <p>A citizen has posted a comment to ticket <strong>#${grievance.ticket_id}</strong>:</p>
          <div class="card">
            <h3>Comment text</h3>
            <p style="font-style: italic;">"${commentRow.message}"</p>
          </div>
          <p>Author: ${authorName}</p>
          <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #7209b7;">Open Command Panel</a>
        `;
        await queueEmail(adminEmail, `User Response on Ticket #${grievance.ticket_id}`, getBaseTemplate(`Response Received: #${grievance.ticket_id}`, content, 'admin'), 'Admin Notification');
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

const sendBroadcastEmail = async (emailList, subject, body) => {
  const htmlContent = getBaseTemplate(subject, body, 'user');
  for (const email of emailList) {
    queueEmail(email, subject, htmlContent, 'Broadcast Email');
  }
};

const sendSpecialistBriefing = async (officerEmail, department, ticketId, briefing) => {
  const content = `
    <p>Hello Specialist,</p>
    <p>A ticket briefing has been generated for your review in the <strong>${department}</strong> department.</p>
    <div class="card">
      <h3>Briefing Details (Ticket #${ticketId})</h3>
      <p style="white-space: pre-line;">${briefing}</p>
    </div>
    <a href="${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard?tab=grievances" class="btn" style="background: #7209b7;">Open Command Panel</a>
  `;
  return queueEmail(officerEmail, `Specialist Briefing: Ticket #${ticketId}`, getBaseTemplate('Departmental Specialist Briefing', content, 'admin'), 'Specialist Briefing');
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
