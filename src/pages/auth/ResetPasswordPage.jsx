import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Check, ShieldAlert, CheckCircle, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const resetCode = location.state?.resetCode || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!email || !resetCode) {
      toast.error('Session invalid. Please restart the password reset process.');
      navigate('/forgot-password');
    }
  }, [email, resetCode, navigate]);

  const validatePassword = (value) => {
    setPasswordValidation({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    });
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    validatePassword(val);
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) return toast.error('Password is required.');
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (!isPasswordValid) {
      return toast.error('Password does not meet complexity rules.');
    }

    setLoading(true);
    try {
      const data = await resetPassword(email, password, resetCode);
      toast.success(data.message || 'Password updated successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update password.'));
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
            className="w-full max-w-md z-10"
          >
          <div className="text-center mb-8 relative">
            {/* Back to Home Link */}
            <div className="absolute top-0 left-0">
              <Link 
                to="/"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/10 transition-colors flex items-center justify-center"
                aria-label="Back to Home"
              >
                <Home size={16} />
              </Link>
            </div>

            {/* Theme Selector */}
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

            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-foreground">Setup your new password</h2>
            <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed">
              Identity verified for <span className="text-primary font-mono text-xs">{email}</span>. <br />
              Enter a strong, unique password to secure your account.
            </p>
          </div>

          <div className="glass-card p-8 border-border/50 text-left space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>
              </div>

              {/* Validation criteria */}
              {password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-background/40 border border-border p-4 rounded-xl space-y-2"
                >
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Complexity status:</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.length ? 'text-success font-semibold' : 'text-muted-foreground'}>8 or more characters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.uppercase ? 'text-success font-semibold' : 'text-muted-foreground'}>At least one uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.lowercase ? 'text-success font-semibold' : 'text-muted-foreground'}>At least one lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.number ? 'text-success font-semibold' : 'text-muted-foreground'}>At least one number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.special ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.special ? 'text-success font-semibold' : 'text-muted-foreground'}>At least one special character</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full mt-2 text-xs uppercase tracking-widest font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
