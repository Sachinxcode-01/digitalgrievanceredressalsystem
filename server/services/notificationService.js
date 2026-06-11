const userRepository = require('../repositories/userRepository');
const grievanceRepository = require('../repositories/grievanceRepository');
const emailService = require('./emailService');
const smsService = require('./smsService');

const checkPreferenceAndQueue = async (userId, preferenceKey, subject, htmlContent, label, fallbackEmail = null) => {
  let recipientEmail = fallbackEmail;
  let preferences = null;

  if (userId) {
    try {
      const user = await userRepository.findById(userId).catch(() => null);
      if (user) recipientEmail = user.email;

      const profile = await userRepository.findProfileByUserId(userId).catch(() => null);
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

  return emailService.queueEmail(recipientEmail, subject, htmlContent, label);
};

const notificationService = {
  // Authentication Emails
  async sendWelcomeEmail(email, fullName, userId = null) {
    const htmlContent = emailService.compileEmail('welcomeEmail.html', { fullName, email }, 'Identity Verified', 'user');
    const subject = 'Welcome to ResolveNow: Identity Verified';
    return checkPreferenceAndQueue(userId, 'status_updates', subject, htmlContent, 'Welcome Dossier', email);
  },

  async sendOTPEmail(email, otp, purpose = 'registration') {
    // Use emailService.sendOTPEmail which sends directly (not queued) for critical auth
    return emailService.sendOTPEmail(email, otp, purpose);
  },


  async sendPasswordChangedEmail(userId) {
    const htmlContent = emailService.compileEmail('passwordResetEmail.html', {}, 'Security Event: Password Updated', 'user');
    const subject = 'ResolveNow: Password Changed Successfully';
    return checkPreferenceAndQueue(userId, 'password_changed', subject, htmlContent, 'Password Changed Alert');
  },

  async sendNewDeviceLoginEmail(userId, device, browser, time, location = 'Unknown') {
    const securityAlert = require('../templates/notifications/securityAlert');
    const data = securityAlert.email.newDevice({ device, browser, time, location });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Security Alert: Unknown Sign-in', 'user');
    return checkPreferenceAndQueue(userId, 'security_alerts', data.subject, htmlContent, 'New Device Sign-in');
  },

  // Grievance Emails
  async sendGrievanceEmail(email, ticketId, title, userId = null) {
    const grievanceCreated = require('../templates/notifications/grievanceCreated');
    const data = grievanceCreated.email.user({
      ticketId,
      title,
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Filing Confirmation', 'user');
    return checkPreferenceAndQueue(userId, 'status_updates', data.subject, htmlContent, 'Ticket Confirmation', email);
  },

  async sendGrievanceAssignedEmail(officerEmail, ticketId, title, priority, category) {
    const grievanceAssigned = require('../templates/notifications/grievanceAssigned');
    const data = grievanceAssigned.email.officer({
      ticketId,
      title,
      category,
      priority,
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Officer Task Assigned', 'admin');
    return emailService.queueEmail(officerEmail, data.subject, htmlContent, 'Assignment Alert');
  },

  async sendGrievanceStatusUpdatedEmail(userId, ticketId, title, oldStatus, newStatus) {
    const htmlContent = emailService.compileEmail('grievanceUpdatedEmail.html', {
      ticketId,
      title,
      oldStatus,
      newStatus
    }, 'Timeline Milestone Updated', 'user');
    const subject = `ResolveNow Status Update: #${ticketId}`;
    return checkPreferenceAndQueue(userId, 'status_updates', subject, htmlContent, 'Status Milestone Update');
  },

  async sendResolutionCompletedEmail(userId, ticketId, title, notes, time) {
    const grievanceResolved = require('../templates/notifications/grievanceResolved');
    const data = grievanceResolved.email.user({
      ticketId,
      title,
      notes,
      time: new Date(time).toLocaleString(),
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Redressal Verification Complete', 'user');
    return checkPreferenceAndQueue(userId, 'status_updates', data.subject, htmlContent, 'Resolution Complete');
  },

  async sendCommentAddedEmail(targetUserId, commentText, ticketId, authorName) {
    let isTargetAdmin = false;
    if (targetUserId) {
      try {
        const user = await userRepository.findById(targetUserId).catch(() => null);
        if (user && (user.role === 'admin' || user.role === 'super admin')) {
          isTargetAdmin = true;
        }
      } catch (err) {
        console.warn('[Email Service] Failed to resolve target user role status:', err.message);
      }
    }

    const commentAdded = require('../templates/notifications/commentAdded');
    const formatter = isTargetAdmin ? commentAdded.email.admin : commentAdded.email.user;
    const data = formatter({
      ticketId,
      title: 'Grievance Comment',
      commentText,
      authorName,
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });

    const htmlContent = emailService.compileEmail(data.template, data.variables, isTargetAdmin ? 'Response Received' : 'Grievance Comment Posted', isTargetAdmin ? 'admin' : 'user');
    return checkPreferenceAndQueue(targetUserId, 'comment_notifications', data.subject, htmlContent, 'Comment Notification');
  },

  // Administrative Alerts
  async sendNewGrievanceAlertEmail(ticketId, title, category, urgency) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const grievanceCreated = require('../templates/notifications/grievanceCreated');
    const data = grievanceCreated.email.admin({
      ticketId,
      title,
      category,
      urgency,
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Administrative Triage Alert', 'admin');
    return emailService.queueEmail(adminEmail, data.subject, htmlContent, 'New Grievance Notification');
  },

  async sendEscalatedGrievanceAlertEmail(ticketId, title, category, frustrationIndex) {
    const seniorAdminEmail = process.env.ADMIN_EMAIL;
    if (!seniorAdminEmail) return;

    const htmlContent = emailService.compileEmail('grievanceSubmittedEmail.html', {
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
    return emailService.queueEmail(seniorAdminEmail, subject, htmlContent, 'Escalated Grievance Alert');
  },

  async sendHighPriorityTicketAlertEmail(officerEmail, ticketId, title, category) {
    const grievanceAssigned = require('../templates/notifications/grievanceAssigned');
    const data = grievanceAssigned.email.highPriority({
      ticketId,
      title,
      category,
      frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
    });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'High-Priority Action Required', 'admin');
    return emailService.queueEmail(officerEmail, data.subject, htmlContent, 'High Priority Notification');
  },

  async sendSLABreachWarningEmail(ticketId, title, hoursRemaining) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const htmlContent = emailService.compileEmail('grievanceSubmittedEmail.html', {
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
    return emailService.queueEmail(adminEmail, subject, htmlContent, 'SLA Warning Alert');
  },

  async sendDailySummaryReportEmail(adminEmail, stats) {
    const htmlContent = emailService.compileEmail('grievanceSubmittedEmail.html', {
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
    return emailService.queueEmail(adminEmail, subject, htmlContent, 'Daily Summary Report');
  },

  // System Dispatches
  async sendMaintenanceNotificationEmail(emails, maintenanceTime, duration) {
    const systemAnnouncement = require('../templates/notifications/systemAnnouncement');
    const data = systemAnnouncement.email.maintenance({ maintenanceTime, duration });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'System Maintenance Broadcast', 'user');
    return emailService.queueEmail(emails, data.subject, htmlContent, 'Maintenance Notice');
  },

  async sendSecurityAlertEmail(userId, alertMessage, fallbackEmail = null) {
    const securityAlert = require('../templates/notifications/securityAlert');
    const data = securityAlert.email.alert({ alertMessage });
    const htmlContent = emailService.compileEmail(data.template, data.variables, 'Account Security Warning', 'user');
    return checkPreferenceAndQueue(userId, 'security_alerts', data.subject, htmlContent, 'Security Alert Email', fallbackEmail);
  },

  async sendAccountDeletionEmail(email, fullName) {
    const htmlContent = emailService.compileEmail('accountDeletedEmail.html', { fullName }, 'Account Deactivated', 'user');
    const subject = 'Account Terminated Confirmation: ResolveNow';
    return emailService.queueEmail(email, subject, htmlContent, 'Account Deletion Notice');
  },

  async sendBroadcastEmail(emailList, subject, body) {
    const systemAnnouncement = require('../templates/notifications/systemAnnouncement');
    const data = systemAnnouncement.email.announcement({ subject, body });
    const htmlContent = emailService.compileEmail(data.template, data.variables, subject, 'user');
    for (const email of emailList) {
      emailService.queueEmail(email, subject, htmlContent, 'Broadcast Email');
    }
  },

  async sendSpecialistBriefing(officerEmail, department, ticketId, briefing) {
    const htmlContent = emailService.compileEmail('grievanceSubmittedEmail.html', {
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
    return emailService.queueEmail(officerEmail, subject, htmlContent, 'Specialist Briefing');
  },

  // SMS
  async sendOTPSMS(phoneNumber, otp) {
    return smsService.sendOTPSMS(phoneNumber, otp);
  },

  // Event Handlers
  async handleCommentAddedEvent(commentRow) {
    try {
      const grievance = await grievanceRepository.findById(commentRow.grievance_id);
      if (!grievance) return;

      const authorProfile = await userRepository.findProfileByUserId(commentRow.user_id).catch(() => null);
      const authorName = authorProfile ? authorProfile.full_name : 'System Officer';

      const authorUser = await userRepository.findById(commentRow.user_id).catch(() => null);
      const isAdminComment = authorUser?.role === 'admin' || authorUser?.role === 'super admin';
      
      if (isAdminComment) {
        await this.sendCommentAddedEmail(grievance.user_id, commentRow.message, grievance.ticket_id, authorName);
      } else {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const commentAdded = require('../templates/notifications/commentAdded');
          const data = commentAdded.email.admin({
            ticketId: grievance.ticket_id,
            title: grievance.title,
            commentText: commentRow.message,
            authorName,
            frontendUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173'
          });
          const htmlContent = emailService.compileEmail(data.template, data.variables, `Response Received: #${grievance.ticket_id}`, 'admin');
          await emailService.queueEmail(adminEmail, data.subject, htmlContent, 'Admin Notification');
        }
      }
    } catch (err) {
      console.error('[Real-time Comment Hook Failure]:', err.message);
    }
  },

  async handleGrievanceUpdatedEvent(newRow, oldRow) {
    try {
      const isStatusChanged = oldRow && oldRow.status !== newRow.status;
      
      if (isStatusChanged) {
        await this.sendGrievanceStatusUpdatedEmail(newRow.user_id, newRow.ticket_id, newRow.title, oldRow.status, newRow.status);

        if (newRow.status === 'Escalated') {
          await this.sendEscalatedGrievanceAlertEmail(newRow.ticket_id, newRow.title, newRow.category, newRow.frustration_index);
        }
        
        if (newRow.status === 'Resolved') {
          await this.sendResolutionCompletedEmail(newRow.user_id, newRow.ticket_id, newRow.title, newRow.resolution_notes, newRow.updated_at);
        }
      }
    } catch (err) {
      console.error('[Real-time Grievance Update Hook Failure]:', err.message);
    }
  }
};

module.exports = notificationService;
