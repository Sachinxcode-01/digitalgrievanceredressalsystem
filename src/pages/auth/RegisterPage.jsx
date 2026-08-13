import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, Check, ShieldAlert, ArrowRight, 
  Home, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import gsap from 'gsap';

export const RegisterPage = () => {
  const { register, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();
  const orbRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    agreeTerms: false
  });

  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'microsoft' | null
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Soft floating GSAP orb background effect
  useEffect(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        y: -15,
        scale: 1.05,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);

  const validatePassword = (value) => {
    setPasswordValidation({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Field validations
  const isNameValid = formData.fullName.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(formData.fullName.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isMobileValid = /^[0-9+\-\s()]{10,15}$/.test(formData.mobileNumber.trim());
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const isConfirmMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const triggerErrorShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true
    });

    if (!formData.fullName.trim()) {
      triggerErrorShake();
      return toast.error('Full Name is required.');
    }
    if (!isNameValid) {
      triggerErrorShake();
      return toast.error('Full Name can only contain letters and spaces (min 2 characters).');
    }
    if (!formData.email.trim() || !isEmailValid) {
      triggerErrorShake();
      return toast.error('Please enter a valid email address.');
    }
    if (!formData.mobileNumber.trim() || !isMobileValid) {
      triggerErrorShake();
      return toast.error('Please enter a valid 10-15 digit mobile number.');
    }
    if (!formData.password) {
      triggerErrorShake();
      return toast.error('Password is required.');
    }
    if (!isPasswordValid) {
      triggerErrorShake();
      return toast.error('Password does not meet all security criteria.');
    }
    if (!isConfirmMatch) {
      triggerErrorShake();
      return toast.error('Passwords do not match.');
    }
    if (!formData.agreeTerms) {
      triggerErrorShake();
      return toast.error('You must accept the Terms of Service and Privacy Policy to proceed.');
    }

    setLoading(true);
    try {
      const data = await register(
        formData.fullName.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        formData.mobileNumber.trim()
      );
      toast.success(data.message || 'OTP dispatched for verification.');
      navigate('/verify-otp', { state: { identifier: formData.email.trim(), purpose: 'registration' } });
    } catch (err) {
      triggerErrorShake();
      const msg = getErrorMessage(err, 'Registration failed. Please check your details.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setOauthLoading('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Google Sign-In failed. Please try again.'));
      setOauthLoading(null);
    }
  };

  const handleMicrosoftSignup = async () => {
    setOauthLoading('microsoft');
    try {
      await loginWithMicrosoft();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Microsoft Sign-In failed. Please try again.'));
      setOauthLoading(null);
    }
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Subtle glowing orb background effect */}
        <div 
          ref={orbRef}
          className="absolute top-[15%] left-[50%] -translate-x-1/2 w-125 h-[350px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" 
        />

        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg z-10 my-8"
        >
          {/* Header Branding */}
          <div className="text-center mb-6 relative">
            <Link 
              to="/"
              className="absolute left-0 top-0 p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/70 border border-white/10 transition-colors shadow-lg group"
              title="Return to Home"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform" />
            </Link>

            <Link to="/" className="inline-flex items-center gap-2.5 group mb-2">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-heading font-black tracking-tight uppercase bg-linear-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ResolveNow
              </span>
            </Link>
            
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight mt-1">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Create your account to submit and track grievances
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8 backdrop-blur-2xl bg-slate-950/80 border border-white/10 shadow-2xl rounded-3xl" tilt={false}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  {touched.fullName && (
                    <span className="text-[10px] font-mono">
                      {isNameValid ? (
                        <span className="text-emerald-400 flex items-center gap-1"><Check size={12} /> Valid</span>
                      ) : (
                        <span className="text-rose-400">Letters & spaces only</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Alexander Wright"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all ${
                      touched.fullName && !isNameValid 
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' 
                        : 'border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Email & Mobile Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('email')}
                      placeholder="user@institution.edu"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all ${
                        touched.email && !isEmailValid 
                          ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' 
                          : 'border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                      Mobile Number <span className="text-rose-400">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('mobileNumber')}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all ${
                        touched.mobileNumber && !isMobileValid 
                          ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30' 
                          : 'border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all ${
                        touched.password && !isPasswordValid 
                          ? 'border-rose-500/80 focus:border-rose-500' 
                          : 'border-white/10 focus:border-indigo-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border text-white text-xs placeholder:text-slate-500 focus:outline-none transition-all ${
                        touched.confirmPassword && !isConfirmMatch 
                          ? 'border-rose-500/80 focus:border-rose-500' 
                          : 'border-white/10 focus:border-indigo-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Status indicator */}
              {formData.confirmPassword.length > 0 && (
                <div className="text-[11px] font-mono flex items-center gap-1.5">
                  {isConfirmMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Passwords match</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1"><AlertCircle size={13} /> Passwords do not match</span>
                  )}
                </div>
              )}

              {/* Password Security Criteria checklist */}
              {formData.password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-900/80 border border-white/10 p-3.5 rounded-xl space-y-2"
                >
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={11} className="text-indigo-400" /> Password Security Criteria:
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className={passwordValidation.length ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className={passwordValidation.uppercase ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>1 uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className={passwordValidation.lowercase ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>1 lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className={passwordValidation.number ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>1 number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {passwordValidation.special ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      <span className={passwordValidation.special ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>1 special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={12} className="text-indigo-400" /> Account Type / Role Selection
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="student" className="bg-slate-900 text-white">Student / User (Standard Grievance Filer)</option>
                    <option value="officer" className="bg-slate-900 text-white">Grievance Officer (Departmental Terminal)</option>
                    <option value="admin" className="bg-slate-900 text-white">Administrator (Restricted Governance)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
                {formData.role === 'admin' && (
                  <p className="text-[10px] text-amber-400/90 font-mono mt-1">
                    * Admin self-registrations require institutional clearance verification before full admin rights are granted.
                  </p>
                )}
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-snug group-hover:text-white transition-colors">
                    I agree to the{' '}
                    <a href="/status" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/status" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
              </div>

              {/* Create Account Submit Button */}
              <AnimatedButton
                type="submit"
                variant="glow"
                size="lg"
                isLoading={loading}
                rightIcon={ArrowRight}
                className="w-full mt-3 shadow-lg shadow-indigo-500/25"
              >
                Create Account
              </AnimatedButton>
            </form>

            {/* Social Authentication Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={!!oauthLoading || loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 hover:border-white/20 disabled:opacity-50 shadow-md"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.4-.9-.6-1.9-.6-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                    />
                  </svg>
                )}
                <span>Google</span>
              </button>

              {/* Microsoft Button */}
              <button
                type="button"
                onClick={handleMicrosoftSignup}
                disabled={!!oauthLoading || loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 hover:border-white/20 disabled:opacity-50 shadow-md"
              >
                {oauthLoading === 'microsoft' ? (
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                )}
                <span>Microsoft</span>
              </button>
            </div>

            {/* Already Have Account Link */}
            <div className="mt-6 text-center text-xs text-slate-400 pt-2 border-t border-white/5">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors">
                Sign In
              </Link>
            </div>
          </MotionCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default RegisterPage;
