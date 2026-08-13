import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Home, Eye, EyeOff,
  AlertCircle, Loader2, Landmark, Chrome
} from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import toast from 'react-hot-toast';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const AdminLoginPage = () => {
  const { login, simpleLogin, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Real credential login — goes through local JWT (sandbox) or Clerk
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await login(email.trim(), password, 'password');

      // Role validation after login
      const role = result?.user?.role?.toLowerCase();
      if (role && role !== 'admin' && role !== 'super admin' && role !== 'officer') {
        await simpleLogin('student'); // reset state
        setError('Access denied. This portal is restricted to administrative accounts only.');
        setLoading(false);
        return;
      }

      toast.success('Administrative clearance granted.');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth (Clerk)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Redirect handled by SSO callback
    } catch (err) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Quick demo login (sandbox fallback for local/offline testing)
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await simpleLogin('admin');
      toast.success('Demo admin session started.');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Demo login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
            >
              <Home size={14} />
              <span>Home</span>
            </Link>
            <Link
              to="/login"
              className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Citizen Portal →
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 mb-4">
              <Landmark size={13} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]">
                Administrative Command Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Authorized officers and administrators only
            </p>
          </div>

          {/* Card */}
          <div className="relative rounded-[2rem] p-1.5 bg-white/5 border border-white/10">
            <div className="rounded-[calc(2rem-0.375rem)] bg-slate-950/90 backdrop-blur-xl p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              {/* Top highlight */}
              <div className="absolute top-1.5 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5"
                  >
                    <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-300 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="admin@institution.edu"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Submit */}
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  rightIcon={loading ? undefined : ArrowRight}
                  className="w-full mt-2"
                  disabled={loading || !email || !password}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
                </AnimatedButton>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-white/8" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">or</span>
                <div className="flex-1 h-[1px] bg-white/8" />
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-white text-xs font-semibold hover:bg-slate-800/80 hover:border-white/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {googleLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Demo Login */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Quick Demo Access
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    No credentials required — demo admin session
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={demoLoading || loading}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  {demoLoading ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
                  Demo
                </button>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <p className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest">
                  ISO-27001 · Zero Trust · Encrypted Session
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default AdminLoginPage;
