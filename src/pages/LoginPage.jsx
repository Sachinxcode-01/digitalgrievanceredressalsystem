import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Mail, Lock, ArrowRight, UserPlus, ShieldCheck, MailCheck, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RainbowButton } from '../components/ui/RainbowButton';
import { BackgroundGradientAnimation } from '../components/ui/background-gradient-animation';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleDemoLogin = (role = 'user') => {
    setLoading(true);
    // Simulate a successful login by manually triggering a mock state in a parent or via a custom event
    // For now, we'll suggest using a specific email that App.jsx can intercept or just provide a "Demo" button
    window.dispatchEvent(new CustomEvent('demo-login', { detail: { role } }));
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsNetworkError(false);
    setSuccessMsg('');

    try {
      let authError = null;

      if (isVerifying) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: isSignUp ? 'signup' : 'email'
        });
        
        if (error) authError = error;
        else if (data?.session) {
          setSuccessMsg('Identity verified! Preparing your dashboard...');
        }
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
            }
          }
        });
        if (error) authError = error;
        else if (data?.session) {
          setSuccessMsg('Account created successfully! Auto-logging in...');
        } else {
          setIsVerifying(true);
          setSuccessMsg('Check your email for a verification code!');
        }
      } else if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) authError = error;
        else {
          setSuccessMsg('Check your email for the magic code!');
          setIsVerifying(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) authError = error;
        else setSuccessMsg('Access granted. Welcome back.');
      }

      if (authError) throw authError;

    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('fetch')) {
        setIsNetworkError(true);
        setError('OFFLINE: SUPABASE LINK SEVERED');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 } 
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <BackgroundGradientAnimation 
      interactive={true}
      gradientBackgroundStart="rgb(0, 8, 20)" 
      gradientBackgroundEnd="rgb(0, 4, 12)"
      firstColor="67, 97, 238"    /* Indigo-Blue */
      secondColor="114, 9, 183"   /* Rich Purple/Secondary */
      thirdColor="0, 0, 0"
    >
      <div className="min-h-screen flex items-center justify-center p-6 relative z-50">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isVerifying ? (
              <motion.div 
                key="auth-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-card p-10 relative overflow-hidden glass-glow"
              >
                <div className="flex flex-col items-center mb-8 text-center">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-20 h-20 mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-white p-2 flex items-center justify-center transition-all duration-500"
                  >
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                  </motion.div>
                  <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-1">
                    {isSignUp ? 'TERMINAL ACCESS' : 'OPERATOR LOGIN'}
                  </h1>
                  <p className="text-slate-500 font-bold text-[9px] tracking-[0.4em] uppercase">ResolveNow Protocol</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className={`p-4 ${isNetworkError ? 'bg-error/20 border-error/40' : 'bg-error/10 border-error/20'} border text-error text-[10px] font-black uppercase tracking-widest rounded-2xl text-center shadow-lg shadow-error/10`}>
                          {error}
                        </div>
                        {isNetworkError && (
                          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-1 space-y-2">
                            <p className="text-[9px] font-black text-slate-500 text-center uppercase tracking-widest">System Override Required</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleDemoLogin('user')} className="flex-1 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20">Demo User</button>
                              <button type="button" onClick={() => handleDemoLogin('admin')} className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Demo Admin</button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                    {successMsg && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest rounded-2xl text-center">{successMsg}</motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    {isSignUp && (
                      <motion.div variants={itemVariants} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter name" className="glass-input w-full pl-11 py-3.5" required />
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Connection</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@org.com" className="glass-input w-full pl-11 py-3.5" required />
                      </div>
                    </motion.div>

                    {!isMagicLink && (
                      <motion.div variants={itemVariants} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="glass-input w-full pl-11 py-3.5" required={!isMagicLink} />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setIsMagicLink(!isMagicLink)} className="text-[10px] text-primary font-black uppercase tracking-widest hover:text-white transition-colors">
                        {isMagicLink ? 'Key Access' : 'Email OTP Access'}
                      </button>
                    </div>
                  )}

                  <RainbowButton disabled={loading} type="submit" className="w-full mt-4 !py-4 rounded-2xl">
                    <span className="font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                      {loading ? 'SYNCING' : (isSignUp ? 'INITIALIZE' : 'AUTHORIZE')}
                      {!loading && <ArrowRight size={16} />}
                    </span>
                  </RainbowButton>
                </form>

                <motion.div variants={itemVariants} className="mt-8 text-center pt-6 border-t border-white/[0.05]">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); setIsNetworkError(false); }} className="text-[10px] text-slate-500 font-bold transition-all hover:text-white flex items-center justify-center gap-2 w-full uppercase tracking-widest">
                    {isSignUp ? "Registered? Sign In" : "New? Register"}
                  </button>

                  <div className="space-y-3 mt-6">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Infrastructure Bypass</p>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => handleDemoLogin('user')}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 hover:border-primary/30 transition-all uppercase tracking-widest"
                      >
                        Guest User
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDemoLogin('admin')}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition-all uppercase tracking-widest"
                      >
                        Admin Dash
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="otp-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="glass-card p-10 relative glass-glow"
              >
                <button onClick={() => { setIsVerifying(false); setOtp(''); setError(''); }} className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <ChevronLeft size={16} /> Secure Back
                </button>

                <div className="flex flex-col items-center mt-10 mb-10 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-gradient-to-tr from-success to-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-success/20 mb-8 border border-white/10">
                    <MailCheck className="text-white" size={32} />
                  </motion.div>
                  <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Identity Probe</h1>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">6-Digit Cipher sent to {email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-success transition-colors" size={20} />
                    <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="glass-input w-full pl-12 py-5 text-center text-3xl tracking-[0.6em] font-black text-white focus:border-success/50" required />
                  </div>

                  <RainbowButton disabled={loading || otp.length < 6} type="submit" className="w-full !py-4 rounded-2xl">
                    <span className="font-black text-sm uppercase tracking-[0.2em]">{loading ? 'Verifying...' : 'Finalize Auth'}</span>
                  </RainbowButton>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};
