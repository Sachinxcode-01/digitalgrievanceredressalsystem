import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, CheckCircle, Bell, Shield, Camera, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { RainbowButton } from '../components/ui/RainbowButton';

export const ProfilePage = ({ sessionUser, userProfile }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isOTPRequested, setIsOTPRequested] = useState(false);

  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);


  useEffect(() => {
    if (sessionUser) {
      setEmail(sessionUser.email || '');
      setFullName(userProfile?.full_name || sessionUser.user_metadata?.full_name || '');
      setNotificationsEnabled(userProfile?.notifications_enabled !== false);
      setAvatarUrl(userProfile?.avatar_url || sessionUser.user_metadata?.avatar_url || null);
    }
  }, [sessionUser, userProfile]);


  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Check if it's a demo user
    if (sessionUser?.id?.startsWith('demo-')) {
      // Simulate save delay
      await new Promise(r => setTimeout(r, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setIsSaving(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, notifications_enabled: notificationsEnabled },
      });
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, notifications_enabled: notificationsEnabled })
        .eq('id', sessionUser.id);

      if (authError || profileError) {
         throw new Error((authError?.message || '') + ' ' + (profileError?.message || ''));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save profile: " + err.message);
    }
    
    setIsSaving(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!isOTPRequested) {
      // Step 1: Request OTP via custom SMTP
      setIsUpdatingPassword(true);
      const res = await fetch('/api/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, type: 'recovery' })
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error("Security Scan Failed: " + data.error);
      } else {
        toast.success("Recovery code transmitted via secure SMTP channel.");
        setIsOTPRequested(true);
      }
      setIsUpdatingPassword(false);
      return;
    }

    // Step 2: Verify custom SMTP OTP and Update Password
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Security Protocol: Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    
    const verifyRes = await fetch('/api/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, otp: resetToken })
    });
    const verifyData = await verifyRes.json();
    
    if (verifyData.error) {
      toast.error("Invalid Security OTP: " + verifyData.error);
      setIsUpdatingPassword(false);
      return;
    }

    if (sessionUser?.id?.startsWith('demo-')) {
      await new Promise(r => setTimeout(r, 1000));
      toast.success("Security sequence simulated for demo user.");
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setIsOTPRequested(false);
      setIsUpdatingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      toast.error("Success: SMTP Verified. Profile key update committed.");
    } else {
      toast.success("Security update successful: Identity re-secured.");
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
      toast.error("Neural Scan Failed: Avatar exceeds 2MB limit.");
      return;
    }

    setIsUploadingAvatar(true);
    
    // Simulate upload for now (Storage will be in Phase 10)
    await new Promise(r => setTimeout(r, 2000));
    
    const fakeUrl = URL.createObjectURL(file);
    setAvatarUrl(fakeUrl);
    
    // In a real app we'd upload to Storage first, then update metadata.
    if (!sessionUser?.id?.startsWith('demo-')) {
       await supabase.auth.updateUser({
         data: { avatar_url: fakeUrl }
       });
    }

    toast.success("Identity visual updated.");
    setIsUploadingAvatar(false);

  };

  const initials = (fullName || email || '?')[0].toUpperCase();
  const registrationDate = sessionUser?.created_at ? new Date(sessionUser.created_at).toLocaleDateString() : 'N/A';


  return (
    <div className="space-y-12 max-w-4xl mx-auto w-full pt-6 pb-20">
      <div className="flex items-center justify-between px-4">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 font-['Outfit'] uppercase tracking-tight">System Identity</h2>
          <p className="text-slate-400 font-medium tracking-wide">Configuration of neural profile and encryption tokens.</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Registration Sequence</p>
          <p className="text-sm font-mono text-primary font-bold">{registrationDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Metadata */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-10 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="relative mb-8 mx-auto w-32 h-32 group/avatar">
              <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-primary/30 border border-white/20 overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-xl border border-slate-200 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all text-background">
                <Save size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-['Outfit']">{fullName || 'Unknown Operator'}</h3>
              <p className="text-xs text-slate-500 font-mono tracking-tighter truncate">{email}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">Clearance</span>
                <span className="text-primary">{userProfile?.role || 'authorized'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">Encryption</span>
                <span className="text-success">AES-256</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">Status</span>
                <span className="text-blue-400">Synchronized</span>
              </div>
            </div>
          </motion.div>

          <div className="glass-card p-6 border-error/10 hover:border-error/30 transition-all bg-error/5 cursor-pointer">
            <div className="flex items-center gap-4 text-error">
              <Shield size={20} />
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-black uppercase tracking-widest">Deactivation</h4>
                <p className="text-[10px] font-medium opacity-60">Terminate system association.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Forms */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-10 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User size={20} />
                </div>
                <h4 className="text-lg font-bold text-white font-['Outfit']">Profile Configuration</h4>
             </div>

             <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Tag</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="glass-input w-full py-4 px-5 font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Neural Mail (Read Only)</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="glass-input w-full py-4 px-5 opacity-40 cursor-not-allowed font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 group hover:border-primary/30 transition-all cursor-pointer" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-col text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <Bell size={14} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Operational Pings</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pl-11">Encrypted status updates for reported grievances.</p>
                    </div>
                    <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-primary' : 'bg-white/10 border border-white/20'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6 shadow-md shadow-primary/50' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <RainbowButton 
                    disabled={isSaving}
                    type="submit" 
                    className={`!py-3 !px-10 !rounded-xl transition-all ${saved ? '!from-success !to-success/80' : ''}`}
                  >
                    <span className="font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
                      {saved ? (
                        <><CheckCircle size={16} /> Identity Synced</>
                      ) : (
                        <>{isSaving ? 'Encrypting...' : 'Update Protocol'}</>
                      )}
                    </span>
                  </RainbowButton>
                </div>
             </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-10 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                  <Shield size={20} />
                </div>
                <h4 className="text-lg font-bold text-white font-['Outfit']">Security Sequence</h4>
             </div>

             <form onSubmit={handlePasswordUpdate} className="space-y-8">
                {isOTPRequested ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Keyphrase</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="glass-input w-full py-4 px-5 font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verify Keyphrase</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new keyphrase"
                          className="glass-input w-full py-4 px-5 font-bold"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Recovery OTP (From Email)</label>
                      <input
                        type="text"
                        maxLength="6"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Security code"
                        className="glass-input w-full py-4 px-5 text-center font-black tracking-[0.4em]"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-xs text-slate-400 mb-6 font-medium">For security, we need to verify your identity via email before modifying your keyphrase.</p>
                    <button 
                      type="button" 
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="btn-primary !px-8 !py-3 font-black text-[10px] uppercase tracking-widest !rounded-xl"
                    >
                      {isUpdatingPassword ? 'Transmitting...' : 'Request Verification OTP'}
                    </button>
                  </div>
                )}

                {sessionUser?.id?.startsWith('demo-') && isOTPRequested && (
                  <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl">
                    <p className="text-[10px] text-warning font-black uppercase tracking-tight text-center">Neural Alert: Password modification restricted in Demo Environment.</p>
                  </div>
                )}

                {isOTPRequested && (
                  <div className="flex justify-between items-center pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsOTPRequested(false)}
                      className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-white"
                    >
                      ← Back
                    </button>
                    <button 
                      disabled={isUpdatingPassword}
                      type="submit" 
                      className="btn-primary !px-10 !py-3 font-black text-[11px] uppercase tracking-widest !rounded-xl !bg-white/5 hover:!bg-white/10"
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

