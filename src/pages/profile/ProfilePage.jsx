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
  Trash2
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
  const { user, updateProfile, changePassword } = useAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const [fullName, setFullName] = useState(() => user?.fullName || sessionUser?.fullName || '');
  const [email, setEmail] = useState(() => user?.email || sessionUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(() => user?.mobileNumber || user?.mobile_number || '');
  const [department, setDepartment] = useState(() => user?.department || '');
  const [institution, setInstitution] = useState(() => user?.institution || '');
  const [avatarUrl, setAvatarUrl] = useState(() => user?.profilePicture || null);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  
  const [roleDetails, setRoleDetails] = useState(null);
  const [accountMeta, setAccountMeta] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Password Update Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const mfaEnabled = clerkUser ? clerkUser.twoFactorEnabled : false;
  const isGoogleUser = clerkUser?.externalAccounts?.some(acc => acc.provider === 'google') || 
                       email.includes('@gmail.com') || 
                       (avatarUrl && (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('img.clerk.com')));

  // Fetch full profile & role details from backend
  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await apiClient.get('/user/profile');
      if (res.data) {
        const { profile, account, roleDetails: rDetails, logs } = res.data;
        
        if (profile) {
          setFullName(profile.fullName || '');
          setAvatarUrl(profile.profilePicture || null);
          setDepartment(profile.department || '');
          setInstitution(profile.institution || '');
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

        if (logs && Array.isArray(logs)) {
          setAuditLogs(logs);
        }
      }
    } catch (err) {
      console.warn("Failed to load full profile details from API:", err.message);
      // Fallback from session or Clerk
      if (clerkUser) {
        const gName = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : '';
        if (gName && !fullName) setFullName(gName);
        if (clerkUser.imageUrl && !avatarUrl) setAvatarUrl(clerkUser.imageUrl);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [sessionUser, user?.id]);

  // Sync Google Details on demand
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
        toast.success("Google profile details synced successfully!");
      } else {
        toast.success("Profile is already in sync with your account.");
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
      toast.success("Profile settings saved successfully!");
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
      console.warn("Avatar upload fallback:", err.message);
      const fallbackUrl = URL.createObjectURL(file);
      setAvatarUrl(fallbackUrl);
      toast.success("Profile avatar updated locally!");
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
      toast.success("Password changed successfully! Other device sessions invalidated.");
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

  const initials = (fullName || email || 'C')[0].toUpperCase();
  const currentRole = (user?.role || sessionUser?.role || 'student').toLowerCase();
  
  // Badge Color Styles for Roles
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'super admin':
        return 'from-rose-500/20 to-amber-500/20 border-rose-500/40 text-rose-400';
      case 'admin':
        return 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400';
      case 'officer':
        return 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400';
      case 'faculty':
        return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400';
      case 'staff':
        return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400';
      default:
        return 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/40 text-indigo-400';
    }
  };

  return (
    <AnimatedPage className="space-y-8 max-w-5xl mx-auto w-full pt-4 pb-20 text-left px-2 sm:px-4">
      {/* Top Banner & Header */}
      <GlassPanel className="p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shadow-indigo-500/30 overflow-hidden ring-4 ring-slate-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <label 
                title="Upload Profile Photo" 
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900/90 hover:bg-indigo-600 border border-white/20 rounded-xl shadow-lg flex items-center justify-center cursor-pointer text-slate-300 hover:text-white transition-all transform hover:scale-110"
              >
                <Camera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                  {fullName || 'Citizen User'}
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border bg-linear-to-r ${getRoleBadgeStyle(currentRole)}`}>
                  {roleDetails?.title || currentRole}
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail size={13} className="text-indigo-400" />
                  {email}
                </span>
                {isGoogleUser && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-sans font-semibold">
                    <CheckCircle size={11} /> Google Identity Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 font-mono text-[11px]">
            <span className="text-slate-400 uppercase font-bold tracking-wider">Account Clearance</span>
            <span className="text-indigo-400 font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              {roleDetails?.clearanceLevel || 'Level 1 - Standard'}
            </span>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar Management & Role Privileges */}
        <div className="space-y-6">
          
          {/* Avatar Management Studio */}
          <MotionCard className="p-6 text-center" tilt={false}>
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
              Profile Photo & Avatar
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
                title="Change Photo"
                className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transition-all transform hover:scale-105"
              >
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-4 font-medium">
              Allowed: PNG, JPEG, WebP, GIF (Max 2MB).
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all">
                  <Camera size={13} /> Change Photo
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}

              {isGoogleUser && (
                <button
                  type="button"
                  onClick={handleSyncGoogle}
                  disabled={isSyncingGoogle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold transition-all w-full mt-2 justify-center"
                >
                  <RefreshCw size={13} className={isSyncingGoogle ? 'animate-spin' : ''} />
                  Sync Google Avatar & Name
                </button>
              )}
            </div>
          </MotionCard>

          {/* Role & Privileges Showcase */}
          <GlassPanel className="p-6">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
              <Award className="text-amber-400" size={18} />
              <h4 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider">
                Role Features & Privileges
              </h4>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {roleDetails?.description || 'Your registered clearance grants standard filing, tracking, and AI triage capabilities.'}
            </p>

            <div className="space-y-2.5">
              {roleDetails?.features?.map((feat) => (
                <div 
                  key={feat.id} 
                  className={`p-3 rounded-xl border transition-all ${
                    feat.enabled 
                      ? 'bg-slate-900/60 border-white/10' 
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      feat.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {feat.enabled ? <Check size={10} strokeWidth={3} /> : <Lock size={9} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white tracking-tight">{feat.label}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{feat.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

        </div>

        {/* Right Columns: Personal Details, Notifications, Security */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Credentials & Identity Form */}
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <User className="text-indigo-400" size={20} />
                <div>
                  <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">
                    Personal Information & Settings
                  </h4>
                  <p className="text-xs text-slate-400">Update your verified identification name, contact line, and profile configurations.</p>
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
                  Fetch Google Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Full Name *</span>
                    {isGoogleUser && <span className="text-indigo-400 lowercase font-normal">synced with Google</span>}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Email Address (Immutable / Verified) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-white/10 text-slate-400 text-xs font-mono opacity-80 cursor-not-allowed pr-10"
                    />
                    <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                  />
                </div>

                {/* Department (Accessible to officers / admins) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Department / Division
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science, Academic Affairs"
                    disabled={currentRole !== 'admin' && currentRole !== 'super admin' && currentRole !== 'officer'}
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-bold outline-none transition-all ${
                      currentRole === 'admin' || currentRole === 'super admin' || currentRole === 'officer'
                        ? 'bg-slate-950 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-950/40 border-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-2 space-y-3">
                <h5 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Real-time Notifications & Alerts
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email Notifications */}
                  <div 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      notificationsEnabled ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-slate-950 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Mail className={notificationsEnabled ? 'text-indigo-400' : 'text-slate-500'} size={18} />
                      <div>
                        <h6 className="text-xs font-bold text-white">Email Dispatches</h6>
                        <p className="text-[10px] text-slate-400 mt-0.5">Receive ticket resolution alerts via SMTP</p>
                      </div>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </div>
                  </div>

                  {/* SMS Alerts */}
                  <div 
                    onClick={() => setSmsNotificationsEnabled(!smsNotificationsEnabled)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      smsNotificationsEnabled ? 'bg-cyan-600/10 border-cyan-500/30' : 'bg-slate-950 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className={smsNotificationsEnabled ? 'text-cyan-400' : 'text-slate-500'} size={18} />
                      <div>
                        <h6 className="text-xs font-bold text-white">SMS Gateway Alerts</h6>
                        <p className="text-[10px] text-slate-400 mt-0.5">High-priority SMS delivery on status changes</p>
                      </div>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${smsNotificationsEnabled ? 'bg-cyan-600' : 'bg-slate-800'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${smsNotificationsEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
                >
                  <Key size={14} className="text-indigo-400" />
                  Change Password
                </button>

                <AnimatedButton 
                  type="submit"
                  variant="glow"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={saved ? CheckCircle : Save}
                >
                  {saved ? 'Saved Successfully' : 'Save Changes'}
                </AnimatedButton>
              </div>
            </form>
          </GlassPanel>

          {/* Security & Multi-Factor Section */}
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <ShieldCheck className="text-emerald-400" size={20} />
              <div>
                <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">
                  Account Security & Session Telemetry
                </h4>
                <p className="text-xs text-slate-400">Manage multi-factor authentication and inspect authenticated login sessions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MFA Status */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className={mfaEnabled ? 'text-emerald-400' : 'text-amber-400'} />
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Two-Factor Authentication: <span className={mfaEnabled ? 'text-emerald-400' : 'text-amber-400'}>{mfaEnabled ? 'ACTIVE' : 'OPTIONAL'}</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mandatory for administrator accounts</p>
                  </div>
                </div>
              </div>

              {/* Active Sessions Quick Access */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop size={20} className="text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Active Device Sessions</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">View and revoke active device tokens</p>
                  </div>
                </div>
                <a
                  href="/sessions"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
                >
                  Manage
                </a>
              </div>
            </div>
          </GlassPanel>

        </div>
      </div>

      {/* Change Password Modal */}
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
                  <h3 className="text-lg font-heading font-black text-white uppercase">Change Password</h3>
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
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">New Password (min 8 chars)</label>
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
                    Update Password
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
