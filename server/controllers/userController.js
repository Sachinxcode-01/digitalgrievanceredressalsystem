const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const auditRepository = require('../repositories/auditRepository');
const { logAudit } = require('../services/auditService');
const notificationService = require('../services/notificationService');

const ROLE_FEATURES_MAP = {
  'student': {
    title: 'Student / Citizen',
    badgeColor: 'indigo',
    clearanceLevel: 'Level 1 - Public User',
    description: 'Standard access for reporting grievances, community upvoting, and tracking resolution timelines.',
    features: [
      { id: 'file_grievances', label: 'File & Submit Grievances', description: 'Submit categorized tickets with attachments & geolocation', enabled: true },
      { id: 'track_live', label: 'Live Ticket Timeline', description: 'Track real-time status and officer assignments', enabled: true },
      { id: 'community_upvoting', label: 'Community Upvoting', description: 'Upvote matching campus issues to escalate priority', enabled: true },
      { id: 'ai_triage', label: 'AI Smart Assistant', description: 'Interactive AI resolution advisor and auto-triage', enabled: true },
      { id: 'satisfaction_ratings', label: 'Satisfaction Feedback', description: 'Rate resolved grievances and provide closure feedback', enabled: true },
      { id: 'admin_oversight', label: 'Department Resolution Queue', description: 'Officer resolution tools', enabled: false },
      { id: 'system_settings', label: 'System Administration', description: 'Full system telemetry and RBAC config', enabled: false }
    ]
  },
  'faculty': {
    title: 'Faculty Member',
    badgeColor: 'emerald',
    clearanceLevel: 'Level 2 - Academic Staff',
    description: 'Academic and department grievance submission and priority routing.',
    features: [
      { id: 'file_grievances', label: 'Priority Grievance Filing', description: 'Fast-track academic & departmental filings', enabled: true },
      { id: 'track_live', label: 'Live Timeline Tracker', description: 'Full ticket progression & history inspection', enabled: true },
      { id: 'community_upvoting', label: 'Academic Endorsement', description: 'Endorse urgent departmental issues', enabled: true },
      { id: 'ai_triage', label: 'AI Assistant & Drafts', description: 'AI assistant with expedited SLA estimates', enabled: true },
      { id: 'satisfaction_ratings', label: 'Closure Review & Feedback', description: 'Detailed feedback on resolution quality', enabled: true },
      { id: 'admin_oversight', label: 'Department Resolution Queue', description: 'Officer resolution tools', enabled: false },
      { id: 'system_settings', label: 'System Administration', description: 'Full system telemetry and RBAC config', enabled: false }
    ]
  },
  'staff': {
    title: 'Staff Member',
    badgeColor: 'cyan',
    clearanceLevel: 'Level 2 - Operations Staff',
    description: 'Operational grievance filing and facilities tracking.',
    features: [
      { id: 'file_grievances', label: 'Operations Filing', description: 'Facility & administrative grievance logging', enabled: true },
      { id: 'track_live', label: 'Live Tracking & Notifications', description: 'Instant alerts on ticket movements', enabled: true },
      { id: 'community_upvoting', label: 'Staff Co-sign', description: 'Support campus-wide maintenance tickets', enabled: true },
      { id: 'ai_triage', label: 'AI Smart Triage', description: 'Auto-category and urgency classification', enabled: true },
      { id: 'satisfaction_ratings', label: 'Resolution Ratings', description: 'Rate operational fixes and responsiveness', enabled: true },
      { id: 'admin_oversight', label: 'Department Resolution Queue', description: 'Officer resolution tools', enabled: false },
      { id: 'system_settings', label: 'System Administration', description: 'Full system telemetry and RBAC config', enabled: false }
    ]
  },
  'officer': {
    title: 'Grievance Officer',
    badgeColor: 'amber',
    clearanceLevel: 'Level 3 - Resolution Officer',
    description: 'Authorized department officer responsible for investigating and resolving assigned grievances.',
    features: [
      { id: 'assigned_queue', label: 'Assigned Grievance Queue', description: 'Dedicated inbox of grievances assigned to your department', enabled: true },
      { id: 'resolution_management', label: 'Resolution & Status Transition', description: 'Mark in-progress, record official notes, resolve tickets', enabled: true },
      { id: 'ai_solutions', label: 'AI Resolution Drafter', description: 'Generate AI-suggested official resolution responses', enabled: true },
      { id: 'sla_monitoring', label: 'SLA Countdown & Risk Monitor', description: 'Real-time breach alerts and deadline timers', enabled: true },
      { id: 'department_reassign', label: 'Department Routing & Escalation', description: 'Reassign or elevate complex matters to specialists', enabled: true },
      { id: 'audit_logs', label: 'Ticket Timeline Auditing', description: 'Examine detailed event logs and user submissions', enabled: true },
      { id: 'system_settings', label: 'System Administration', description: 'System-wide RBAC and global configuration', enabled: false }
    ]
  },
  'admin': {
    title: 'System Administrator',
    badgeColor: 'purple',
    clearanceLevel: 'Level 4 - Institutional Administrator',
    description: 'Full institutional management with oversight of all departments, users, SLAs, and security logs.',
    features: [
      { id: 'global_oversight', label: 'Global Grievance Command', description: 'Complete visibility into all institutional grievances', enabled: true },
      { id: 'officer_assignments', label: 'Officer & Dept Dispatch', description: 'Assign tickets to officers and balance departmental loads', enabled: true },
      { id: 'user_management', label: 'User & Role Management', description: 'Manage user accounts, clearances, and lockouts', enabled: true },
      { id: 'sla_escalation', label: 'SLA Rules & Escalation Engine', description: 'Configure SLA hours, automated breach thresholds, and alerts', enabled: true },
      { id: 'ai_engine', label: 'AI Governance & Vision Analysis', description: 'Execute vision forensics, briefings, and AI summaries', enabled: true },
      { id: 'audit_telemetry', label: 'Security & Audit Telemetry', description: 'Inspect real-time security events, health, and logs', enabled: true },
      { id: 'institutional_broadcasts', label: 'Campus-wide Broadcasts', description: 'Dispatch bulk emails and urgent SMS alerts', enabled: true }
    ]
  },
  'super admin': {
    title: 'Super Administrator',
    badgeColor: 'rose',
    clearanceLevel: 'Level 5 - Root Kernel Clearance',
    description: 'Unrestricted root clearance with full authority across core infrastructure, database backups, and RBAC.',
    features: [
      { id: 'kernel_control', label: 'Root Infrastructure Control', description: 'Execute system maintenance, cache purges, and backups', enabled: true },
      { id: 'rbac_management', label: 'Custom Roles & RBAC Matrix', description: 'Create and assign granular database permissions', enabled: true },
      { id: 'compliance_reports', label: 'Compliance & Legal Reports', description: 'Export full audit archives, CSV telemetry, and statistics', enabled: true },
      { id: 'global_oversight', label: 'Unrestricted Ticket Oversight', description: 'Full access to all citizen, student, and admin records', enabled: true },
      { id: 'emergency_broadcast', label: 'Emergency Broadcast Dispatch', description: 'High-priority SMS & SMTP campus-wide alerts', enabled: true },
      { id: 'ai_governance', label: 'AI Model & Token Governance', description: 'Configure providers (Gemini, OpenRouter, Nvidia)', enabled: true }
    ]
  }
};

/**
 * Retrieve Profile
 * GET /api/v1/user/profile
 */
const getProfile = async (req, res, next) => {
  const userId = req.user.id;

  try {
    let profile = await userRepository.findProfileByUserId(userId);
    let user = await userRepository.findById(userId);

    // If profile row doesn't exist yet, auto-create a default one or fallback
    if (!profile) {
      profile = {
        full_name: req.user.fullName || req.user.full_name || req.user.email?.split('@')[0] || 'Citizen',
        profile_picture: req.user.profilePicture || req.user.profile_picture || null,
        notification_preferences: { email: true, sms: true },
        department: req.user.department || null,
        institution: null
      };

      try {
        await userRepository.createProfile({
          user_id: userId,
          full_name: profile.full_name,
          profile_picture: profile.profile_picture,
          notification_preferences: profile.notification_preferences
        });
      } catch (createErr) {
        console.warn('Auto profile create fallback:', createErr.message);
      }
    }

    if (!user) {
      user = {
        id: userId,
        email: req.user.email || 'user@example.com',
        mobile_number: null,
        role: req.user.role || 'student',
        status: 'active',
        email_verified: true,
        phone_verified: false,
        created_at: new Date().toISOString()
      };
    }

    let auditLogs = [];
    try {
      auditLogs = await auditRepository.getRecentAuditLogs(userId, 10);
    } catch {
      auditLogs = [];
    }

    const normRole = (user.role || 'student').toLowerCase();
    const roleDetails = ROLE_FEATURES_MAP[normRole] || ROLE_FEATURES_MAP['student'];

    res.json({
      profile: {
        fullName: profile.full_name || req.user.fullName || req.user.full_name || 'Citizen',
        profilePicture: profile.profile_picture || req.user.profilePicture || req.user.profile_picture || null,
        notificationPreferences: profile.notification_preferences || { email: true, sms: true },
        department: profile.department || req.user.department || '',
        institution: profile.institution || ''
      },
      account: {
        id: user.id,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        created_at: user.created_at
      },
      roleDetails,
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
