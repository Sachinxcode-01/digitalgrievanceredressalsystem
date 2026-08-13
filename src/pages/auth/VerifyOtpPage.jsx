import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';
import { isSandboxAccount } from '../../utils/authMode';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const VerifyOtpPage = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();

  const purpose = location.state?.purpose || 'registration';
  const rememberMe = location.state?.rememberMe || false;
  const fromPath = location.state?.from || null;

  const [identifier, setIdentifier] = useState(() => location.state?.identifier || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    if (!identifier) {
      if (purpose === 'registration' && isSignUpLoaded && signUp?.emailAddress) {
        setIdentifier(signUp.emailAddress);
      } else if ((purpose === 'login' || purpose === 'mfa') && isSignInLoaded && signIn?.identifier) {
        setIdentifier(signIn.identifier);
      }
    }
  }, [identifier, purpose, isSignUpLoaded, signUp, isSignInLoaded, signIn]);

  useEffect(() => {
    if (isSignUpLoaded && isSignInLoaded && !identifier) {
      toast.error('Session expired. Please restart your flow.');
      if (purpose === 'forgot_password') {
        navigate('/forgot-password');
      } else {
        navigate('/login');
      }
    }
  }, [identifier, purpose, navigate, isSignUpLoaded, isSignInLoaded]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const isSubmittingRef = useRef(false);

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs[5].current.focus();
    } else {
      toast.error('Pasted code must contain exactly 6 digits.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(identifier, purpose);
      toast.success('A fresh OTP has been sent.');
      setCooldown(30);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dispatch code.'));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      return toast.error('Verification code must be exactly 6 digits.');
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      if (purpose === 'forgot_password') {
        const isSandbox = isSandboxAccount(identifier);
        if (isSandbox) {
          const data = await verifyOtp(identifier, otpCode, purpose, rememberMe);
          toast.success(data.message || 'Identity confirmed.');
          navigate('/reset-password', { state: { email: identifier, resetCode: data.resetCode } });
        } else {
          toast.success('Code accepted. Please set your new password.');
          navigate('/reset-password', { state: { email: identifier, resetCode: otpCode } });
        }
        return;
      }

      const data = await verifyOtp(identifier, otpCode, purpose, rememberMe);
      toast.success(data.message || 'Identity confirmed.');

      const targetPath = fromPath || (data.user?.role === 'admin' || data.user?.role === 'super admin' ? '/admin/dashboard' : '/dashboard');
      navigate(targetPath);
    } catch (err) {
      const msg = getErrorMessage(err, 'Verification failed. Try again.');

      if (msg.includes('expired') || msg.includes('expired_code') || msg.includes('not found') || msg.includes('session expired') || msg.includes('register again')) {
        toast.error('Verification session expired. Please start again.');
        navigate(purpose === 'registration' ? '/register' : '/login');
        return;
      }
      if (msg.includes('Please sign in again')) {
        toast.error('Login session expired. Please sign in again.');
        navigate('/login');
        return;
      }

      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0] && inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  useEffect(() => {
    if (otp.every(val => val !== '') && !loading && !isSubmittingRef.current) {
      handleSubmit();
    }
  }, [otp]);

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
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-white">Verify your identity</h2>
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              Enter the 6-digit security code sent to <br />
              <span className="font-mono text-indigo-400 font-bold mt-1 block text-xs">{identifier}</span>
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((value, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength="1"
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold font-mono bg-slate-950/90 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                ))}
              </div>

              <AnimatedButton
                type="submit"
                variant="glow"
                size="md"
                isLoading={loading}
                rightIcon={ArrowRight}
                className="w-full"
              >
                Verify & Proceed
              </AnimatedButton>
            </form>

            <div className="mt-6 flex flex-col gap-3 items-center justify-between text-xs border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`flex items-center gap-1 font-bold font-mono transition-colors uppercase tracking-wider text-[10px] ${
                    cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300 cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-white font-mono font-bold transition-colors uppercase tracking-wider text-[10px]">
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

export default VerifyOtpPage;
