import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, KeyRound, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Email address is required.');
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      toast.success(data.message || 'OTP reset key has been sent.');
      navigate('/verify-otp', { state: { identifier: email, purpose: 'forgot_password' } });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dispatch reset key.'));
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
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-white">Reset your password</h2>
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              Enter your email and we'll dispatch a 6-digit <br />
              security code to recover your account credentials.
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <AnimatedButton
                type="submit"
                variant="glow"
                size="md"
                isLoading={loading}
                rightIcon={ArrowRight}
                className="w-full"
              >
                Send Reset Code
              </AnimatedButton>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-mono font-bold uppercase tracking-wider">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          </MotionCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default ForgotPasswordPage;
