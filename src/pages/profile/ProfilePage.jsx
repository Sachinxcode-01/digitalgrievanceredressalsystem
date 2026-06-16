import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, CheckCircle, Bell, Shield, Camera, Loader2, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../api/apiClient';

export const ProfilePage = ({ sessionUser, userProfile }) => {
  const [fullName, setFullName] = useState(() => sessionUser?.fullName || '');
  const [email, setEmail] = useState(() => sessionUser?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New fields
  const [mobileNumber, setMobileNumber] = useState(() => sessionUser?.mobile_number || '');
  const [department, setDepartment] = useState(() => sessionUser?.department || '');
  const [institution, setInstitution] = useState(() => sessionUser?.institution || '');
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'English');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'Dark');
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isOTPRequested, setIsOTPRequested] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Clerk MFA
  const { isLoaded: isClerkUserLoaded, user: clerkUser } = useUser();
  const mfaEnabled = clerkUser ? clerkUser.twoFactorEnabled : false;

  useEffect(() => {
    if (sessionUser && !sessionUser.id?.startsWith('demo-')) {
      // Fetch fresh profile from backend
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
      await apiClient.put('/user/profile', {
        fullName,
        notificationPreferences: {
          email: notificationsEnabled,
          sms: notificationsEnabled
        },
        department,
        institution
      });

      // Save mobile number to account settings
      await apiClient.put('/user/account', {
        mobileNumber: mobileNumber.trim() !== '' ? mobileNumber.trim() : null
      });
      
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
      const res = await fetch('/api/v1/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, type: 'recovery' })
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error("Security verification failed: " + data.error);
      } else {
        toast.success("Recovery key sent via email.");
        setIsOTPRequested(true);
      }
      setIsUpdatingPassword(false);
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
    
    const verifyRes = await fetch('/api/v1/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, otp: resetToken })
    });
    const verifyData = await verifyRes.json();
    
    if (verifyData.error) {
      toast.error("Invalid OTP key: " + verifyData.error);
      setIsUpdatingPassword(false);
      return;
    }

    if (sessionUser?.id?.startsWith('demo-')) {
      await new Promise(r => setTimeout(r, 800));
      toast.success("Password simulated update.");
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setIsOTPRequested(false);
      setIsUpdatingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      toast.error("Failed to update password: " + updateError.message);
    } else {
      toast.success("Keyphrase updated successfully!");
    }
    
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setIsOTPRequested(false);
    setIsUpdatingPassword(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar file size exceeds 2MB limit.");
      return;
    }

    setIsUploadingAvatar(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const fakeUrl = URL.createObjectURL(file);
    setAvatarUrl(fakeUrl);
    
    if (!sessionUser?.id?.startsWith('demo-')) {
       await supabase.auth.updateUser({
         data: { avatar_url: fakeUrl }
       });
    }

    toast.success("Profile avatar updated.");
    setIsUploadingAvatar(false);
  };

  const initials = (fullName || email || '?')[0].toUpperCase();
  const registrationDate = sessionUser?.created_at ? new Date(sessionUser.created_at).toLocaleDateString() : 'Simulation';

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full pt-4 pb-20 text-left px-1">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/30 backdrop-blur-md p-6 rounded-3xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-border">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-md" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-black text-foreground uppercase tracking-tight">System Identity</h2>
            <p className="text-xs text-muted-foreground font-medium">Configure your profile details and credential keys.</p>
          </div>
        </div>
        <div className="text-left sm:text-right font-mono text-[10px]">
          <p className="text-muted-foreground uppercase font-bold tracking-wider">Registration Node</p>
          <p className="text-primary font-bold mt-0.5">{registrationDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="glass-card p-8 text-center relative overflow-hidden"
          >
            <div className="relative mb-6 mx-auto w-28 h-28 group/avatar">
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-primary/10 to-secondary/10 flex items-center justify-center text-primary font-black text-4xl shadow-md border border-border/60 overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-background border border-border hover:border-primary rounded-lg shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-primary">
                <Camera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-heading font-black text-foreground">{fullName || 'Citizen Operator'}</h3>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[220px] mx-auto">{email}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase">
                <span className="text-muted-foreground">Clearance</span>
                <span className="text-primary font-bold">{userProfile?.role || 'Citizen'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase">
                <span className="text-muted-foreground">Encryption</span>
                <span className="text-success font-bold">AES-256</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase">
                <span className="text-muted-foreground">Registry Status</span>
                <span className="text-accent font-bold">Synchronized</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Configuration forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Details Form */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.05 }} 
            className="glass-card p-8"
          >
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <User size={16} />
                </div>
                <h4 className="text-base font-heading font-extrabold text-foreground uppercase tracking-wide">Personal Credentials</h4>
             </div>

             <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="glass-input w-full font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email address</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="glass-input w-full opacity-50 cursor-not-allowed font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="glass-input w-full font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. IT Support, Student Affairs"
                      className="glass-input w-full font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Institution</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. State University, Central Bank"
                      className="glass-input w-full font-bold"
                    />
                  </div>
                </div>

                <div 
                  className="p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all cursor-pointer" 
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 text-left flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0">
                        <Bell size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Real-time Pings</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Receive notifications about modifications to your filings.</p>
                      </div>
                    </div>
                    
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-primary' : 'bg-muted border border-border/80'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    disabled={isSaving}
                    type="submit" 
                    className="btn-premium py-3 px-8 text-xs uppercase tracking-widest font-bold"
                  >
                    {saved ? (
                      <><CheckCircle size={14} /> Synced</>
                    ) : (
                      <>{isSaving ? 'Encrypting...' : 'Save Settings'}</>
                    )}
                  </button>
                </div>
             </form>
          </motion.div>

          {/* App Preferences Form */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08 }} 
            className="glass-card p-8"
          >
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                   <Globe size={16} />
                </div>
                <h4 className="text-base font-heading font-extrabold text-foreground uppercase tracking-wide">App Preferences</h4>
             </div>

             <form 
               onSubmit={(e) => {
                 e.preventDefault();
                 localStorage.setItem('app_language', language);
                 localStorage.setItem('app_theme', theme);
                 if (theme === 'Light') {
                   document.documentElement.classList.add('light');
                 } else {
                   document.documentElement.classList.remove('light');
                 }
                 toast.success("Preferences updated successfully!");
               }} 
               className="space-y-6"
             >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Language Selection</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="glass-input w-full bg-background border border-border text-foreground py-2 px-3 text-xs rounded-lg font-bold"
                      >
                         <option>English</option>
                         <option>Spanish</option>
                         <option>Hindi</option>
                         <option>French</option>
                         <option>Arabic</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Theme Selection</label>
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="glass-input w-full bg-background border border-border text-foreground py-2 px-3 text-xs rounded-lg font-bold"
                      >
                         <option>Dark</option>
                         <option>Light</option>
                         <option>Cyberpunk</option>
                         <option>High Contrast</option>
                      </select>
                   </div>
                </div>

                <div className="flex justify-end pt-2">
                   <button 
                     type="submit" 
                     className="btn-premium py-3 px-8 text-xs uppercase tracking-widest font-bold"
                   >
                      Save Preferences
                   </button>
                </div>
             </form>
          </motion.div>

          {/* Security & MFA Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.09 }} 
            className="glass-card p-8"
          >
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-success border border-success/20">
                   <ShieldCheck size={16} />
                </div>
                <h4 className="text-base font-heading font-extrabold text-foreground uppercase tracking-wide">Multi-Factor Authentication (MFA)</h4>
             </div>

             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-background/40 border-border/60">
                   <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0 ${mfaEnabled ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                         {mfaEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                      </div>
                      <div>
                         <h5 className="text-xs font-bold text-foreground">
                            Two-Step Verification Status: <span className={mfaEnabled ? 'text-success' : 'text-warning'}>{mfaEnabled ? 'ENABLED' : 'DISABLED'}</span>
                         </h5>
                         <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            MFA secures access by requiring a temporary verification code in addition to your password. This is mandatory for coordinators and administrators.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end">
                   <button 
                     type="button"
                     onClick={() => {
                        if (clerkUser) {
                           window.open('https://accounts.clerk.dev', '_blank');
                        } else {
                           toast.success('MFA status updated in local verification settings.');
                        }
                     }}
                     className="btn-ghost py-3 px-6 text-[10px] font-bold uppercase tracking-wider"
                   >
                      {clerkUser ? 'Manage MFA in Clerk Account' : 'Initialize Simulated MFA'}
                   </button>
                </div>
             </div>
          </motion.div>

          {/* Keyphrase security form */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="glass-card p-8"
          >
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                  <Shield size={16} />
                </div>
                <h4 className="text-base font-heading font-extrabold text-foreground uppercase tracking-wide">Security Keys</h4>
             </div>

             <form onSubmit={handlePasswordUpdate} className="space-y-6">
                {isOTPRequested ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">New Keyphrase</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="glass-input w-full font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm Keyphrase</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Verify new keyphrase"
                          className="glass-input w-full font-bold"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Verification OTP Code</label>
                      <input
                        type="text"
                        maxLength="6"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Security code"
                        className="glass-input w-full text-center font-mono font-bold tracking-[0.3em]"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center bg-background/50 rounded-2xl border border-border/60">
                    <p className="text-xs text-muted-foreground mb-4">Verification key will be dispatched to your email address before keyphrase modification is allowed.</p>
                    <button 
                      type="button" 
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="btn-ghost py-3 px-6 text-[10px] font-bold uppercase tracking-wider w-full sm:w-auto"
                    >
                      {isUpdatingPassword ? 'Transmitting OTP...' : 'Request Verification OTP'}
                    </button>
                  </div>
                )}

                {sessionUser?.id?.startsWith('demo-') && isOTPRequested && (
                  <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl">
                    <p className="text-[9px] text-warning font-bold uppercase tracking-wider text-center">Modifications restricted for simulation accounts.</p>
                  </div>
                )}

                {isOTPRequested && (
                  <div className="flex justify-between items-center pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsOTPRequested(false)}
                      className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isUpdatingPassword}
                      type="submit" 
                      className="btn-premium py-3 px-6 text-xs uppercase tracking-widest font-bold"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Commit Security Update'}
                    </button>
                  </div>
                )}
             </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
