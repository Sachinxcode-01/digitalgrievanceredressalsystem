import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Mail, Lock, ArrowRight, UserPlus, ShieldCheck, MailCheck, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (isVerifying) {
      // Handle OTP Verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        // Success! User is authenticated.
        setSuccessMsg('Verification successful! Logging you in...');
      }
    } else if (isSignUp) {
      // Handle Registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: email.includes('admin') ? 'admin' : 'user'
          }
        }
      });
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        // Automatically logged in if email confirmation is turned off in Supabase
        setSuccessMsg('Account created successfully! Logging in...');
      } else {
        // Email confirmation is required
        setIsVerifying(true);
        setSuccessMsg('Verification email sent! Please check your inbox.');
      }
    } else {
      // Handle Sign In
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else setSuccessMsg('Welcome back!');
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-transparent">
      {/* Dynamic Animated Background Elements */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], x: [0, 50, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]"
      />

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          {!isVerifying ? (
            <motion.div 
              key="auth-form"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card p-8 sm:p-10 relative"
            >
              <div className="flex flex-col items-center mb-10 text-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6"
                >
                  <Ticket className="text-white" size={32} />
                </motion.div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 mb-2 font-['Outfit']">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-slate-400 text-sm">Digital Grievance Redressal System</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg text-center">{error}</div>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className="p-3 bg-success/10 border border-success/20 text-success text-xs rounded-lg text-center">{successMsg}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isSignUp && (
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                    <div className="relative group">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors duration-300" size={18} />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="glass-input w-full pl-12 py-3.5" required />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors duration-300" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.com" className="glass-input w-full pl-12 py-3.5" required />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors duration-300" size={18} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="glass-input w-full pl-12 py-3.5" required />
                  </div>
                </motion.div>

                <motion.button 
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading} 
                  type="submit" 
                  className="btn-primary w-full py-4 mt-2 flex items-center justify-center gap-2 text-md font-bold disabled:opacity-50 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Processing...' : (isSignUp ? 'Register Account' : 'Sign In')}
                    {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                </motion.button>
              </form>

              <motion.div variants={itemVariants} className="mt-8 text-center pt-6 border-t border-white/5">
                <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm text-slate-500 hover:text-white transition-colors duration-300">
                  {isSignUp ? (
                    <span className="flex items-center justify-center gap-2">Already have an account? <span className="text-primary font-bold">Sign In</span></span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Don't have an account? <span className="text-secondary font-bold">Register Now</span></span>
                  )}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="otp-form"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-card p-8 sm:p-10 relative"
            >
              <button 
                onClick={() => { setIsVerifying(false); setOtp(''); setError(''); }}
                className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div className="flex flex-col items-center mt-6 mb-8 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-tr from-success/80 to-primary rounded-full flex items-center justify-center shadow-xl shadow-success/20 mb-6"
                >
                  <MailCheck className="text-white" size={40} />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">Verify Your Email</h1>
                <p className="text-slate-400 text-sm px-4">
                  We've sent a 6-digit confirmation code to <span className="text-white font-medium">{email}</span>. Please enter it below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-lg text-center mb-4">{error}</div>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className="p-3 bg-success/10 border border-success/20 text-success text-sm rounded-lg text-center mb-4">{successMsg}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-success transition-colors duration-300" size={20} />
                    <input 
                      type="text" 
                      maxLength="6"
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      placeholder="000000" 
                      className="glass-input w-full pl-12 py-4 text-center text-2xl tracking-[0.5em] font-mono font-bold text-white focus:border-success/50 focus:ring-success/20" 
                      required 
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || otp.length < 6} 
                  type="submit" 
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-success to-primary hover:shadow-lg hover:shadow-success/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
