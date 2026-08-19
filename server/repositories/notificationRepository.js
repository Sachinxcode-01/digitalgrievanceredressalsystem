const supabase = require('../config/supabase');

const notificationRepository = {
  // Email Logs
  async insertEmailLog(logData) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('email_logs')
      .insert([logData])
      .select('id');
    console.log("Supabase response (insertEmailLog):", data);
    console.log("Supabase error (insertEmailLog):", error);
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  async updateEmailLog(id, updates) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // OTP Verifications
  async findOtpVerification(identifier, filterCol, purpose) {
    if (!supabase) return null;
    // Use .limit(1).maybeSingle() to avoid PGRST116 when stale duplicate rows exist.
    // Combining limit(1) with maybeSingle() ensures at most one row is returned,
    // avoiding the PostgREST error while maintaining mock-compatibility.
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq(filterCol, identifier)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteOtpVerificationById(id) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async deleteOtpVerification(identifier, filterCol, purpose) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .eq(filterCol, identifier)
      .eq('purpose', purpose);
    if (error) throw error;
    return true;
  },

  async insertOtpVerification(otpData) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('otp_verifications')
      .insert([otpData]);
    if (error) throw error;
    return true;
  },

  async updateOtpAttempts(id, attempts) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('otp_verifications')
      .update({ attempts })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Templates
  async findEmailTemplate(name) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('email_templates')
      .select('subject, body')
      .eq('name', name)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getAllEmailTemplates() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async updateEmailTemplate(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select();
    console.log("Supabase response (updateEmailTemplate):", data);
    console.log("Supabase error (updateEmailTemplate):", error);
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  async findSmsTemplate(name) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sms_templates')
      .select('body')
      .eq('name', name)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getAllSmsTemplates() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async updateSmsTemplate(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sms_templates')
      .update(updates)
      .eq('id', id)
      .select();
    console.log("Supabase response (updateSmsTemplate):", data);
    console.log("Supabase error (updateSmsTemplate):", error);
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  // Password Resets
  async insertPasswordReset(resetData) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('password_resets')
      .insert([resetData]);
    if (error) throw error;
    return true;
  },

  async findPasswordReset(userId, code) {
    if (!supabase) return null;
    // Same PGRST116 fix: use limit(1).maybeSingle() to be safe and mock-compatible.
    const { data, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    console.log("Supabase response (findPasswordReset):", data);
    console.log("Supabase error (findPasswordReset):", error);
    if (error) throw error;
    return data;
  },

  async deletePasswordResetsByUserId(userId) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('password_resets')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  // In-App Notifications
  async insertInAppNotification(notificationData) {
    if (!supabase) return null;
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
    if (!isUuid(notificationData.user_id)) return null;
    const { data, error } = await supabase
      .from('in_app_notifications')
      .insert([notificationData])
      .select();
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  }
};

module.exports = notificationRepository;
