const supabase = require('../config/supabase');

const authRepository = {
  // ─── OTP Operations ──────────────────────────────────────────────────────────

  /**
   * Find the most recent non-expired OTP for an email or phone + purpose.
   * Uses .limit(1) before .maybeSingle() so PGRST116 is never triggered.
   * Column names match the live schema: `phone` (not phone_number), no `is_verified`.
   */
  async findActiveOtp(email, phone, purpose) {
    if (!supabase) return null;
    let query = supabase
      .from('otp_verifications')
      .select('*')
      .eq('purpose', purpose)
      .gt('expires_at', new Date().toISOString())   // unexpired only
      .order('created_at', { ascending: false })
      .limit(1);

    if (email) query = query.eq('email', email);
    if (phone) query = query.eq('phone', phone);      // ← correct column: `phone`

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async insertOtp(otpData) {
    if (!supabase) throw new Error('Database connection offline');
    const { data, error } = await supabase
      .from('otp_verifications')
      .insert([otpData])
      .select()
      .single();                                     // ← single: we just inserted 1 row
    if (error) throw error;
    return data;
  },

  // markOtpVerified is not applicable – the table has no is_verified column.
  // Deletion is used to "verify" (consume) the OTP instead. Kept as no-op stub
  // for compatibility if anything still calls it.
  async markOtpVerified(otpId) {
    // OTP table has no is_verified column; callers should delete the row instead.
    // Provided here as a safe no-op to avoid runtime errors from stale callers.
    return null;
  },

  // ─── Password Reset Operations ────────────────────────────────────────────────

  /**
   * Find a valid (verified=true, unexpired) password-reset record by user_id + code.
   * Column names match live schema: `code` (not token), `verified` (not is_used).
   */
  async findActiveResetCode(userId, code) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('user_id', userId)                        // ← look up by user_id (UUID)
      .eq('code', code)                             // ← correct column: `code`
      .eq('verified', true)                         // ← correct column: `verified`
      .gt('expires_at', new Date().toISOString())   // unexpired
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
      .single();                                    // ← single: one row just inserted
    if (error) throw error;
    return data;
  },

  /**
   * Deletes a password reset record by id (consumed after use).
   * The schema has no `is_used` / `used_at` columns; we delete instead.
   */
  async markResetCodeUsed(resetId) {
    if (!supabase) return null;
    const { error } = await supabase
      .from('password_resets')
      .delete()
      .eq('id', resetId);
    if (error) throw error;
    return true;
  }
};

module.exports = authRepository;
