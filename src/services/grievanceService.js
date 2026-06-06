import { apiClient, getAccessToken } from '../api/apiClient';

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
    const response = await apiClient.get('/grievances');
    return response.data;
  },

  /**
   * Fetch grievances for a specific user (User Dashboard).
   */
  async getByUser(userId) {
    const response = await apiClient.get(`/grievances?user_id=${encodeURIComponent(userId)}`);
    return response.data;
  },

  /**
   * Submit a new grievance report.
   */
  async create(grievanceData) {
    const response = await apiClient.post('/grievances', grievanceData);
    return response.data;
  },

  /**
   * Perform AI triage for a grievance description.
   */
  async analyze(description) {
    const response = await apiClient.post('/ai/analyze', { description });
    return response.data;
  },

  /**
   * Retrieve single grievance details.
   */
  async getById(id) {
    const response = await apiClient.get(`/grievances/${id}`);
    return response.data;
  },

  /**
   * Transition a grievance's workflow status.
   */
  async updateStatus(id, status, resolutionNotes) {
    const response = await apiClient.put(`/grievances/${id}/status`, { status, resolution_notes: resolutionNotes });
    return response.data;
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
    const response = await apiClient.get(`/grievances/${id}/timeline`);
    return response.data;
  }
};

export default grievanceService;
