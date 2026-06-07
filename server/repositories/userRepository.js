const supabase = require('../config/supabase');

const userRepository = {
  async findByEmailOrPhone(email, phone) {
    if (!supabase) return null;
    let query = supabase.from('users').select('id, email, mobile_number, status, role');
    if (phone) {
      query = query.or(`email.eq.${email},mobile_number.eq.${phone}`);
    } else {
      query = query.eq('email', email);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByPhone(phone) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_number', phone)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findById(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    console.log("Supabase response (findById):", data);
    console.log("Supabase error (findById):", error);
    if (error) throw error;
    return data;
  },

  async create(userData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .maybeSingle();
    console.log("Supabase response (createUser):", data);
    console.log("Supabase error (createUser):", error);
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    console.log("Supabase response (updateUser):", data);
    console.log("Supabase error (updateUser):", error);
    if (error) throw error;
    return data;
  },

  async createProfile(profileData) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('user_profiles')
      .insert([profileData]);
    if (error) throw error;
    return true;
  },

  async findProfileByUserId(userId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    console.log("Supabase response (updateProfile):", data);
    console.log("Supabase error (updateProfile):", error);
    if (error) throw error;
    return data;
  },

  async findDevice(userId, fingerprint) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_devices')
      .select('device_fingerprint')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertDevice(deviceData) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('user_devices')
      .upsert(deviceData, { onConflict: 'user_id,device_fingerprint' });
    if (error) throw error;
    return true;
  },

  async deleteUser(userId) {
    if (!supabase) throw new Error('Database unavailable');
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    return true;
  }
};

module.exports = userRepository;
