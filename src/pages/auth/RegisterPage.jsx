import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Check, ShieldAlert, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errors';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) return toast.error('Full Name is required.');
    if (!formData.email.trim()) return toast.error('Email is required.');
    if (!formData.password) return toast.error('Password is required.');

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    
    if (!isPasswordValid) {
      return toast.error('Password does not meet the complexity requirements.');
    }

    setLoading(true);
    try {
      const data = await register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.role
      );
      toast.success(data.message || 'OTP dispatched for verification.');
      navigate('/verify-otp', { state: { identifier: formData.email, purpose: 'registration' } });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed. Please check inputs.'));
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
          className="w-full max-w-lg"
        >
          {/* Header Branding */}
          <div className="text-center mb-6 relative">
            <Link 
              to="/"
              className="absolute left-0 top-0 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 transition-colors"
            >
              <Home size={16} />
            </Link>

            <Link to="/" className="inline-flex items-center gap-2 group mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-heading font-black text-white tracking-tight uppercase">
                ResolveNow
              </span>
            </Link>
            <h2 className="text-2xl font-heading font-black text-white">Create institutional account</h2>
            <p className="text-xs text-indigo-400 font-mono font-bold uppercase tracking-widest mt-1">
              Get started with Digital Grievance System
            </p>
          </div>

          <MotionCard className="p-6 sm:p-8" tilt={false}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@institution.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Clearance Level (Role)
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="student" className="bg-slate-900 text-white">Student</option>
                  <option value="faculty" className="bg-slate-900 text-white">Faculty</option>
                  <option value="staff" className="bg-slate-900 text-white">Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Validation */}
              {formData.password && (
                <div className="bg-slate-950/60 border border-white/10 p-4 rounded-xl space-y-2">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Password Security Criteria:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.length ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>At least 8 chars</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.uppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>One uppercase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.lowercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>One lowercase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />}
                      <span className={passwordValidation.number ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>One number</span>
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
                Create Account
              </AnimatedButton>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">
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
