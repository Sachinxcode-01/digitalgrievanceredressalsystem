import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useSignUp, useSignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, ArrowLeft, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';
import { isSandboxAccount } from '../../utils/authMode';

export const VerifyOtpPage = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve state passed from registration or login
  const purpose = location.state?.purpose || 'registration';
  const rememberMe = location.state?.rememberMe || false;
  const fromPath = location.state?.from || null;

  const [identifier, setIdentifier] = useState(() => location.state?.identifier || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30); // 30s resend timer
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Recover identifier from Clerk SDK if lost on page refresh
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
    // If Clerk has loaded and we still don't have an identifier, redirect
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
    if (isNaN(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Keep last char
    setOtp(newOtp);

    // Auto focus next field
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace handles focus shift leftwards
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const isSubmittingRef = useRef(false);

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, ''); // Extract only digits
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
      setCooldown(30); // reset timer
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dispatch code.'));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading || isSubmittingRef.current) return; // Prevent double submission/race conditions
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
          // Sandbox: backend verifies the OTP and returns a resetCode
          const data = await verifyOtp(identifier, otpCode, purpose, rememberMe);
          toast.success(data.message || 'Identity confirmed.');
          navigate('/reset-password', { state: { email: identifier, resetCode: data.resetCode } });
        } else {
          // Clerk: the OTP code IS the reset code — pass it directly to ResetPasswordPage
          // which calls resetPassword(email, newPassword, code) → signIn.attemptFirstFactor
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

      // Stale Clerk state: signUp/signIn lost after page refresh — redirect to restart
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
      // Clear inputs on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0] && inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Trigger submission automatically when all fields are completed and not already submitting
  useEffect(() => {
    if (otp.every(val => val !== '') && !loading && !isSubmittingRef.current) {
      handleSubmit();
    }
  }, [otp]);

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
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-foreground">Verify your identity</h2>
            <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed">
              Enter the 6-digit key dispatched to <br />
              <span className="font-mono text-primary font-bold mt-1 block text-xs">{identifier}</span>
            </p>
          </div>

          <div className="glass-card p-8 border-border/50 text-left space-y-6">
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
                    className="glass-input w-12 h-14 text-center text-xl font-bold font-mono focus:ring-primary/20 focus:border-primary"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full text-xs uppercase tracking-widest font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Cooldown controls */}
            <div className="mt-6 flex flex-col gap-3 items-center justify-between text-xs border-t border-border/50 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Didn't receive the key?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`flex items-center gap-1 font-bold transition-colors uppercase tracking-wider text-[10px] ${cooldown > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:text-secondary cursor-pointer'}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
              
              <Link to="/login" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-bold transition-colors uppercase tracking-wider text-[10px]">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
