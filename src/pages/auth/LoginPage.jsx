import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Home, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname || null;
  const getRedirectPath = (user) => {
    if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
      return fromPath;
    }
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'super admin') {
      return '/admin/dashboard';
    }
    if (role === 'officer' || role === 'faculty' || role === 'staff') {
      return '/officer/dashboard';
    }
    return '/dashboard';
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('password');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Google Sign-in failed. Please try again.'));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return toast.error('Email address is required.');
    }
    if (loginType === 'password' && !password) {
      return toast.error('Password is required.');
    }

    setLoading(true);
    try {
      const result = await login(identifier, password, loginType, rememberMe);
      if (result?.requiresOtp) {
        toast.success(result.message || 'Verification key dispatched to your email.');
        navigate('/verify-otp', { state: { email: identifier, purpose: 'login' } });
        return;
      }
      if (result?.requiresActivation) {
        toast.success('Account activation required. OTP dispatched.');
        navigate('/verify-otp', { state: { email: identifier, purpose: 'registration' } });
        return;
      }
      toast.success('Login successful!');
      navigate(getRedirectPath(result.user));
    } catch (err) {
      console.error('Login process exception:', err);
      toast.error(getErrorMessage(err, 'Invalid email or password. Please verify credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header Branding */}
          <div className="text-center mb-6 relative">
            <Link
              to="/"
              className="absolute left-0 top-0 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 transition-colors"
            >
              <Home size={16} />
            </Link>

            <Link to="/" className="inline-flex items-center gap-2 group mb-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-heading font-black text-white tracking-tight uppercase">
                ResolveNow
              </span>
            </Link>
            <h2 className="text-2xl font-heading font-black text-white">Sign in to your account</h2>
            <p className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-widest mt-1">
              Institutional Redressal & Support Gateway
            </p>
          </div>

          {/* Login Motion Card */}
          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 hover:bg-slate-950 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.72-4.92 3.72-8.55z"/>
                  <path fill="#FBBC05" d="M5.24 10.55c-.23-.69-.36-1.43-.36-2.2 0-.77.13-1.51.36-2.2L1.39 3.16C.5 4.93 0 6.91 0 9c0 2.09.5 4.07 1.39 5.84l3.85-2.99c-.23-.69-.36-1.43-.36-2.2z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.03.69-2.34 1.1-4.27 1.1-3.34 0-5.86-1.81-6.76-4.51L1.39 16.7C3.37 20.33 7.35 23 12 23z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-white/10 grow" />
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">or credentials</span>
                <div className="h-px bg-white/10 grow" />
              </div>

              {/* Password vs OTP switch */}
              <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setLoginType('password')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    loginType === 'password' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('otp')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    loginType === 'otp' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  One-Time Key
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="student@institution.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {loginType === 'password' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        required={loginType === 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-400 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Keep me logged in (30 days)</span>
                  </label>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="glow"
                  size="md"
                  isLoading={loading}
                  rightIcon={ArrowRight}
                  className="w-full mt-3"
                >
                  {loginType === 'password' ? 'Sign In' : 'Request Security Key'}
                </AnimatedButton>
              </form>

              <div className="text-center text-xs text-slate-400 pt-2">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold">
                  Sign Up
                </Link>
              </div>
            </div>
          </MotionCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default LoginPage;
