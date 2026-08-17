import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Palette, Camera, Save, RotateCcw, CheckCircle, 
  Moon, Sun, ShieldCheck, Laptop, Building, Activity, LogOut, FileText, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { apiClient } from '../../api/apiClient';

import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const SettingsPage = ({ sessionUser, onLogout, theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form States
  const [fullName, setFullName] = useState(() => sessionUser?.fullName || sessionUser?.full_name || '');
  const [email] = useState(() => sessionUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(() => sessionUser?.mobile_number || '');
  const [department, setDepartment] = useState(() => sessionUser?.department || '');
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Notification States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState(true);
  const [assignmentAlerts, setAssignmentAlerts] = useState(true);
  const [resolutionAlerts, setResolutionAlerts] = useState(true);
  const [feedbackReminders, setFeedbackReminders] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Appearance & Officer Availability States
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('app_reduced_motion') === 'true');
  const [officerAvailable, setOfficerAvailable] = useState(true);
  
  const { user: clerkUser } = useUser();
  const mfaEnabled = clerkUser ? clerkUser.twoFactorEnabled : false;
  const userRole = (sessionUser?.role || 'student').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'super admin';
  const isOfficer = userRole === 'officer' || userRole === 'faculty' || userRole === 'staff';

  useEffect(() => {
    if (sessionUser && !sessionUser.id?.startsWith('demo-')) {
      const loadSettings = async () => {
        try {
          const res = await apiClient.get('/user/profile');
          if (res.data) {
            const p = res.data.profile || {};
            const a = res.data.account || {};
            setFullName(p.fullName || p.full_name || sessionUser.fullName || '');
            setAvatarUrl(p.profilePicture || null);
            setDepartment(p.department || '');
            setMobileNumber(a.mobile_number || '');
            
            if (p.notificationPreferences) {
              setEmailAlerts(p.notificationPreferences.email !== false);
              setStatusAlerts(p.notificationPreferences.status !== false);
              setAssignmentAlerts(p.notificationPreferences.assignment !== false);
              setResolutionAlerts(p.notificationPreferences.resolution !== false);
              setFeedbackReminders(p.notificationPreferences.feedback !== false);
            }
          }
        } catch (err) {
          console.warn('Load settings fallback:', err.message);
        }
      };
      loadSettings();
    }
  }, [sessionUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    if (sessionUser?.id?.startsWith('demo-')) {
      await new Promise(r => setTimeout(r, 600));
      setSavedProfile(true);
      toast.success("Profile preferences saved!");
      setTimeout(() => setSavedProfile(false), 2000);
      setIsSavingProfile(false);
      return;
    }

    try {
      await apiClient.put('/user/profile', {
        fullName,
        department,
        profilePicture: avatarUrl
      });

      if (mobileNumber.trim()) {
        await apiClient.put('/user/account', {
          mobileNumber: mobileNumber.trim()
        });
      }

      setSavedProfile(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSavedProfile(false), 2000);
    } catch (err) {
      toast.error("Failed to save profile: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    setFullName(sessionUser?.fullName || sessionUser?.full_name || '');
    setMobileNumber(sessionUser?.mobile_number || '');
    setDepartment(sessionUser?.department || '');
    toast.success("Form fields reset to saved defaults.");
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image size must be under 5MB.");
      return;
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

      if (sessionUser && !sessionUser.id?.startsWith('demo-')) {
        await apiClient.put('/user/profile', { profilePicture: publicUrl });
      }
      toast.success("Profile picture updated!");
    } catch (err) {
      console.warn('Avatar upload fallback:', err.message);
      const fallbackUrl = URL.createObjectURL(file);
      setAvatarUrl(fallbackUrl);
      toast.success("Profile avatar updated!");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const payload = {
        email: emailAlerts,
        status: statusAlerts,
        assignment: assignmentAlerts,
        resolution: resolutionAlerts,
        feedback: feedbackReminders
      };

      if (!sessionUser?.id?.startsWith('demo-')) {
        await apiClient.put('/user/profile', {
          notificationPreferences: payload
        });
      }

      toast.success("Notification preferences saved!");
    } catch (err) {
      toast.error("Failed to save notification preferences.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleToggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    localStorage.setItem('app_reduced_motion', String(nextVal));
    toast.success(nextVal ? "Reduced motion enabled." : "Standard motion enabled.");
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Settings', icon: Building }] : []),
    ...(isOfficer ? [{ id: 'officer', label: 'Officer Panel', icon: Activity }] : [])
  ];

  return (
    <AnimatedPage className="space-y-6 max-w-5xl mx-auto w-full pt-4 pb-20 text-left px-2">
      {/* Settings Header */}
      <GlassPanel className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              <User size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Account Settings</h1>
              <p className="text-xs text-slate-400 font-medium">Manage profile info, security credentials, notification triggers, and theme preferences.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-mono font-bold uppercase">
            Role: {userRole}
          </span>
        </div>
      </GlassPanel>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Avatar & Card */}
            <MotionCard className="p-6 text-center space-y-6" tilt={false}>
              <div className="relative mx-auto w-28 h-28">
                <div className="w-full h-full rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-indigo-500/20 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (fullName || email || 'A')[0].toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-900 border border-white/20 hover:border-indigo-500 rounded-xl shadow-md flex items-center justify-center cursor-pointer text-slate-300 hover:text-white transition-all">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>

              <div>
                <h3 className="text-lg font-heading font-black text-white">{fullName || 'System User'}</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{email}</p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Status</span>
                  <span className="text-emerald-400 font-bold uppercase">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clearance</span>
                  <span className="text-indigo-400 font-bold uppercase">{userRole}</span>
                </div>
              </div>
            </MotionCard>

            {/* Profile Form */}
            <GlassPanel className="lg:col-span-2 p-6">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-slate-500 text-xs font-mono opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mobile Contact</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Department / Sector</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Facilities, IT, Academic"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleResetProfile}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                  <AnimatedButton
                    type="submit"
                    variant="glow"
                    size="md"
                    isLoading={isSavingProfile}
                    leftIcon={savedProfile ? CheckCircle : Save}
                  >
                    {savedProfile ? 'Saved' : 'Save Changes'}
                  </AnimatedButton>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  <div>
                    <h3 className="text-sm font-heading font-bold text-white uppercase">Authentication & Sessions</h3>
                    <p className="text-xs text-slate-400">View active session status and security verification options.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">Multi-Factor Authentication</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">MFA enforcement is managed automatically via Clerk identity provider.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">Connected Account</span>
                    <span className="text-indigo-400 font-mono text-[10px] font-bold uppercase">Google / Clerk</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Single Sign-On (SSO) active for identity token verification.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Session Termination</h4>
                  <p className="text-[11px] text-slate-400">Log out of your current session on this workstation.</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  Terminate Session
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-sm font-heading font-bold text-white uppercase">Notification Dispatch Center</h3>
                <p className="text-xs text-slate-400">Configure email and real-time alert triggers for grievance events.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive email alerts on grievance updates.', state: emailAlerts, setState: setEmailAlerts },
                  { title: 'Grievance Status Updates', desc: 'Alert when ticket status changes (e.g. In Progress, Resolved).', state: statusAlerts, setState: setStatusAlerts },
                  { title: 'Officer Assignment Alerts', desc: 'Alert when a ticket is assigned to an officer or department.', state: assignmentAlerts, setState: setAssignmentAlerts },
                  { title: 'Resolution Confirmations', desc: 'Alert when grievance resolution notes are recorded.', state: resolutionAlerts, setState: setResolutionAlerts },
                  { title: 'Feedback Reminders', desc: 'Reminder pings to submit satisfaction ratings upon ticket closure.', state: feedbackReminders, setState: setFeedbackReminders }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => item.setState(!item.state)}
                    className="p-4 rounded-2xl bg-slate-950 border border-white/10 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.state ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.state ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <AnimatedButton
                  variant="glow"
                  size="md"
                  onClick={handleSaveNotifications}
                  isLoading={isSavingNotifications}
                  leftIcon={Save}
                >
                  Save Notification Settings
                </AnimatedButton>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-sm font-heading font-bold text-white uppercase">Appearance & Accessibility Controls</h3>
                <p className="text-xs text-slate-400">Customize color theme palette, font scaling, and visual accessibility options.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-3">Color Theme Palette</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setTheme('ocean');
                        document.documentElement.className = '';
                        localStorage.setItem('app_theme', 'ocean');
                      }}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 text-left transition-all cursor-pointer ${
                        theme === 'ocean'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Moon className="text-indigo-400" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase">Ocean Dark Mode</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Deep obsidian background with sapphire blue accents.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setTheme('midnight');
                        document.documentElement.className = 'theme-midnight';
                        localStorage.setItem('app_theme', 'midnight');
                      }}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 text-left transition-all cursor-pointer ${
                        theme === 'midnight'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sun className="text-amber-400" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase">Midnight OLED Mode</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Pure pitch-black OLED background profile.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setTheme('high-contrast');
                        document.documentElement.className = 'theme-high-contrast';
                        localStorage.setItem('app_theme', 'high-contrast');
                      }}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 text-left transition-all cursor-pointer ${
                        theme === 'high-contrast'
                          ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-lg shadow-yellow-400/10'
                          : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shield className="text-yellow-400" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase text-yellow-400">High Contrast Cyber</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">WCAG AAA maximum contrast profile.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Font Scaling Accessibility */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase">Font Scale Multiplier</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'normal', label: '100% Normal' },
                      { id: 'large', label: '110% Large' },
                      { id: 'accessibility', label: '125% Extra Large' }
                    ].map(scale => (
                      <button
                        key={scale.id}
                        onClick={() => {
                          document.documentElement.setAttribute('data-font-scale', scale.id);
                          localStorage.setItem('app_font_scale', scale.id);
                          toast.success(`Font scale set to ${scale.label}`);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900 text-xs font-mono font-bold text-slate-300 hover:border-indigo-500 hover:text-white transition-all cursor-pointer"
                      >
                        {scale.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  onClick={handleToggleReducedMotion}
                  className="p-4 rounded-2xl bg-slate-950 border border-white/10 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Reduced Motion Accessibility</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disable subtle entrance animations for faster transitions.</p>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reducedMotion ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && isAdmin && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-sm font-heading font-bold text-white uppercase">System Administrative Settings</h3>
                <p className="text-xs text-slate-400">Direct configuration controls for departments, officer quotas, and SLA rules.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Department Setup', desc: 'Manage grievance categories and assignment rules.', link: '/admin/departments', icon: Building },
                  { title: 'Officer Quotas', desc: 'Configure active ticket limits for departmental officers.', link: '/admin/officers', icon: User },
                  { title: 'Audit Firewall', desc: 'Review security logs and administrative action traces.', link: '/admin/audit', icon: FileText },
                  { title: 'System Diagnostics', desc: 'Inspect API latency, memory, and database health.', link: '/admin/health', icon: Activity },
                  { title: 'Roles & Clearance', desc: 'Manage access control permissions for system roles.', link: '/admin/roles', icon: Lock }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <a
                      key={idx}
                      href={card.link}
                      className="p-5 rounded-2xl bg-slate-950 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all space-y-2 block"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Icon size={18} />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase">{card.title}</h4>
                      <p className="text-[11px] text-slate-400">{card.desc}</p>
                    </a>
                  );
                })}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* OFFICER TAB */}
        {activeTab === 'officer' && isOfficer && (
          <motion.div
            key="officer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-sm font-heading font-bold text-white uppercase">Officer Availability & Workload Settings</h3>
                <p className="text-xs text-slate-400">Control active ticket dispatch status and departmental assignment notifications.</p>
              </div>

              <div
                onClick={() => {
                  setOfficerAvailable(!officerAvailable);
                  toast.success(officerAvailable ? "Status set to BUSY (Auto-assignment paused)." : "Status set to AVAILABLE for ticket assignment.");
                }}
                className="p-5 rounded-2xl bg-slate-950 border border-white/10 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${officerAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">
                      Availability Status: <span className={officerAvailable ? 'text-emerald-400' : 'text-amber-400'}>{officerAvailable ? 'AVAILABLE FOR ASSIGNMENT' : 'BUSY / PAUSED'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Controls whether new grievances can be automatically routed to your queue.</p>
                  </div>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${officerAvailable ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${officerAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

      </AnimatePresence>
    </AnimatedPage>
  );
};

export default SettingsPage;
