import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Check, ShieldAlert, ArrowRight, Sparkles, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

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
        formData.mobileNumber,
        formData.password,
        formData.role
      );
      toast.success(data.message || 'OTP dispatched for verification.');
      navigate('/verify-otp', { state: { identifier: formData.email, purpose: 'registration' } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please check inputs.');
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
            className="w-full max-w-lg"
          >
          {/* Branding header */}
          <div className="text-center mb-8 relative">
            {/* Back to Home Link */}
            <div className="absolute top-0 left-0 sm:-left-4">
              <Link 
                to="/"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/10 transition-colors flex items-center justify-center"
                aria-label="Back to Home"
              >
                <Home size={16} />
              </Link>
            </div>

            {/* Theme Selector */}
            <div className="absolute top-0 right-0 sm:-right-4">
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
            <h2 className="text-2xl font-heading font-black text-foreground">Create your institutional account</h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">Get started with our Digital Grievance System</p>
          </div>

          {/* Card */}
          <div className="glass-card p-8 border-border/50 text-left space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@institution.edu"
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mobile Number (Optional)</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="+919876543210"
                      className="glass-input w-full pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Clearance Level (Role)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="glass-input w-full bg-background/50 border-border/80 text-foreground"
                >
                  <option value="student" className="bg-background text-foreground">Student</option>
                  <option value="faculty" className="bg-background text-foreground">Faculty</option>
                  <option value="staff" className="bg-background text-foreground">Staff</option>
                  <option value="admin" className="bg-background text-foreground">Admin</option>
                  <option value="super admin" className="bg-background text-foreground">Super Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Validation List */}
              {formData.password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-background/40 border border-border p-4 rounded-xl space-y-2"
                >
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Password requirements:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-success" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.length ? 'text-success font-semibold' : 'text-muted-foreground'}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-success" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.uppercase ? 'text-success font-semibold' : 'text-muted-foreground'}>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5 text-success" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.lowercase ? 'text-success font-semibold' : 'text-muted-foreground'}>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-success" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.number ? 'text-success font-semibold' : 'text-muted-foreground'}>One number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs col-span-1 md:col-span-2">
                      {passwordValidation.special ? <Check className="w-3.5 h-3.5 text-success" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.special ? 'text-success font-semibold' : 'text-muted-foreground'}>One special character (e.g. @, $, !, %)</span>
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
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-bold transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default RegisterPage;
