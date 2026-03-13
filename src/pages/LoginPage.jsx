import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Mail, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
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
        // Successfully signed up and logged in (email confirmation off)
        console.log('Signed up and logged in automatically');
      } else {
        alert('Check your email for confirmation!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0f1d]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 relative z-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6">
              <Ticket className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2 font-['Outfit']">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400">Digital Grievance Redressal System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg text-center">{error}</div>}

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="glass-input w-full pl-12 py-3" required />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.com" className="glass-input w-full pl-12 py-3" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="glass-input w-full pl-12 py-3" required />
              </div>
            </div>

            <button disabled={loading} type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50">
              {loading ? 'Processing...' : (isSignUp ? 'Register' : 'Sign In')}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-slate-500 hover:text-white transition-colors">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
