/**
 * Web Push & Native Notification Service for ResolveNow
 * Handles browser notification permissions, native notifications, and audio chimes.
 */

// Soft audio chime for delivery milestones
export const playMilestoneChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio muted or unsupported
  }
};

export const webPushService = {
  /**
   * Check current browser notification permission
   * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
   */
  getPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Request browser push notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  },

  /**
   * Send a native browser push notification
   */
  async sendPushNotification(title, options = {}) {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') {
      try {
        playMilestoneChime();
        const notif = new Notification(title, {
          body: options.body || 'ResolveNow Delivery Milestone Update',
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options.tag || 'delivery-milestone',
          data: options.data || {},
          ...options
        });

        notif.onclick = () => {
          window.focus();
          if (options.url) {
            window.location.href = options.url;
          }
          notif.close();
        };
        return true;
      } catch (err) {
        console.warn('Native notification failed:', err);
        return false;
      }
    }
    return false;
  },

  /**
   * Trigger multi-channel milestone alert (Push + In-App Event + Chime)
   */
  triggerMilestoneAlert({ ticketId, status, title, officerName, department, smsPhone }) {
    playMilestoneChime();

    const statusCopy = 
      status === 'In Progress' ? 'Officer Investigation Active' :
      status === 'Assigned' ? 'Officer Dispatched' :
      status === 'Resolved' ? 'Redressal Delivered & Resolved' :
      status === 'Pending User Response' ? 'Clarification Requested' :
      status === 'Escalated' ? 'Escalated to Senior Nodal Directorate' :
      `Status updated to ${status}`;

    const bodyText = `Grievance #${ticketId}: ${statusCopy}${officerName ? ` by ${officerName}` : ''}${department ? ` (${department})` : ''}.`;

    // 1. Native Push Notification
    this.sendPushNotification(`ResolveNow • ${statusCopy}`, {
      body: bodyText,
      tag: `ticket-${ticketId}`,
      url: `/public-status?ticketId=${ticketId}`
    });

    // 2. Broadcast in-app window event for real-time banner & notification drawer
    const eventDetail = {
      title: `Milestone: ${statusCopy}`,
      message: bodyText,
      type: status === 'Resolved' ? 'success' : status === 'Escalated' ? 'warning' : 'info',
      ticketId,
      status,
      smsPreview: smsPhone ? `[SMS sent to ${smsPhone}]: [ResolveNow] Ticket #${ticketId} is now '${status}'. Track: ${window.location.origin}/public-status?ticketId=${ticketId}` : null
    };

    window.dispatchEvent(new CustomEvent('app-notification', { detail: eventDetail }));
    window.dispatchEvent(new CustomEvent('delivery-milestone-alert', { detail: eventDetail }));

    return eventDetail;
  }
};
