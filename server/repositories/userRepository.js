const supabase = require('../config/supabase');

const userRepository = {
  /**
   * Check if a user exists with the given email OR phone.
   * Uses two separate queries to avoid the PGRST116 / 406 error that occurs
   * when `.or()` + `.maybeSingle()` matches more than one row.
   * Returns the first matching user, or null.
   */
  async findByEmailOrPhone(email, phone) {
    if (!supabase) return null;

    // Check email first
    if (email) {
      const { data: byEmail, error: emailErr } = await supabase
        .from('users')
        .select('id, email, mobile_number, status, role')
        .eq('email', email.toLowerCase().trim())
        .limit(1)
        .maybeSingle();
      if (emailErr) throw emailErr;
      if (byEmail) return byEmail;
    }

    // Then check phone
    if (phone) {
      const { data: byPhone, error: phoneErr } = await supabase
        .from('users')
        .select('id, email, mobile_number, status, role')
        .eq('mobile_number', phone.trim())
        .limit(1)
        .maybeSingle();
      if (phoneErr) throw phoneErr;
      if (byPhone) return byPhone;
    }

    return null;
  },

  async findByEmail(email) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByPhone(phone) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_number', phone.trim())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByClerkId(clerkUserId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .limit(1)
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
    if (error) throw error;
    return data;
  },

  /**
   * Standard insert — used by Google OAuth and other non-registration flows.
   * For the primary registration flow use `registerAtomic` below.
   */
  async create(userData) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Atomic registration via the PostgreSQL `register_user` function.
   * Performs email + phone existence checks and the INSERT in a single
   * serialized transaction, eliminating the check-then-insert race condition.
   *
   * Throws errors with message 'EMAIL_ALREADY_EXISTS' or 'PHONE_ALREADY_EXISTS'
   * when duplicates are detected.
   */
  async registerAtomic(email, mobile, passwordHash, role = 'student', status = 'inactive') {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase.rpc('register_user', {
      p_email:          email ? email.toLowerCase().trim() : null,
      p_mobile:         mobile || null,
      p_password_hash:  passwordHash,
      p_role:           role,
      p_status:         status,
      p_email_verified: false,
      p_phone_verified: false
    });
    if (error) {
      // Surface the custom exception messages from the PG function
      const msg = error.message || '';
      if (msg.includes('EMAIL_ALREADY_EXISTS')) {
        const e = new Error('Email address is already registered.');
        e.status = 400;
        throw e;
      }
      if (msg.includes('PHONE_ALREADY_EXISTS')) {
        const e = new Error('Phone number is already registered.');
        e.status = 400;
        throw e;
      }
      throw error;
    }
    return data;
  },

  /**
   * Atomic Clerk user upsert via the `sync_clerk_user` PostgreSQL function.
   * Inserts the user if they don't exist, or updates email/clerk_id/mobile if they do.
   */
  async syncClerkUserAtomic(email, clerkUserId, mobile = null, role = 'student', fullName = null) {
    if (!supabase) throw new Error('Database unavailable');
    const { data, error } = await supabase.rpc('sync_clerk_user', {
      p_email:         email ? email.toLowerCase().trim() : null,
      p_clerk_user_id: clerkUserId,
      p_mobile:        mobile || null,
      p_role:          role,
      p_full_name:     fullName
    });
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
      .single();
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
      .limit(1)
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
      .single();
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
      .limit(1)
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
