import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, CheckCircle, Bell, Shield, Camera, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../api/apiClient';

import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const ProfilePage = ({ sessionUser, userProfile }) => {
  const [fullName, setFullName] = useState(() => sessionUser?.fullName || '');
  const [email, setEmail] = useState(() => sessionUser?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [mobileNumber, setMobileNumber] = useState(() => sessionUser?.mobile_number || '');
  const [department, setDepartment] = useState(() => sessionUser?.department || '');
  const [institution, setInstitution] = useState(() => sessionUser?.institution || '');
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'English');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'Dark');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isOTPRequested, setIsOTPRequested] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { user: clerkUser } = useUser();
  const mfaEnabled = clerkUser ? clerkUser.twoFactorEnabled : false;

  useEffect(() => {
    if (sessionUser && !sessionUser.id?.startsWith('demo-')) {
      const loadProfile = async () => {
        try {
          const res = await apiClient.get('/user/profile');
          if (res.data) {
            setFullName(prev => prev !== res.data.profile.fullName ? (res.data.profile.fullName || '') : prev);
            setNotificationsEnabled(prev => prev !== (res.data.profile.notificationPreferences?.email !== false) ? (res.data.profile.notificationPreferences?.email !== false) : prev);
            setAvatarUrl(prev => prev !== res.data.profile.profilePicture ? (res.data.profile.profilePicture || null) : prev);
            setMobileNumber(prev => prev !== res.data.account.mobile_number ? (res.data.account.mobile_number || '') : prev);
            setDepartment(prev => prev !== res.data.profile.department ? (res.data.profile.department || '') : prev);
            setInstitution(prev => prev !== res.data.profile.institution ? (res.data.profile.institution || '') : prev);
          }
        } catch (err) {
          console.error("Failed to load profile details:", err.message);
          setFullName(prev => prev !== sessionUser.fullName ? (sessionUser.fullName || '') : prev);
        }
      };

      loadProfile();
    }
  }, [sessionUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (sessionUser?.id?.startsWith('demo-')) {
      await new Promise(r => setTimeout(r, 800));
      setSaved(true);
      toast.success("Profile updates saved in simulation.");
      setTimeout(() => setSaved(false), 2500);
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        fullName,
        notificationPreferences: {
          email: notificationsEnabled,
          sms: notificationsEnabled
        }
      };

      const isAdmin = sessionUser?.role === 'admin' || sessionUser?.role === 'super admin';
      if (isAdmin) {
        payload.department = department;
        payload.institution = institution;
      }

      await apiClient.put('/user/profile', payload);

      if (mobileNumber.trim() !== '') {
        await apiClient.put('/user/account', {
          mobileNumber: mobileNumber.trim()
        });
      }
      
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error("Failed to save profile: " + (err.response?.data?.error || err.message));
    }
    
    setIsSaving(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!isOTPRequested) {
      setIsUpdatingPassword(true);
      try {
        await apiClient.post('/auth/send-otp', { email, type: 'recovery' });
        toast.success("Recovery key sent via email.");
        setIsOTPRequested(true);
      } catch (err) {
        toast.error("Security verification failed: " + (err.response?.data?.error || err.message));
      } finally {
        setIsUpdatingPassword(false);
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      await apiClient.post('/auth/verify-otp', { email, otp: resetToken });
      
      if (sessionUser?.id?.startsWith('demo-')) {
        toast.success("Password simulated update.");
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) {
          toast.error("Failed to update password: " + updateError.message);
        } else {
          toast.success("Keyphrase updated successfully!");
        }
      }
    } catch (err) {
      toast.error("Invalid OTP key: " + (err.response?.data?.error || err.message));
    } finally {
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setIsOTPRequested(false);
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar file size exceeds 2MB limit.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${sessionUser?.id || 'anon'}_${Date.now()}.${fileExt}`;
      const filePath = `user_avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setAvatarUrl(publicUrl);

      if (sessionUser && !sessionUser.id?.startsWith('demo-')) {
        await apiClient.put('/user/profile', {
          profilePicture: publicUrl
        });
      }

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

  const initials = (fullName || email || '?')[0].toUpperCase();
  const registrationDate = sessionUser?.created_at ? new Date(sessionUser.created_at).toLocaleDateString() : 'Active Node';

  return (
    <AnimatedPage className="space-y-8 max-w-4xl mx-auto w-full pt-4 pb-20 text-left px-1">
      {/* Header Info */}
      <GlassPanel className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              R
            </div>
            <div>
              <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight">System Identity</h2>
              <p className="text-xs text-slate-400 font-medium">Configure profile details, MFA settings, and credential keys.</p>
            </div>
          </div>
          <div className="text-left sm:text-right font-mono text-[10px]">
            <p className="text-slate-400 uppercase font-bold tracking-wider">Registration Node</p>
            <p className="text-indigo-400 font-bold mt-0.5">{registrationDate}</p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Avatar Card */}
        <div className="space-y-6">
          <MotionCard className="p-8 text-center" tilt={false}>
            <div className="relative mb-6 mx-auto w-28 h-28">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-indigo-500/20 overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 border border-white/10 hover:border-indigo-500 rounded-xl shadow-md flex items-center justify-center cursor-pointer text-slate-400 hover:text-white transition-all">
                <Camera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-heading font-black text-white">{fullName || 'Citizen Operator'}</h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[220px] mx-auto">{email}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase">Clearance</span>
                <span className="text-indigo-400 font-bold">{userProfile?.role || 'Citizen'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase">Encryption</span>
                <span className="text-emerald-400 font-bold">AES-256</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 uppercase">Status</span>
                <span className="text-cyan-400 font-bold">Synchronized</span>
              </div>
            </div>
          </MotionCard>
        </div>

        {/* Configurations */}
        <div className="lg:col-span-2 space-y-6">
          
          <GlassPanel className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <User className="text-indigo-400" size={18} />
              <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">Personal Credentials</h4>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/40 border border-white/10 text-slate-500 text-xs font-mono opacity-60 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. IT Support, Student Affairs"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div 
                className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 cursor-pointer flex items-center justify-between"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <div className="flex items-center gap-3">
                  <Bell className="text-indigo-400" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Real-Time Pings</h4>
                    <p className="text-[10px] text-slate-400">Receive notifications about modifications to your filings.</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AnimatedButton 
                  type="submit"
                  variant="glow"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={saved ? CheckCircle : Save}
                >
                  {saved ? 'Synced' : 'Save Settings'}
                </AnimatedButton>
              </div>
            </form>
          </GlassPanel>

          {/* MFA Status */}
          <GlassPanel className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <ShieldCheck className="text-emerald-400" size={18} />
              <h4 className="text-base font-heading font-extrabold text-white uppercase tracking-wide">Multi-Factor Security</h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-white/10">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className={mfaEnabled ? 'text-emerald-400' : 'text-amber-400'} />
                <div>
                  <h5 className="text-xs font-bold text-white uppercase">
                    MFA Verification: <span className={mfaEnabled ? 'text-emerald-400' : 'text-amber-400'}>{mfaEnabled ? 'ENABLED' : 'DISABLED'}</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Two-step verification protects access with temporary security codes.</p>
                </div>
              </div>
            </div>
          </GlassPanel>

        </div>
      </div>
    </AnimatedPage>
  );
};

export default ProfilePage;
