import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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

  // Load Google Identity Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '275463446110-4i33qus8mov48q3qoarrek46stjdco97.apps.googleusercontent.com',
          callback: handleGoogleCallback,
          auto_select: false,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-iframe'),
          { 
            theme: theme === 'midnight' ? 'dark' : 'light', 
            size: 'large', 
            width: '380',
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        console.warn('Google Identity script already removed:', e.message);
      }
    };
  }, [theme]);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    try {
      const result = await loginWithGoogle(response.credential, rememberMe);
      toast.success('Google Login successful!');
      if (result.user?.role === 'admin' || result.user?.role === 'super admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setLoading(true);
    try {
      const mockCredential = `sandbox-token-${Date.now()}`;
      const result = await loginWithGoogle(mockCredential, rememberMe);
      toast.success('Mock Sandbox Google Login successful!');
      if (result.user?.role === 'admin' || result.user?.role === 'super admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sandbox Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return toast.error('Email or mobile number is required.');
    }
    if (loginType === 'password' && !password) {
      return toast.error('Password is required.');
    }

    setLoading(true);
    try {
      const result = await login(identifier, password, loginType, rememberMe);
      
      if (result.requiresOtp) {
        toast.success(result.message || 'OTP code sent to email/phone.');
        navigate('/verify-otp', { state: { identifier, purpose: 'login', rememberMe } });
      } else if (result.requiresActivation) {
        toast.success(result.message || 'OTP code sent for activation.');
        navigate('/verify-otp', { state: { identifier, purpose: 'registration', rememberMe } });
      } else {
        toast.success('Login successful!');
        if (result.user?.role === 'admin' || result.user?.role === 'super admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
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
            
            {/* Google Sign-in Option */}
            <div className="space-y-3">
              <div id="google-btn-iframe" className="flex justify-center w-full min-h-[40px]" />
              
              <button
                type="button"
                onClick={handleMockGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 transition-all uppercase tracking-widest cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sandbox Google Bypass
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
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email or Mobile Number</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@institution.edu or +91..."
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
