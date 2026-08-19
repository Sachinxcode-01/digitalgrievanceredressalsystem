const supabase = require('../config/supabase');

const isUuid = (val) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

const auditRepository = {
  async insertAuditLog(logData) {
    if (!supabase) return null;
    const payload = {
      ...logData,
      user_id: isUuid(logData.user_id) ? logData.user_id : null
    };
    const { error } = await supabase
      .from('audit_logs')
      .insert([payload]);
    if (error) throw error;
    return true;
  },

  async insertSecurityEvent(eventData) {
    if (!supabase) return null;
    const payload = {
      ...eventData,
      user_id: isUuid(eventData.user_id) ? eventData.user_id : null
    };
    const { error } = await supabase
      .from('security_events')
      .insert([payload]);
    if (error) throw error;
    return true;
  },

  async insertAdminActivityLog(activityData) {
    if (!supabase) return null;
    const payload = {
      ...activityData,
      admin_id: isUuid(activityData.admin_id) ? activityData.admin_id : null,
      target_user_id: isUuid(activityData.target_user_id) ? activityData.target_user_id : null
    };
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert([payload]);
    if (error) throw error;
    return true;
  },

  async getRecentAuditLogs(userId, limit = 10) {
    if (!supabase || !isUuid(userId)) return [];
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
