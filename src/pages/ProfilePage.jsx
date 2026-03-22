import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, CheckCircle, Bell, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RainbowButton } from '../components/ui/RainbowButton';

export const ProfilePage = ({ sessionUser, userProfile }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      setEmail(sessionUser.email || '');
      setFullName(userProfile?.full_name || sessionUser.user_metadata?.full_name || '');
      setNotificationsEnabled(userProfile?.notifications_enabled !== false);
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

  const initials = (fullName || email || '?')[0].toUpperCase();

  return (
    <div className="space-y-8 max-w-2xl mx-auto w-full pt-6">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-black text-white mb-2 font-['Outfit'] uppercase tracking-tight">Operator Profile</h2>
        <p className="text-slate-400 font-medium tracking-wide">Manage your central identity and system notifications.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 md:p-12 relative overflow-hidden glass-glow">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

        {/* Avatar Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-white/[0.05] relative z-10">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-primary/30 border border-white/20">
            {initials}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black text-white font-['Outfit'] tracking-tight mb-2">{fullName || 'Unknown Operator'}</h3>
            <p className="text-primary/80 font-mono tracking-widest text-sm mb-4">{email}</p>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <Shield size={12} className={userProfile?.role === 'admin' ? 'text-secondary' : 'text-primary'} />
              {userProfile?.role || 'user'} Clearance
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Operator name"
                className="glass-input w-full py-4 px-5 font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email (Read Only)</label>
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
              <div className="space-y-2 flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Bell size={14} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">System Alerts</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium pl-11">Receive high-priority pings on status permutations.</p>
              </div>
              <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${notificationsEnabled ? 'bg-primary' : 'bg-white/10 border border-white/20'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6 shadow-md shadow-primary/50' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
             <RainbowButton 
                disabled={isSaving}
                type="submit" 
                className={`!py-4 px-8 rounded-2xl transition-all ${saved ? '!from-success !to-success/80' : ''}`}
             >
                <span className="font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                  {saved ? (
                    <><CheckCircle size={16} /> Data Synced</>
                  ) : (
                    <><Save size={16} /> {isSaving ? 'Encrypting...' : 'Commit Changes'}</>
                  )}
                </span>
             </RainbowButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
