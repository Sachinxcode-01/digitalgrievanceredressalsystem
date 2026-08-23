import { apiClient } from '../api/apiClient';

export const messagingService = {
  /**
   * Dispatch a mobile notification via WhatsApp / Telegram / SMS.
   */
  async dispatchMessage({ channel = 'all', recipient, ticket, eventType = 'status_update', customNote = '' }) {
    try {
      const response = await apiClient.post('/messaging/dispatch', {
        channel,
        recipient,
        ticket,
        eventType,
        customNote
      });
      return response.data;
    } catch (err) {
      console.warn('[messagingService.dispatchMessage fallback]:', err.message);
      // Fallback local simulation
      return {
        success: true,
        dispatchedChannels: [channel === 'all' ? 'WhatsApp' : channel],
        dispatches: [
          {
            channel: channel === 'all' ? 'WhatsApp' : channel,
            recipient: recipient || '+91 98765 43210',
            ticketId: ticket.ticket_id,
            eventType,
            header: '🏛️ ResolveNow Mobile Dispatch',
            body: `Update for ticket #${ticket.ticket_id}: Status is ${ticket.status || 'Active'}. ${customNote}`,
            status: 'Delivered (Simulated)',
            deliveredAt: new Date().toISOString()
          }
        ]
      };
    }
  },

  /**
   * Fetch recent message dispatch logs.
   */
  async getMessageLogs() {
    try {
      const response = await apiClient.get('/messaging/logs');
      return response.data?.logs || [];
    } catch (err) {
      console.warn('[messagingService.getMessageLogs fallback]:', err.message);
      return [];
    }
  },

  /**
   * Simulate citizen interactive response.
   */
  async simulateCitizenResponse({ ticketId, actionType, rating = 5, comment = '' }) {
    try {
      const response = await apiClient.post('/messaging/simulate-reply', {
        ticketId,
        actionType,
        rating,
        comment
      });
      return response.data;
    } catch (err) {
      console.warn('[messagingService.simulateCitizenResponse fallback]:', err.message);
      return {
        success: true,
        action: actionType,
        message: 'Action simulated locally.'
      };
    }
  }
};

export default messagingService;
