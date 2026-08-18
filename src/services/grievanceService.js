import { apiClient, getAccessToken } from '../api/apiClient';

const getLocalGrievances = () => {
  try {
    const raw = localStorage.getItem('resolvenow_local_grievances');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalGrievance = (grievance) => {
  try {
    const existing = getLocalGrievances();
    const updated = [grievance, ...existing];
    localStorage.setItem('resolvenow_local_grievances', JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save grievance locally:', err);
  }
};

/**
 * Helper to dynamically resolve headers with the Authorization token.
 * Provided for backward compatibility.
 */
export const getAuthHeaders = async () => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Service for managing grievance operations via the secure API client.
 */
export const grievanceService = {
  /**
   * Fetch all reported grievances (Admin/Super Admin).
   */
  async getAll() {
    try {
      const response = await apiClient.get('/grievances');
      const apiData = Array.isArray(response.data) ? response.data : [];
      const localData = getLocalGrievances();
      const apiIds = new Set(apiData.map(g => g.id || g.ticket_id));
      const filteredLocal = localData.filter(g => !apiIds.has(g.id) && !apiIds.has(g.ticket_id));
      return [...filteredLocal, ...apiData];
    } catch {
      return getLocalGrievances();
    }
  },

  /**
   * Fetch grievances for a specific user (User Dashboard).
   */
  async getByUser(userId) {
    try {
      const response = await apiClient.get(`/grievances?user_id=${encodeURIComponent(userId)}`);
      const apiData = Array.isArray(response.data) ? response.data : [];
      const localData = getLocalGrievances().filter(g => !g.user_id || g.user_id === userId || userId?.startsWith('demo-'));
      const apiIds = new Set(apiData.map(g => g.id || g.ticket_id));
      const filteredLocal = localData.filter(g => !apiIds.has(g.id) && !apiIds.has(g.ticket_id));
      return [...filteredLocal, ...apiData];
    } catch {
      return getLocalGrievances();
    }
  },

  /**
   * Submit a new grievance report.
   */
  async create(grievanceData) {
    try {
      const response = await apiClient.post('/grievances', grievanceData);
      if (response.data) {
        saveLocalGrievance(response.data);
        return response.data;
      }
    } catch (err) {
      console.warn('Backend grievance create failed, saving locally:', err.message);
    }

    const year = new Date().getFullYear();
    const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const fallbackTicket = {
      id: `g-local-${Date.now()}`,
      ticket_id: `TKT-${year}-${randPart}`,
      user_id: grievanceData.user_id || 'demo-student-id-101',
      title: grievanceData.title,
      description: grievanceData.description,
      category: grievanceData.category || 'General',
      department: grievanceData.category || 'General',
      urgency: grievanceData.urgency || 'Medium',
      status: 'Submitted',
      frustration_index: grievanceData.frustration_index || 1,
      attachment_url: grievanceData.attachment_url || null,
      location: grievanceData.location || null,
      created_at: new Date().toISOString(),
      sla_due_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    };

    saveLocalGrievance(fallbackTicket);
    return fallbackTicket;
  },

  /**
   * Perform AI triage for a grievance description.
   */
  async analyze(description) {
    try {
      const response = await apiClient.post('/ai/analyze', { description });
      return response.data;
    } catch {
      return {
        category: 'IT Support',
        urgency: 'Medium',
        frustration_index: 2
      };
    }
  },

  /**
   * Retrieve single grievance details.
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/grievances/${id}`);
      if (response.data) return response.data;
    } catch (err) {
      console.debug('[grievanceService.getById fallback]:', err.message);
    }
    const local = getLocalGrievances().find(g => g.id === id || g.ticket_id === id);
    return local || null;
  },

  /**
   * Transition a grievance's workflow status.
   */
  async updateStatus(id, status, resolutionNotes) {
    try {
      const response = await apiClient.put(`/grievances/${id}/status`, { status, resolution_notes: resolutionNotes });
      return response.data;
    } catch (err) {
      console.debug('[grievanceService.updateStatus fallback]:', err.message);
    }
    const localData = getLocalGrievances();
    const match = localData.find(g => g.id === id || g.ticket_id === id);
    if (match) {
      match.status = status;
      match.resolution_notes = resolutionNotes;
      localStorage.setItem('resolvenow_local_grievances', JSON.stringify(localData));
      return match;
    }
    return { id, status, resolution_notes: resolutionNotes };
  },

  /**
   * Assign/reassign ticket ownership.
   */
  async assign(id, assignedTo, department) {
    const response = await apiClient.put(`/grievances/${id}/assign`, { assigned_to: assignedTo, department });
    return response.data;
  },

  /**
   * Trigger ticket escalation.
   */
  async escalate(id, reason) {
    const response = await apiClient.put(`/grievances/${id}/escalate`, { reason });
    return response.data;
  },

  /**
   * Get historical timeline milestones.
   */
  async getTimeline(id) {
    try {
      const response = await apiClient.get(`/grievances/${id}/timeline`);
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (err) {
      console.debug('[grievanceService.getTimeline fallback]:', err.message);
    }
    return [
      { id: 'evt-1', event_type: 'CREATED', description: 'Grievance ticket filed and logged in system', created_at: new Date().toISOString() },
      { id: 'evt-2', event_type: 'TRIAGED', description: 'Assigned SLA target window based on category parameters', created_at: new Date().toISOString() }
    ];
  },

  /**
   * Cancel / delete a pending grievance.
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/grievances/${id}`);
      const localData = getLocalGrievances().filter(g => g.id !== id && g.ticket_id !== id);
      localStorage.setItem('resolvenow_local_grievances', JSON.stringify(localData));
      return response.data;
    } catch (err) {
      const localData = getLocalGrievances().filter(g => g.id !== id && g.ticket_id !== id);
      localStorage.setItem('resolvenow_local_grievances', JSON.stringify(localData));
      throw err;
    }
  },

  /**
   * Submit satisfaction feedback rating and comments for a resolved grievance.
   */
  async submitFeedback(id, rating, comments) {
    try {
      const response = await apiClient.post(`/grievances/${id}/feedback`, { rating, feedback_comments: comments });
      return response.data;
    } catch (err) {
      console.warn('Backend feedback submit fallback:', err.message);
      return this.updateStatus(id, 'Closed', comments);
    }
  },

  /**
   * Check for duplicate tickets using AI semantic similarity engine.
   */
  async checkDuplicates(data) {
    try {
      const response = await apiClient.post('/ai/check-duplicates', data);
      return response.data;
    } catch (err) {
      console.warn('[grievanceService.checkDuplicates fallback]:', err.message);
      // Fallback local check
      const locals = getLocalGrievances();
      const titleText = (data.title || '').toLowerCase();
      const match = locals.find(g => g.title && g.title.toLowerCase().includes(titleText.slice(0, 10)));
      return {
        is_duplicate: !!match,
        match_confidence: match ? 85 : 0,
        matching_ticket: match || null,
        reason: match ? `Similar ticket #${match.ticket_id} found in local system.` : 'No duplicate detected.'
      };
    }
  },

  /**
   * Upvote and subscribe to an existing community grievance.
   */
  async upvote(id) {
    try {
      const response = await apiClient.post(`/grievances/${id}/upvote`);
      return response.data;
    } catch (err) {
      console.warn('[grievanceService.upvote fallback]:', err.message);
      const localData = getLocalGrievances();
      const match = localData.find(g => g.id === id || g.ticket_id === id);
      if (match) {
        match.upvote_count = (match.upvote_count || 1) + 1;
        if (match.upvote_count >= 5) match.urgency = 'High';
        localStorage.setItem('resolvenow_local_grievances', JSON.stringify(localData));
        return { grievance: match, message: 'Upvoted locally', alreadyUpvoted: false };
      }
      return { grievance: { id, upvote_count: 2 }, message: 'Upvoted', alreadyUpvoted: false };
    }
  }
};

export default grievanceService;

