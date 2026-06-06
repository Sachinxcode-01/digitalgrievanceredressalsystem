const supabase = require('../config/supabase');

const settingsRepository = {
  async getAllSettings() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');
    if (error) throw error;
    return data || [];
  },

  async upsertSettings(inserts) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('system_settings')
      .upsert(inserts, { onConflict: 'key' });
    if (error) throw error;
    return true;
  }
};

module.exports = settingsRepository;
