const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { logAudit } = require('../services/sessionService');
const { sendPasswordChangedEmail, sendAccountDeletionEmail } = require('../services/emailService');

/**
 * Retrieve Profile
 * GET /api/v1/user/profile
 */
const getProfile = async (req, res, next) => {
  const userId = req.user.id;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch user profiles & account metadata
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, mobile_number, role, status, email_verified, phone_verified, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: 'Account metadata not found.' });
    }

    // Fetch recent security logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      profile: {
        fullName: profile.full_name,
        profilePicture: profile.profile_picture,
        notificationPreferences: profile.notification_preferences
      },
      account: user,
      logs: auditLogs || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Profile
 * PUT /api/v1/user/profile
 */
const updateProfile = async (req, res, next) => {
  const userId = req.user.id;
  const { fullName, profilePicture, notificationPreferences } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (profilePicture !== undefined) updates.profile_picture = profilePicture;
    if (notificationPreferences !== undefined) updates.notification_preferences = notificationPreferences;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await logAudit(userId, 'PROFILE_UPDATE_SUCCESSFUL', req.ip, req.headers['user-agent']);

    res.json({
      message: 'Profile updated successfully.',
      profile: {
        fullName: data.full_name,
        profilePicture: data.profile_picture,
        notificationPreferences: data.notification_preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Account settings (email / mobile)
 * PUT /api/v1/user/account
 */
const updateAccount = async (req, res, next) => {
  const userId = req.user.id;
  const { email, mobileNumber } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const updates = {};
    if (email) {
      // Check duplicate email
      const { data: checkEmail } = await supabase.from('users').select('id').eq('email', email).neq('id', userId).maybeSingle();
      if (checkEmail) return res.status(400).json({ error: 'Email is already in use.' });
      updates.email = email;
      updates.email_verified = false; // Need re-verification
    }
    if (mobileNumber !== undefined) {
      const finalMobile = (mobileNumber && mobileNumber.trim() !== '') ? mobileNumber.trim() : null;
      if (finalMobile) {
        // Check duplicate mobile
        const { data: checkPhone } = await supabase.from('users').select('id').eq('mobile_number', finalMobile).neq('id', userId).maybeSingle();
        if (checkPhone) return res.status(400).json({ error: 'Mobile number is already in use.' });
      }
      updates.mobile_number = finalMobile;
      updates.phone_verified = false; // Need re-verification
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('email, mobile_number, email_verified, phone_verified')
      .single();

    if (error) throw error;

    await logAudit(userId, 'ACCOUNT_DETAILS_UPDATED', req.ip, req.headers['user-agent']);

    res.json({
      message: 'Account settings updated.',
      account: data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Change Password
 * POST /api/v1/user/change-password
 */
const changePassword = async (req, res, next) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // 1. Fetch current password hash
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (findError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Validate current password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // 3. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Invalidate other devices' sessions
    await supabase.from('sessions').delete().eq('user_id', userId).neq('id', req.user.session_id);

    await logAudit(userId, 'PASSWORD_CHANGED_SUCCESSFULLY', req.ip, req.headers['user-agent']);

    // Send confirmation email
    await sendPasswordChangedEmail(userId).catch(console.error);

    res.json({ message: 'Password updated successfully. Other active sessions revoked.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete User Account
 * DELETE /api/v1/user/account
 */
const deleteAccount = async (req, res, next) => {
  const userId = req.user.id;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Retrieve details before deleting
    const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
    const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('user_id', userId).single();

    // Delete user (cascades profiles, sessions, etc)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    if (user) {
      const fullName = profile ? profile.full_name : 'Valued User';
      await sendAccountDeletionEmail(user.email, fullName).catch(console.error);
    }

    res.clearCookie('refresh_token');
    res.json({ message: 'Your account and all associated profile, session, and device records have been terminated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAccount,
  changePassword,
  deleteAccount
};
