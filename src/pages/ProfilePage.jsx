import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setEmail(user.email);
        setFullName(user.user_metadata?.full_name || '');
      }
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setIsSaving(false);
  };

  const initials = (fullName || email || '?')[0].toUpperCase();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 font-['Outfit']">Profile Settings</h2>
        <p className="text-slate-400">Manage your personal information.</p>
      </div>

      <div className="glass-card p-8">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-primary/20">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{fullName || 'Anonymous User'}</h3>
            <p className="text-slate-400 text-sm mt-1">{email}</p>
            <span className="mt-2 inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              {user?.user_metadata?.role || 'user'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="glass-input w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="glass-input w-full opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">Email cannot be changed here. Contact your administrator.</p>
          </div>

          <motion.button
            type="submit"
            disabled={isSaving}
            whileTap={{ scale: 0.97 }}
            className={`btn-primary flex items-center gap-2 ${saved ? 'bg-success hover:bg-success/80' : ''}`}
          >
            {saved ? (
              <><CheckCircle size={18} /> Saved!</>
            ) : (
              <><Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}</>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};
