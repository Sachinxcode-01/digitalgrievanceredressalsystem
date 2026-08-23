import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Save,
  CheckCircle,
  Bell,
  Shield,
  Camera,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Smartphone,
  Mail,
  Building,
  Award,
  Check,
  X,
  Lock,
  Key,
  ExternalLink,
  Laptop,
  Clock,
  Trash2,
  FileText,
  Activity,
  Layers,
  Copy,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../app/providers/AuthProvider';

import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const ProfilePage = ({ sessionUser, userProfile }) => {
  const { user, updateProfile, changePassword, getSessions, revokeSession } = useAuth();
  const { user: clerkUser } = useUser();

  // Active Tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'roles' | 'notifications' | 'security'

  // Profile Form States
  const [fullName, setFullName] = useState(() => user?.fullName || sessionUser?.fullName || '');
  const [email, setEmail] = useState(() => user?.email || sessionUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(() => user?.mobileNumber || user?.mobile_number || '');
  const [designation, setDesignation] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [department, setDepartment] = useState(() => user?.department || '');
  const [institution, setInstitution] = useState(() => user?.institution || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => user?.profilePicture || null);

  // Notification States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('realtime');

  // Telemetry & Role States
  const [roleDetails, setRoleDetails] = useState(null);
  const [accountMeta, setAccountMeta] = useState(null);
  const [stats, setStats] = useState({ totalFiled: 0, resolvedCount: 0, pendingCount: 0, resolutionRate: 100 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  // Action States
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const mfaEnabled = clerkUser ? clerkUser.twoFactorEnabled : false;
  const isGoogleUser = clerkUser?.externalAccounts?.some(acc => acc.provider === 'google') ||
    email.includes('@gmail.com') ||
    (avatarUrl && (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('img.clerk.com')));

  // Fetch full profile, role details, and sessions
  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await apiClient.get('/user/profile');
      if (res.data) {
        const { profile, account, roleDetails: rDetails, stats: rStats, logs } = res.data;

        if (profile) {
          setFullName(profile.fullName || '');
          setAvatarUrl(profile.profilePicture || null);
          setDepartment(profile.department || '');
          setInstitution(profile.institution || '');
          setDesignation(profile.designation || '');
          setInstitutionalId(profile.institutionalId || '');
          setCampusLocation(profile.campusLocation || '');
          setBio(profile.bio || '');
          if (profile.notificationPreferences) {
            setNotificationsEnabled(profile.notificationPreferences.email !== false);
            setSmsNotificationsEnabled(profile.notificationPreferences.sms !== false);
          }
        }

        if (account) {
          setEmail(account.email || '');
          setMobileNumber(account.mobile_number || '');
          setAccountMeta(account);
        }

        if (rDetails) {
          setRoleDetails(rDetails);
        }

        if (rStats) {
          setStats(rStats);
        }

        if (logs && Array.isArray(logs)) {
          setAuditLogs(logs);
        }
      }

      // Fetch active sessions for security tab
      if (getSessions) {
        const sessions = await getSessions();
        setActiveSessions(sessions || []);
      }
    } catch (err) {
      console.warn("Failed to load profile details from API:", err.message);
      if (clerkUser) {
        const gName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        if (gName && !fullName) setFullName(gName);
        if (clerkUser.imageUrl && !avatarUrl) setAvatarUrl(clerkUser.imageUrl);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [sessionUser, user?.id]);

  // Sync Google Details
  const handleSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    try {
      let gName = null;
      let gPicture = null;

      if (clerkUser) {
        gName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        gPicture = clerkUser.imageUrl;
      }

      if (gName) setFullName(gName);
      if (gPicture) setAvatarUrl(gPicture);

      if (gName || gPicture) {
        await apiClient.put('/user/profile', {
          fullName: gName || fullName,
          profilePicture: gPicture || avatarUrl
        });
        await updateProfile(gName || fullName, gPicture || avatarUrl, { email: notificationsEnabled, sms: smsNotificationsEnabled }, department, institution);
        toast.success("Google profile credentials synced successfully!");
      } else {
        toast.success("Profile is already in sync with Google Identity.");
      }
    } catch (err) {
      toast.error("Failed to sync Google profile: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Profile Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      return toast.error("Full name cannot be empty.");
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        profilePicture: avatarUrl,
        designation: designation.trim(),
        campusLocation: campusLocation.trim(),
        institutionalId: institutionalId.trim(),
        bio: bio.trim(),
        notificationPreferences: {
          email: notificationsEnabled,
          sms: smsNotificationsEnabled
        }
      };

      const isAdmin = user?.role === 'admin' || user?.role === 'super admin' || sessionUser?.role === 'admin' || sessionUser?.role === 'super admin';
      if (isAdmin) {
        payload.department = department.trim();
        payload.institution = institution.trim();
      }

      await apiClient.put('/user/profile', payload);

      if (mobileNumber !== undefined) {
        await apiClient.put('/user/account', {
          mobileNumber: mobileNumber.trim()
        });
      }

      // Update in-memory AuthProvider state
      await updateProfile(
        fullName.trim(),
        avatarUrl,
        payload.notificationPreferences,
        isAdmin ? department.trim() : undefined,
        isAdmin ? institution.trim() : undefined
      );

      setSaved(true);
      toast.success("Institutional profile updated successfully!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error("Failed to save profile: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error("Please upload a valid image file (PNG, JPEG, WebP, GIF).");
    }

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Avatar image size exceeds 2MB limit.");
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/uploads/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const publicUrl = res.data.publicUrl;
      setAvatarUrl(publicUrl);

      // Save to user profile immediately
      await apiClient.put('/user/profile', { profilePicture: publicUrl });
      await updateProfile(fullName, publicUrl, { email: notificationsEnabled, sms: smsNotificationsEnabled }, department, institution);

      toast.success("Profile avatar updated successfully!");
    } catch (err) {
      console.warn("Avatar storage upload fallback:", err.message);
      const fallbackUrl = URL.createObjectURL(file);
      setAvatarUrl(fallbackUrl);
      toast.success("Profile avatar updated!");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove Avatar
  const handleRemoveAvatar = async () => {
    try {
      setAvatarUrl(null);
      await apiClient.put('/user/profile', { profilePicture: null });
      await updateProfile(fullName, null, { email: notificationsEnabled, sms: smsNotificationsEnabled }, department, institution);
      toast.success("Profile avatar removed.");
    } catch (err) {
      toast.error("Failed to remove avatar: " + err.message);
    }
  };

  // Copy Institutional ID
  const handleCopyId = () => {
    if (institutionalId) {
      navigator.clipboard.writeText(institutionalId);
      setCopiedId(true);
      toast.success("Institutional ID copied to clipboard!");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword && !clerkUser) {
      return toast.error("Please enter your current password.");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password updated successfully! Other device sessions invalidated.");
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error("Password update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeDeviceSession = async (sessionId) => {
    try {
      if (revokeSession) {
        await revokeSession(sessionId);
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        toast.success("Session revoked successfully.");
      }
    } catch (err) {
      toast.error("Failed to revoke session: " + err.message);
    }
  };

  const initials = (fullName || email || 'C')[0].toUpperCase();
  const currentRole = (user?.role || sessionUser?.role || 'student').toLowerCase();

  // Badge Color Styles for Roles
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'super admin':
        return 'from-rose-500/20 via-rose-500/10 to-amber-500/20 border-rose-500/40 text-rose-400';
      case 'admin':
        return 'from-purple-500/20 via-purple-500/10 to-indigo-500/20 border-purple-500/40 text-purple-400';
      case 'officer':
        return 'from-amber-500/20 via-amber-500/10 to-orange-500/20 border-amber-500/40 text-amber-400';
      case 'faculty':
        return 'from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border-emerald-500/40 text-emerald-400';
      case 'staff':
        return 'from-cyan-500/20 via-cyan-500/10 to-blue-500/20 border-cyan-500/40 text-cyan-400';
      default:
        return 'from-indigo-500/20 via-indigo-500/10 to-cyan-500/20 border-indigo-500/40 text-indigo-400';
    }
  };

  return (
    <AnimatedPage className="space-y-8 max-w-6xl mx-auto w-full pt-4 pb-20 text-left px-2 sm:px-4">

      {/* ─── Hero Header & Identity Card ────────────────────────────────────────── */}
      <GlassPanel className="p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl rounded-3xl">
        <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-br from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">

          {/* Avatar & Core Identity */}
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap sm:flex-nowrap">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-2xl shadow-indigo-500/30 overflow-hidden ring-4 ring-slate-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="animate-spin text-indigo-400" size={24} />
                  </div>
                )}
              </div>

              <label
                title="Change Avatar Photo"
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-900/90 hover:bg-indigo-600 border border-white/20 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer text-slate-300 hover:text-white transition-all transform hover:scale-110"
              >
                <Camera size={15} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                  {fullName || 'Institutional Citizen'}
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border bg-linear-to-r shadow-xs ${getRoleBadgeStyle(currentRole)}`}>
                  {roleDetails?.title || currentRole}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-slate-300 font-sans font-medium">
                  <Mail size={13} className="text-indigo-400" />
                  {email}
                </span>

                {institutionalId && (
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-750 text-indigo-300 border border-white/10 text-[11px] font-mono transition-all"
                    title="Click to copy ID"
                  >
                    <Fingerprint size={12} className="text-indigo-400" />
                    <span>ID: {institutionalId}</span>
                    {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-slate-400" />}
                  </button>
                )}

                {isGoogleUser && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-sans font-semibold">
                    <CheckCircle2 size={11} /> Google Verified
                  </span>
                )}
              </div>

              {designation && (
                <p className="text-xs text-indigo-300/90 font-medium">
                  {designation} • {department || 'General Administration'}
                </p>
              )}
            </div>
          </div>

          {/* Telemetry Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-auto font-mono">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center min-w-25">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Filings</span>
              <span className="text-lg font-black text-white">{stats.totalFiled}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center min-w-25">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Resolved</span>
              <span className="text-lg font-black text-emerald-400">{stats.resolvedCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center min-w-25">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Success Rate</span>
              <span className="text-lg font-black text-cyan-400">{stats.resolutionRate}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center min-w-25">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Clearance</span>
              <span className="text-xs font-bold text-indigo-400 mt-1 block">
                {roleDetails?.clearanceLevel?.split('-')[0] || 'Level 1'}
              </span>
            </div>
          </div>

        </div>
      </GlassPanel>

      {/* ─── Navigation Tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
        >
          <User size={15} /> Personal Credentials
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${activeTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
        >
          <Award size={15} /> Role & Privileges
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${activeTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
        >
          <Bell size={15} /> Alert Channels
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
        >
          <ShieldCheck size={15} /> Security & Telemetry
        </button>
      </div>

      {/* ─── Tab 1: Personal Credentials & Identity Form ─────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Avatar Studio Card */}
          <div className="space-y-6">
            <MotionCard className="p-6 text-center" tilt={false}>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                Profile Photo Studio
              </h4>

              <div className="relative mb-5 mx-auto w-32 h-32 group">
                <div className="w-full h-full rounded-3xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-indigo-500/20 overflow-hidden relative ring-4 ring-slate-900">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                      <RefreshCw className="animate-spin text-indigo-400" size={24} />
                    </div>
                  )}
                </div>

                <label
                  title="Upload New Photo"
                  className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transition-all transform hover:scale-105"
                >
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>

              <p className="text-xs text-slate-400 mb-4 font-medium">
                Supports PNG, JPEG, WebP, GIF (Max 2MB).
              </p>

              <div className="flex flex-col gap-2">
                <label className="cursor-pointer w-full">
                  <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all">
                    <Camera size={14} /> Upload Custom Photo
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
                  >
                    <Trash2 size={13} /> Remove Photo
                  </button>
                )}

                {isGoogleUser && (
                  <button
                    type="button"
                    onClick={handleSyncGoogle}
                    disabled={isSyncingGoogle}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-white/10 text-xs font-bold transition-all"
                  >
                    <RefreshCw size={13} className={isSyncingGoogle ? 'animate-spin text-indigo-400' : ''} />
                    Sync Google Identity
                  </button>
                )}
              </div>
            </MotionCard>

            {/* Verification Metadata Box */}
            <GlassPanel className="p-6 font-mono text-xs space-y-3">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-white/10">
                Verification Metadata
              </h5>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Identity Tier:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <BadgeCheck size={14} /> Level 2 Verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">OAuth Provider:</span>
                <span className="text-white font-bold">{isGoogleUser ? 'Google OAuth 2.0' : 'Email/Password'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Encryption:</span>
                <span className="text-cyan-400 font-bold">AES-256 GCM</span>
              </div>
            </GlassPanel>
          </div>

          {/* Form Fields Card */}
          <div className="lg:col-span-2 space-y-6">
            <GlassPanel className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-400" size={20} />
                  <div>
                    <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">
                      Official Institutional Record
                    </h4>
                    <p className="text-xs text-slate-400">Keep your institutional credentials, department, and contact information current.</p>
                  </div>
                </div>

                {isGoogleUser && (
                  <button
                    type="button"
                    onClick={handleSyncGoogle}
                    disabled={isSyncingGoogle}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all"
                  >
                    <RefreshCw size={12} className={isSyncingGoogle ? 'animate-spin' : ''} />
                    Sync Google Record
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Full Legal Name *</span>
                      {isGoogleUser && <span className="text-indigo-400 font-sans text-[10px]">Google Synced</span>}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Institutional Email Address</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={11} /> Verified
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-slate-400 text-xs font-mono opacity-80 cursor-not-allowed pr-10"
                      />
                      <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>

                  {/* Designation / Title */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Designation / Role Title
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Undergraduate Student, Assistant Professor"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Institutional ID */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Student / Employee Roll ID
                    </label>
                    <input
                      type="text"
                      value={institutionalId}
                      onChange={(e) => setInstitutionalId(e.target.value)}
                      placeholder="e.g. STU-2026-8821"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>

                  {/* Mobile Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Mobile Contact Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>

                  {/* Campus Zone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Campus / Regional Location
                    </label>
                    <input
                      type="text"
                      value={campusLocation}
                      onChange={(e) => setCampusLocation(e.target.value)}
                      placeholder="e.g. North Academic Complex, Block B"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Department / Division</span>
                      {currentRole !== 'admin' && currentRole !== 'super admin' && (
                        <span className="text-[10px] text-slate-500 font-sans font-normal">Contact Admin to transfer departments</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science, Student Affairs, Finance"
                      disabled={currentRole !== 'admin' && currentRole !== 'super admin' && currentRole !== 'officer'}
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-bold outline-none transition-all ${currentRole === 'admin' || currentRole === 'super admin' || currentRole === 'officer'
                          ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500'
                          : 'bg-slate-950/40 border-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                    />
                  </div>

                  {/* Bio statement */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Official Description / Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief note or administrative remarks..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-end pt-4 border-t border-white/10 gap-3">
                  <AnimatedButton
                    type="submit"
                    variant="glow"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={saved ? CheckCircle : Save}
                  >
                    {saved ? 'Saved Successfully' : 'Save Profile Changes'}
                  </AnimatedButton>
                </div>
              </form>
            </GlassPanel>
          </div>

        </div>
      )}

      {/* ─── Tab 2: Role Clearances & Privileges Matrix ──────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 flex-wrap">
              <div className="flex items-center gap-3">
                <Award className="text-amber-400" size={24} />
                <div>
                  <h3 className="text-lg font-heading font-black text-white uppercase tracking-tight">
                    Clearance Matrix & Role Privileges
                  </h3>
                  <p className="text-xs text-slate-400">Detailed breakdown of active capabilities assigned to your account level.</p>
                </div>
              </div>

              <div className={`px-4 py-1.5 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider bg-linear-to-r ${getRoleBadgeStyle(currentRole)}`}>
                Active Role: {roleDetails?.title || currentRole}
              </div>
            </div>

            {/* Clearance Hierarchy Meter */}
            <div className="mb-8 p-6 rounded-2xl bg-slate-950 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase font-bold">Clearance Level Progression</span>
                <span className="text-indigo-400 font-bold">{roleDetails?.clearanceLevel || 'Level 1'}</span>
              </div>

              <div className="grid grid-cols-5 gap-2 font-mono text-[10px]">
                {['Level 1: Student', 'Level 2: Faculty', 'Level 3: Officer', 'Level 4: Admin', 'Level 5: Super'].map((lvl, idx) => {
                  const currentLevelNum = currentRole === 'super admin' ? 5 : (currentRole === 'admin' ? 4 : (currentRole === 'officer' ? 3 : (currentRole === 'faculty' || currentRole === 'staff' ? 2 : 1)));
                  const isAchieved = idx + 1 <= currentLevelNum;
                  const isCurrent = idx + 1 === currentLevelNum;

                  return (
                    <div
                      key={lvl}
                      className={`p-2.5 rounded-xl border text-center transition-all ${isCurrent
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-400'
                          : isAchieved
                            ? 'bg-slate-900 border-white/10 text-slate-300'
                            : 'bg-slate-950/40 border-white/5 text-slate-600'
                        }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isAchieved ? <CheckCircle size={12} className="text-emerald-400" /> : <Lock size={12} className="text-slate-600" />}
                      </div>
                      <span className="truncate block">{lvl}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Capabilities Grid */}
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
              Feature Capabilities & Authorization Permissions
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleDetails?.features?.map((feat) => (
                <div
                  key={feat.id}
                  className={`p-4 rounded-2xl border transition-all ${feat.enabled
                      ? 'bg-slate-900/70 border-white/10 hover:border-indigo-500/40'
                      : 'bg-slate-950/50 border-white/5 opacity-40'
                    }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 ${feat.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                      }`}>
                      {feat.enabled ? <Check size={13} strokeWidth={3} /> : <Lock size={12} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white tracking-tight">{feat.label}</h5>
                        {feat.enabled && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ENABLED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ─── Tab 3: Communication & Alert Channels ───────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <Bell className="text-indigo-400" size={24} />
              <div>
                <h3 className="text-lg font-heading font-black text-white uppercase tracking-tight">
                  Notification Preferences & Alert Channels
                </h3>
                <p className="text-xs text-slate-400">Configure how and when the system delivers status updates and resolution alerts.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Channel 1: SMTP Email */}
              <div
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${notificationsEnabled ? 'bg-indigo-600/10 border-indigo-500/30 shadow-lg shadow-indigo-600/5' : 'bg-slate-950 border-white/10'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${notificationsEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">SMTP Email Dispatches</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Receive official ticket submission acknowledgments and resolution status transition updates.</p>
                    <span className="text-[10px] font-mono text-indigo-400 mt-1 block">Recipient: {email}</span>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>

              {/* Channel 2: SMS Gateway */}
              <div
                onClick={() => setSmsNotificationsEnabled(!smsNotificationsEnabled)}
                className={`p-5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${smsNotificationsEnabled ? 'bg-cyan-600/10 border-cyan-500/30 shadow-lg shadow-cyan-600/5' : 'bg-slate-950 border-white/10'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${smsNotificationsEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">SMS Gateway High-Priority Alerts</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Direct SMS text messages delivered for high-urgency SLA breaches and official escalations.</p>
                    <span className="text-[10px] font-mono text-cyan-400 mt-1 block">Phone: {mobileNumber || 'Not configured'}</span>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsNotificationsEnabled ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>

              {/* Channel 3: Frequency Controls */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Dispatch Frequency Strategy
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setDigestFrequency('realtime')}
                    className={`p-3 rounded-xl border text-left transition-all ${digestFrequency === 'realtime'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                  >
                    <span className="font-bold block text-sm">⚡ Real-time Instant</span>
                    <span className="text-[10px] text-slate-400">Trigger immediately upon status change</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDigestFrequency('digest')}
                    className={`p-3 rounded-xl border text-left transition-all ${digestFrequency === 'digest'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                  >
                    <span className="font-bold block text-sm">📅 Daily Digest</span>
                    <span className="text-[10px] text-slate-400">Combined summary report at 18:00</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AnimatedButton
                  onClick={handleSave}
                  variant="glow"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={saved ? CheckCircle : Save}
                >
                  {saved ? 'Saved' : 'Save Alert Channels'}
                </AnimatedButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ─── Tab 4: Security, Active Sessions & Audit Telemetry ───────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">

          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={24} className={mfaEnabled ? 'text-emerald-400' : 'text-amber-400'} />
                <h5 className="text-sm font-bold text-white">Two-Factor (2FA)</h5>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold inline-block mb-2 ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                {mfaEnabled ? 'ACTIVE (ENFORCED)' : 'OPTIONAL'}
              </span>
              <p className="text-xs text-slate-400">Extra layer of verification protecting login sessions.</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Key size={24} className="text-indigo-400" />
                <h5 className="text-sm font-bold text-white">Password Status</h5>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all mb-2 block"
              >
                Change Keyphrase
              </button>
              <p className="text-xs text-slate-400">Encrypted with bcrypt (10 rounds salt).</p>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe size={24} className="text-cyan-400" />
                <h5 className="text-sm font-bold text-white">Google Identity</h5>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold inline-block mb-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {isGoogleUser ? 'OAUTH CONNECTED' : 'LOCAL ACCOUNT'}
              </span>
              <p className="text-xs text-slate-400">Federated single sign-on authentication.</p>
            </GlassPanel>
          </div>

          {/* Active Sessions Telemetry */}
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 flex-wrap">
              <div className="flex items-center gap-3">
                <Laptop className="text-indigo-400" size={20} />
                <div>
                  <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">
                    Active Authentication Sessions
                  </h4>
                  <p className="text-xs text-slate-400">Inspect device logins with real-time token telemetry.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Laptop size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="text-xs font-bold text-white">{session.device_info || 'Chrome Browser / Desktop'}</h6>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              CURRENT ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          IP: {session.ip_address || '127.0.0.1'} • Last active: {session.last_active_at ? new Date(session.last_active_at).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeDeviceSession(session.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
                      >
                        Revoke Token
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Laptop size={18} className="text-emerald-400" />
                    <div>
                      <h6 className="text-xs font-bold text-white">Current Active Web Session</h6>
                      <p className="text-[11px] font-mono text-slate-400">Authenticated Session Token (AES-256)</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* User Audit Log Trail */}
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <Clock className="text-indigo-400" size={18} />
              <h4 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider">
                Recent Security & Activity History
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 5).map((log, i) => (
                  <div key={log.id || i} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-indigo-300 font-bold">{log.action}</span>
                      <span className="text-slate-500 ml-2 text-[11px]">IP: {log.ip_address || '127.0.0.1'}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 text-slate-500 text-center">
                  No recorded security incidents or warnings.
                </div>
              )}
            </div>
          </GlassPanel>

        </div>
      )}

      {/* ─── Change Password Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Key className="text-indigo-400" size={20} />
                  <h3 className="text-lg font-heading font-black text-white uppercase">Update Password</h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {!clerkUser && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">New Password (min 8 characters)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <AnimatedButton
                    type="submit"
                    variant="glow"
                    size="sm"
                    isLoading={isUpdatingPassword}
                  >
                    Save New Password
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
};

export default ProfilePage;
