const supabase = require('../config/supabase');

const auditRepository = {
  async insertAuditLog(logData) {
    if (!supabase) return null;
    const { error } = await supabase
      .from('audit_logs')
      .insert([logData]);
    if (error) throw error;
    return true;
  },

  async insertSecurityEvent(eventData) {
    if (!supabase) return null;
    const { error } = await supabase
      .from('security_events')
      .insert([eventData]);
    if (error) throw error;
    return true;
  },

  async insertAdminActivityLog(activityData) {
    if (!supabase) return null;
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert([activityData]);
    if (error) throw error;
    return true;
  },

  async getRecentAuditLogs(userId, limit = 10) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
};

module.exports = auditRepository;
