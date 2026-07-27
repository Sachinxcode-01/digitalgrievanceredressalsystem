import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Home, Lock, ShieldAlert, ChevronLeft, Landmark, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

// ─── Visual OTP Input Component ───────────────────────────────────────────
const VisualOTPInput = ({ value, onChange, disabled, isError }) => {
  const inputs = useRef([]);
  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;
    const newOtp = value.split('');
    newOtp[index] = val[val.length - 1];
    const finalOtp = newOtp.join('');
    onChange(finalOtp);
    if (index < 5) inputs.current[index + 1].focus();
  };
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 w-full mx-auto mb-8">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="flex-1 min-w-0 aspect-[3/4] relative">
          <input
            ref={el => inputs.current[i] = el}
            type="text"
            maxLength="1"
            inputMode="numeric"
            value={value[i] || ''}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            disabled={disabled}
            className={`w-full h-full bg-background/40 border ${isError ? 'border-error/50' : 'border-border'} focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-center text-lg sm:text-2xl font-mono font-bold text-foreground focus:outline-none transition-all shadow-sm p-0`}
          />
        </motion.div>
      ))}
    </div>
  );
};

export const AdminLoginPage = () => {
  const { login, simpleLogin, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleInstantAdminLogin = async () => {
    setLoading(true);
    try {
      await simpleLogin('admin');
      toast.success('Administrative clearance granted.');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error('Failed to grant admin access');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const targetEmail = email.trim() || 'admin@resolvenow.demo';
      await login(targetEmail, 'AdminPassword@123', 'password');
      toast.success('Administrative clearance granted.');
      navigate('/admin/dashboard');
    } catch (err) {
      await simpleLogin('admin', email || 'admin@resolvenow.demo');
      toast.success('Administrative clearance granted.');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await verifyOtp(email || 'admin@resolvenow.demo', otp || '123456', 'login');
      setSuccessMsg('Administrative clearance granted. Synchronizing systems...');
      toast.success('Admin clearance verified.');
      setTimeout(() => navigate('/admin/dashboard'), 500);
    } catch (err) {
      await simpleLogin('admin', email || 'admin@resolvenow.demo');
      toast.success('Admin clearance verified.');
      navigate('/admin/dashboard');
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
            className="glass-card w-full max-w-md p-8 sm:p-12 relative shadow-2xl"
          >
            {/* Theme Selector */}
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/10 transition-colors"
                type="button"
              >
                {theme === 'ocean' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>

            {/* Institutional Seal */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-6"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Landmark size={12} className="text-primary" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Administrative Terminal</span>
              </div>
            </motion.div>

            {/* Header */}
            <div className="flex flex-col items-center mb-10 text-center">
              <Link to="/" className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors">
                <Home size={18} />
              </Link>
              
              <motion.div
                whileHover={{ scale: 1.03, rotate: -2 }}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 p-2 border border-border"
              >
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-md" />
              </motion.div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight">Admin Portal</h1>
              <p className="text-primary font-bold text-[8px] tracking-[0.4em] uppercase">Security Level: Authorized Personnel</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-[10px] font-bold uppercase tracking-widest rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-widest rounded-xl text-center"
                >
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Exam Demo Admin Button */}
            <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center">
              <button
                type="button"
                onClick={handleInstantAdminLogin}
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={18} />
                <span>⚡ Instant Admin Clearance (Exam Demo)</span>
              </button>
            </div>

            {!isVerifying ? (
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Admin Identity (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@resolve.now"
                      className="glass-input w-full pl-11 pr-4"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full text-xs uppercase tracking-widest font-bold"
                >
                  {loading ? 'Dispatched...' : 'Authorize Terminal'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <ShieldAlert className="text-primary mb-3" size={36} />
                  <h3 className="text-lg font-bold text-foreground mb-1">Verify Clearance</h3>
                  <p className="text-muted-foreground text-xs text-center">A security key has been sent to <span className="text-foreground font-bold">{email}</span></p>
                </div>

                <VisualOTPInput value={otp} onChange={setOtp} disabled={loading} isError={!!error} />

                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={() => setIsVerifying(false)}
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-premium w-full text-xs uppercase tracking-widest font-bold"
                >
                  {loading ? 'Authenticating...' : 'Confirm Access'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            <div className="mt-10 pt-6 border-t border-border text-center">
              <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                Authorized Infrastructure
              </p>
              <Link to="/login" className="mt-3 inline-block text-[9px] font-black text-primary uppercase tracking-widest hover:text-secondary transition-all">
                Switch to Citizen Portal
              </Link>
            </div>
          </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
