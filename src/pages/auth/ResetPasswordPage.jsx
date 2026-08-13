import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Check, ShieldAlert, CheckCircle, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const resetCode = location.state?.resetCode || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

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

            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-white">Setup new password</h2>
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              Identity verified for <span className="text-indigo-400 font-mono text-xs">{email}</span>. <br />
              Enter a strong, unique password to secure your account.
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {password && (
                <div className="bg-slate-950/60 border border-white/10 p-4 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Complexity Status:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.length ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>8 or more characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.uppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>At least one uppercase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.number ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>At least one number</span>
                    </div>
                  </div>
                </div>
              )}

              <AnimatedButton
                type="submit"
                variant="glow"
                size="md"
                isLoading={loading}
                rightIcon={ArrowRight}
                className="w-full mt-2"
              >
                Update Password
              </AnimatedButton>
            </form>
          </MotionCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default ResetPasswordPage;
