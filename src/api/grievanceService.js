const API_URL = '/api';

/**
 * Service for managing grievance operations via the backend API.
 */
export const grievanceService = {
  /**
   * Fetch all reported grievances (Admin).
   */
  async getAll() {
    const response = await fetch(`${API_URL}/grievances`);
    if (!response.ok) throw new Error('Could not fetch grievances');
    return await response.json();
  },

  /**
   * Fetch grievances for a specific user (User Dashboard).
   */
  async getByUser(userId) {
    const response = await fetch(`${API_URL}/grievances?user_id=${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error('Could not fetch your tickets');
    return await response.json();
  },

  /**
   * Submit a new grievance report.
   */
  async create(grievanceData) {
    const response = await fetch(`${API_URL}/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grievanceData),
    });
    if (!response.ok) throw new Error('Submission failed');
    return await response.json();
  },

  /**
   * Perform AI triage for a grievance description.
   */
  async analyze(description) {
    const response = await fetch(`${API_URL}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) throw new Error('AI Triage failed');
    return await response.json();
  }
};
