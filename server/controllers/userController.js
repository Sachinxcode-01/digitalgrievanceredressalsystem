const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const auditRepository = require('../repositories/auditRepository');
const { logAudit } = require('../services/auditService');
const notificationService = require('../services/notificationService');

/**
 * Retrieve Profile
 * GET /api/v1/user/profile
 */
const getProfile = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const profile = await userRepository.findProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Account metadata not found.' });
    }

    // Scrub password hash from response
    const cleanUser = {
      id: user.id,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
      status: user.status,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at
    };

    const auditLogs = await auditRepository.getRecentAuditLogs(userId, 10);

    res.json({
      profile: {
        fullName: profile.full_name,
        profilePicture: profile.profile_picture,
        notificationPreferences: profile.notification_preferences,
        department: profile.department,
        institution: profile.institution
      },
      account: cleanUser,
      logs: auditLogs
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
  const { fullName, profilePicture, notificationPreferences, department, institution } = req.body;

  const isAuthorized = req.user.role === 'admin' || req.user.role === 'super admin';
  if ((department !== undefined || institution !== undefined) && !isAuthorized) {
    return res.status(403).json({ error: 'Access Denied: Only administrators can modify institutional and department details.' });
  }

  try {
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (profilePicture !== undefined) updates.profile_picture = profilePicture;
    if (notificationPreferences !== undefined) updates.notification_preferences = notificationPreferences;
    if (department !== undefined) updates.department = department;
    if (institution !== undefined) updates.institution = institution;

    const updatedProfile = await userRepository.updateProfile(userId, updates);

    await logAudit(userId, 'PROFILE_UPDATE_SUCCESSFUL', req.ip, req.headers['user-agent']);

    res.json({
      message: 'Profile updated successfully.',
      profile: {
        fullName: updatedProfile.full_name,
        profilePicture: updatedProfile.profile_picture,
        notificationPreferences: updatedProfile.notification_preferences,
        department: updatedProfile.department,
        institution: updatedProfile.institution
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
    const updates = {};
    if (email) {
      const checkEmail = await userRepository.findByEmail(email);
      if (checkEmail && checkEmail.id !== userId) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
      updates.email = email;
      updates.email_verified = false;
    }
    if (mobileNumber !== undefined) {
      const finalMobile = (mobileNumber && mobileNumber.trim() !== '') ? mobileNumber.trim() : null;
      if (finalMobile) {
        const checkPhone = await userRepository.findByPhone(finalMobile);
        if (checkPhone && checkPhone.id !== userId) {
          return res.status(400).json({ error: 'Mobile number is already in use.' });
        }
      }
      updates.mobile_number = finalMobile;
      updates.phone_verified = false;
    }

    const updatedUser = await userRepository.update(userId, updates);

    await logAudit(userId, 'ACCOUNT_DETAILS_UPDATED', req.ip, req.headers['user-agent']);

    res.json({
      message: 'Account settings updated.',
      account: {
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        email_verified: updatedUser.email_verified,
        phone_verified: updatedUser.phone_verified
      }
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
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.update(userId, { password_hash: passwordHash });

    // Invalidate other devices' sessions
    await sessionRepository.deleteByUserIdExceptActive(userId, req.user.session_id);

    await logAudit(userId, 'PASSWORD_CHANGED_SUCCESSFULLY', req.ip, req.headers['user-agent']);

    await notificationService.sendPasswordChangedEmail(userId).catch(console.error);

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
  const clerkId = req.user.clerk_id;

  try {
    const user = await userRepository.findById(userId).catch(() => null);
    const profile = await userRepository.findProfileByUserId(userId).catch(() => null);

    await userRepository.deleteUser(userId);

    if (clerkId) {
      const { clerkClient } = require('@clerk/express');
      await clerkClient.users.deleteUser(clerkId).catch(err => {
        console.error('Failed to delete user from Clerk:', err.message);
      });
    }

    if (user) {
      const fullName = profile ? profile.full_name : 'Valued User';
      await notificationService.sendAccountDeletionEmail(user.email, fullName).catch(console.error);
    }

    res.clearCookie('refresh_token');
    res.json({ message: 'Your account and all associated profile, session, and device records have been terminated.' });
  } catch (err) {
    next(err);
  }
};

const getNotifications = async (req, res, next) => {
  const userId = req.user.id;
  const supabase = require('../config/supabase');
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const supabase = require('../config/supabase');
  try {
    if (!supabase) return res.json({ success: false });
    const { data, error } = await supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, notification: data });
  } catch (err) {
    next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  const userId = req.user.id;
  const supabase = require('../config/supabase');
  try {
    if (!supabase) return res.json({ success: false });
    const { data, error } = await supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    res.json({ success: true, count: data ? data.length : 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAccount,
  changePassword,
  deleteAccount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
