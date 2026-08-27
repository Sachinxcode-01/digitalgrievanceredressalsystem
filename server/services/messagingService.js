const axios = require('axios');
const grievanceRepository = require('../repositories/grievanceRepository');
const notificationQueue = require('./notificationQueue');

// In-memory ring buffer of simulated & dispatched mobile messages
const messageLogs = [];

const MAX_LOGS = 50;

function addLog(entry) {
  messageLogs.unshift({
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    ...entry
  });
  if (messageLogs.length > MAX_LOGS) messageLogs.pop();
}

/**
 * Format interactive WhatsApp Cloud API / Twilio payload.
 */
function buildWhatsAppPayload(ticket, eventType = 'status_update') {
  const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl = `${frontendUrl}/track?token=${encodeURIComponent(ticket.ticket_id || ticket.id)}`;
  
  let headerText = '🏛️ Digital Grievance Redressal System';
  let bodyText = `Hello,\n\nYour grievance *#${ticket.ticket_id}* regarding _"${ticket.title}"_ has been updated.`;
  
  if (eventType === 'created') {
    headerText = '✅ Grievance Registered Successfully';
    bodyText = `Your grievance *#${ticket.ticket_id}* has been officially registered in the national registry.\n\n📂 *Category:* ${ticket.category || 'General'}\n⚡ *Urgency:* ${ticket.urgency || 'Medium'}\n🏢 *Department:* ${ticket.department || 'General'}\n⏱️ *SLA Target:* 48 Hours`;
  } else if (eventType === 'escalated') {
    headerText = '🚨 SLA Escalation Warning';
    bodyText = `Ticket *#${ticket.ticket_id}* has been elevated to *HIGH PRIORITY / ESCALATED* due to SLA threshold parameters or community petition acceleration.`;
  } else if (eventType === 'resolved') {
    headerText = '🎉 Grievance Resolved';
    bodyText = `Your grievance *#${ticket.ticket_id}* has been verified and marked as *RESOLVED* by the nodal department authority.`;
  } else if (eventType === 'petition_upvoted') {
    headerText = '🔥 Community Petition Milestone';
    bodyText = `Your petition *#${ticket.ticket_id}* now has *${ticket.upvote_count || 1} student supporters*! SLA resolution timeline has been accelerated.`;
  }

  const buttons = [
    { type: 'url', title: '📍 View Live Milestones', url: trackingUrl },
    { type: 'quick_reply', title: '👍 Acknowledge', id: `ack_${ticket.ticket_id}` },
    { type: 'quick_reply', title: '⭐ Rate 5 Stars', id: `rate_5_${ticket.ticket_id}` }
  ];

  return {
    channel: 'WhatsApp',
    header: headerText,
    body: bodyText,
    trackingUrl,
    buttons,
    rawPayload: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: headerText },
        body: { text: bodyText },
        footer: { text: 'Reply to speak with an officer' },
        action: {
          buttons: buttons.map((b, i) => ({
            type: 'reply',
            reply: { id: b.id || `btn_${i}`, title: b.title }
          }))
        }
      }
    }
  };
}

/**
 * Format Telegram Bot Markdown & Inline Keyboard payload.
 */
function buildTelegramPayload(ticket, eventType = 'status_update') {
  const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl = `${frontendUrl}/track?token=${encodeURIComponent(ticket.ticket_id || ticket.id)}`;

  let text = `🏛 *ResolveNow Institutional Bot*\n\n📋 *Ticket Reference:* \`#${ticket.ticket_id}\`\n📝 *Subject:* ${ticket.title}\n📊 *Status:* \`${ticket.status || 'Active'}\`\n🏢 *Department:* ${ticket.department || ticket.category || 'General'}`;

  if (eventType === 'resolved') {
    text += `\n\n✅ *Remediation Complete!* Please verify and submit satisfaction feedback.`;
  } else if (eventType === 'escalated') {
    text += `\n\n🚨 *PRIORITY ALERT:* Ticket elevated to nodal escalation queue.`;
  }

  const inline_keyboard = [
    [
      { text: '📍 Track Milestones', url: trackingUrl }
    ],
    [
      { text: '✅ Acknowledge', callback_data: `ack:${ticket.id || ticket.ticket_id}` },
      { text: '⭐ Rate 5★', callback_data: `rate:5:${ticket.id || ticket.ticket_id}` }
    ]
  ];

  return {
    channel: 'Telegram',
    text,
    trackingUrl,
    reply_markup: { inline_keyboard }
  };
}

/**
 * Format concise Mobile SMS Alert payload.
 */
function buildSmsPayload(ticket, eventType = 'status_update') {
  const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
  const shortUrl = `${frontendUrl}/track?token=${encodeURIComponent(ticket.ticket_id || ticket.id)}`;
  
  let msg = `[ResolveNow] Ticket #${ticket.ticket_id}: Status updated to '${ticket.status || 'In Progress'}'. Track: ${shortUrl}`;
  if (eventType === 'resolved') {
    msg = `[ResolveNow] Ticket #${ticket.ticket_id} is RESOLVED. Verify outcome & provide rating: ${shortUrl}`;
  } else if (eventType === 'created') {
    msg = `[ResolveNow] Ticket #${ticket.ticket_id} registered. Assigned to ${ticket.department || 'Nodal Dept'}. SLA: 48h. Track: ${shortUrl}`;
  }

  return {
    channel: 'SMS',
    body: msg,
    shortUrl
  };
}

const messagingService = {
  /**
   * Dispatch notification across specified mobile channel or all channels.
   */
  async dispatchMessage({ channel = 'all', recipient, ticket, eventType = 'status_update', customNote = '' }) {
    if (!ticket) throw new Error('Ticket object is required for mobile dispatch.');

    const results = [];
    const waPayload = buildWhatsAppPayload(ticket, eventType);
    const tgPayload = buildTelegramPayload(ticket, eventType);
    const smsPayload = buildSmsPayload(ticket, eventType);

    // 1. WhatsApp Dispatch / Webhook
    if (channel === 'all' || channel === 'whatsapp') {
      const waLog = {
        channel: 'WhatsApp',
        recipient: recipient || '+91 98765 43210',
        ticketId: ticket.ticket_id,
        eventType,
        header: waPayload.header,
        body: customNote ? `${waPayload.body}\n\n💬 *Officer Note:* ${customNote}` : waPayload.body,
        buttons: waPayload.buttons,
        status: 'Delivered',
        deliveredAt: new Date().toISOString()
      };

      // If real WhatsApp Webhook URL configured in env
      const waWebhook = process.env.WHATSAPP_WEBHOOK_URL;
      if (waWebhook) {
        try {
          await axios.post(waWebhook, { ...waPayload, customNote, recipient: waLog.recipient });
        } catch (err) {
          console.warn('[WhatsApp Webhook Warning]:', err.message);
        }
      }

      addLog(waLog);
      results.push(waLog);
    }

    // 2. Telegram Bot Dispatch / Webhook
    if (channel === 'all' || channel === 'telegram') {
      const tgLog = {
        channel: 'Telegram',
        recipient: recipient || '@citizen_bot_user',
        ticketId: ticket.ticket_id,
        eventType,
        text: customNote ? `${tgPayload.text}\n\n💬 _Note:_ ${customNote}` : tgPayload.text,
        buttons: [
          { text: '📍 Track Milestones', action: tgPayload.trackingUrl },
          { text: '✅ Acknowledge', action: 'Acknowledge' },
          { text: '⭐ Rate 5★', action: 'Rate 5★' }
        ],
        status: 'Delivered',
        deliveredAt: new Date().toISOString()
      };

      const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;
      if (tgBotToken && tgChatId) {
        try {
          await axios.post(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            chat_id: tgChatId,
            text: tgLog.text,
            parse_mode: 'Markdown',
            reply_markup: tgPayload.reply_markup
          });
        } catch (err) {
          console.warn('[Telegram Bot API Warning]:', err.message);
        }
      }

      addLog(tgLog);
      results.push(tgLog);
    }

    // 3. SMS Transmission
    if (channel === 'all' || channel === 'sms') {
      const smsLog = {
        channel: 'SMS',
        recipient: recipient || '+91 98765 43210',
        ticketId: ticket.ticket_id,
        eventType,
        body: customNote ? `${smsPayload.body} Note: ${customNote}` : smsPayload.body,
        status: 'Delivered',
        deliveredAt: new Date().toISOString()
      };
      addLog(smsLog);
      results.push(smsLog);
    }

    return {
      success: true,
      dispatchedChannels: results.map(r => r.channel),
      dispatches: results
    };
  },

  /**
   * Retrieve recent mobile message dispatch logs for interactive simulator.
   */
  getMessageLogs() {
    return messageLogs;
  },

  /**
   * Simulate a citizen's interactive button press from WhatsApp / Telegram.
   */
  async simulateCitizenResponse({ ticketId, actionType, rating = 5, comment = '' }) {
    const replyLog = {
      channel: 'Mobile Interactive Inbound',
      recipient: 'System Gateway',
      ticketId,
      eventType: `citizen_${actionType}`,
      body: actionType === 'acknowledge'
        ? `Citizen confirmed: "Received and acknowledged update for #${ticketId}"`
        : `Citizen rated resolution: ${rating} Stars ⭐ ("${comment || 'Issue solved efficiently!'}")`,
      status: 'Processed',
      deliveredAt: new Date().toISOString()
    };
    addLog(replyLog);

    // If rating provided, update grievance satisfaction feedback in DB
    if (actionType === 'rate' && ticketId) {
      try {
        await grievanceRepository.updateFeedback(ticketId, rating, comment || 'Interactive mobile feedback.');
      } catch (err) {
        console.warn('Citizen feedback DB update fallback:', err.message);
      }
    }

    return {
      success: true,
      action: actionType,
      message: 'Inbound mobile action processed successfully.',
      replyLog
    };
  },

  /**
   * Dispatch Emergency SOS Broadcast to executive administration & security officers
   */
  async dispatchEmergencyBroadcast(ticket) {
    const sosLog = {
      channel: 'EMERGENCY_SOS_BROADCAST',
      recipient: 'Executive Board & Campus Security',
      ticketId: ticket.ticket_id || ticket.id,
      eventType: 'emergency_sos',
      body: `🚨 EMERGENCY SOS INCIDENT ALARM! Ticket #${ticket.ticket_id || ticket.id} regarding "${ticket.subject || ticket.title}" requires IMMEDIATE 2-HOUR ESCALATION! Location/Dept: ${ticket.department || 'General'}`,
      status: 'CRITICAL_DISPATCHED',
      deliveredAt: new Date().toISOString()
    };
    addLog(sosLog);

    // Also dispatch SMS & WhatsApp
    await this.dispatchMessage({
      channel: 'all',
      recipient: '+91 99999 00000 (Executive Safety Line)',
      ticket: {
        ticket_id: ticket.ticket_id || ticket.id,
        title: `🚨 EMERGENCY SOS: ${ticket.subject || ticket.title}`,
        category: ticket.category,
        urgency: 'CRITICAL',
        department: ticket.department,
        status: 'EMERGENCY_SOS'
      },
      eventType: 'escalated',
      customNote: '🚨 CRITICAL SAFETY EMERGENCY SOS TRIGGERED! 2-Hour SLA Countdown Activated.'
    });

    return {
      success: true,
      sosLog
    };
  }
};

module.exports = messagingService;
