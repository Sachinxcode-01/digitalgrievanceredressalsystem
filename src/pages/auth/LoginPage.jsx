import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

export const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname || null;
  const getRedirectPath = (user) => {
    if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
      return fromPath;
    }
    if (user?.role === 'admin' || user?.role === 'super admin') {
      return '/admin/dashboard';
    }
    return '/dashboard';
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('password'); // 'password' or 'otp'
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign-in exception:', err);
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
      
      if (result.requiresOtp) {
        toast.success(result.message || 'OTP code sent to email/phone.');
        navigate('/verify-otp', { state: { identifier, purpose: 'login', rememberMe, from: fromPath } });
      } else if (result.requiresActivation) {
        toast.success(result.message || 'OTP code sent for activation.');
        navigate('/verify-otp', { state: { identifier, purpose: 'registration', rememberMe, from: fromPath } });
      } else {
        toast.success('Login successful!');
        navigate(getRedirectPath(result.user));
      }
    } catch (err) {
      console.error('Login process exception:', err);
      toast.error(getErrorMessage(err, 'Login failed. Please verify credentials and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-screen w-full overflow-y-auto relative ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 w-full min-h-full flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md z-10"
          >
          {/* Logo/Branding */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 left-0">
              <Link 
                to="/"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/10 transition-colors flex items-center justify-center"
                aria-label="Back to Home"
              >
                <Home size={16} />
              </Link>
            </div>

            <div className="absolute top-0 right-0">
              <button 
                onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/10 transition-colors"
                type="button"
                aria-label="Toggle Theme"
              >
                {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 tracking-tight">
                ResolveNow
              </span>
            </Link>
            <h2 className="text-2xl font-heading font-black text-foreground">Sign in to your account</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Institutional Redressal & Support Gateway</p>
          </div>

          {/* Clerk style Card */}
          <div className="glass-card p-8 border-border/50 text-left space-y-6">
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900 text-sm font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.72-4.92 3.72-8.55z"/>
                  <path fill="#FBBC05" d="M5.24 10.55c-.23-.69-.36-1.43-.36-2.2 0-.77.13-1.51.36-2.2L1.39 3.16C.5 4.93 0 6.91 0 9c0 2.09.5 4.07 1.39 5.84l3.85-2.99c-.23-.69-.36-1.43-.36-2.2z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.03.69-2.34 1.1-4.27 1.1-3.34 0-5.86-1.81-6.76-4.51L1.39 16.7C3.37 20.33 7.35 23 12 23z"/>
                </svg>
                {loading ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-[1px] bg-white/10 flex-grow" />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">or continue with credentials</span>
              <div className="h-[1px] bg-white/10 flex-grow" />
            </div>

            {/* Auth Toggles */}
            <div className="flex bg-background/50 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setLoginType('password')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${loginType === 'password' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginType('otp')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${loginType === 'otp' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                One-Time Key
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@institution.edu"
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>
              </div>

              {loginType === 'password' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Password</label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:text-secondary transition-colors font-semibold">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10 pr-10"
                      required={loginType === 'password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me Option */}
              <div className="flex items-center justify-between ml-1 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-slate-400 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-slate-950 text-primary focus:ring-primary focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <span>Keep me logged in (30 days)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full mt-2 text-xs uppercase tracking-widest font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {loginType === 'password' ? 'Sign In' : 'Request Security Key'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-secondary font-bold transition-colors">
                Sign Up
              </Link>
            </div>

            {/* Sandbox simulation bypass options */}
            <div className="border-t border-border/50 pt-5 space-y-3">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                Developer Sandbox Bypass Credentials
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('student@resolve.now');
                    setPassword('Demo@12345');
                    setLoginType('password');
                  }}
                  className="py-2.5 rounded-xl bg-background/50 hover:bg-background border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-wider cursor-pointer"
                >
                  Student Creds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin@resolve.now');
                    setPassword('Demo@12345');
                    setLoginType('password');
                  }}
                  className="py-2.5 rounded-xl bg-background/50 hover:bg-background border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-wider cursor-pointer"
                >
                  Admin Creds
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
