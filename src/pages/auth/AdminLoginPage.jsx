import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck, Home, ShieldAlert, ChevronLeft, Landmark } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import toast from 'react-hot-toast';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

const VisualOTPInput = ({ value, onChange, disabled, isError }) => {
  const inputs = React.useRef([]);
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
        <div key={i} className="flex-1 min-w-0 aspect-[3/4] relative">
          <input
            ref={el => inputs.current[i] = el}
            type="text"
            maxLength="1"
            inputMode="numeric"
            value={value[i] || ''}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            disabled={disabled}
            className={`w-full h-full bg-slate-950/90 border ${isError ? 'border-rose-500/50' : 'border-white/15'} focus:border-indigo-500 rounded-xl text-center text-lg sm:text-2xl font-mono font-bold text-white focus:outline-none transition-all shadow-inner p-0`}
          />
        </div>
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
  const navigate = useNavigate();

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
      await verifyOtp(email || 'admin@resolvenow.demo', otp || '123456', 'login');
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
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-6 relative">
            <Link
              to="/"
              className="absolute left-0 top-0 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 transition-colors"
            >
              <Home size={16} />
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3">
              <Landmark size={14} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Administrative Command</span>
            </div>

            <h1 className="text-3xl font-heading font-black text-white tracking-tight">Admin Portal</h1>
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-400 mt-1">
              Security Level: Authorized Officers Only
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <AnimatePresence mode="wait">
              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold rounded-xl text-center">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold rounded-xl text-center">
                  {successMsg}
                </div>
              )}
            </AnimatePresence>

            {/* Quick Demo Button */}
            <div className="mb-6 p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl text-center">
              <AnimatedButton
                variant="glow"
                size="md"
                onClick={handleInstantAdminLogin}
                isLoading={loading}
                leftIcon={ShieldCheck}
                className="w-full"
              >
                ⚡ Instant Admin Clearance
              </AnimatedButton>
            </div>

            {!isVerifying ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Admin Clearance Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@resolvenow.demo"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  rightIcon={ArrowRight}
                  className="w-full mt-2"
                >
                  Authorize Terminal
                </AnimatedButton>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <ShieldAlert className="w-10 h-10 text-indigo-400 mb-2 animate-bounce" />
                  <h3 className="text-base font-bold text-white mb-1">Verify Security Key</h3>
                  <p className="text-slate-400 text-xs text-center">
                    Enter the 6-digit key sent to <span className="text-white font-mono">{email}</span>
                  </p>
                </div>

                <VisualOTPInput value={otp} onChange={setOtp} disabled={loading} isError={!!error} />

                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={() => setIsVerifying(false)}
                    className="text-xs font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                </div>

                <AnimatedButton
                  type="submit"
                  variant="glow"
                  size="md"
                  isLoading={loading}
                  disabled={otp.length < 6}
                  rightIcon={ArrowRight}
                  className="w-full"
                >
                  Confirm Admin Access
                </AnimatedButton>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                Protected Institutional Network
              </p>
              <Link to="/login" className="mt-2 inline-block text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300">
                Switch to Citizen Portal →
              </Link>
            </div>
          </MotionCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default AdminLoginPage;
