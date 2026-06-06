const supabase = require('../config/supabase');

const authRepository = {
  // OTP Operations
  async findActiveOtp(email, phone, purpose) {
    if (!supabase) return null;
    let query = supabase
      .from('otp_verifications')
      .select('*')
      .eq('purpose', purpose)
      .eq('is_verified', false)
      .order('created_at', { ascending: false });

    if (email) query = query.eq('email', email);
    if (phone) query = query.eq('phone_number', phone);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },

  async insertOtp(otpData) {
    if (!supabase) throw new Error('Database connection offline');
    const { data, error } = await supabase
      .from('otp_verifications')
      .insert([otpData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markOtpVerified(otpId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('otp_verifications')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', otpId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Password Reset Operations
  async findActiveResetCode(email, code) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('token', code)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async insertResetCode(resetData) {
    if (!supabase) throw new Error('Database connection offline');
    const { data, error } = await supabase
      .from('password_resets')
      .insert([resetData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markResetCodeUsed(resetId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('password_resets')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', resetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

module.exports = authRepository;
