const supabase = require('../config/supabase');

const sessionRepository = {
  async create(sessionData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select();
    console.log("Supabase response (createSession):", data);
    console.log("Supabase error (createSession):", error);
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  async findByRefreshToken(refreshToken) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('refresh_token', refreshToken)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByPreviousRefreshToken(previousRefreshToken) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('previous_refresh_token', previousRefreshToken)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select();
    console.log("Supabase response (updateSession):", data);
    console.log("Supabase error (updateSession):", error);
    if (error) throw error;
    return (data && data.length > 0) ? data[0] : null;
  },

  async deleteById(id) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async deleteByUserIdExceptActive(userId, activeSessionId) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)
      .neq('id', activeSessionId);
    if (error) throw error;
    return true;
  },

  async deleteByUserId(userId) {
    if (!supabase) return false;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }
};

module.exports = sessionRepository;
