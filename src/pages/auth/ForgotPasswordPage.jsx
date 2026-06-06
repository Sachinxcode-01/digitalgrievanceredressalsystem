import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, KeyRound, Sun, Moon, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { BackgroundGradientAnimation } from '../../components/ui/background-gradient-animation';
import { NeuralOverlay } from '../../components/ui/NeuralOverlay';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

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
      toast.error(err.response?.data?.error || 'Failed to dispatch reset key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradientAnimation
      interactive={true}
      gradientBackgroundStart={theme === 'midnight' ? "#020617" : "#f8fafc"}
      gradientBackgroundEnd={theme === 'midnight' ? "#000000" : "#f1f5f9"}
      firstColor={theme === 'midnight' ? "79, 70, 229" : "186, 230, 253"}
      secondColor={theme === 'midnight' ? "99, 102, 241" : "199, 210, 254"}
      thirdColor={theme === 'midnight' ? "0, 0, 0" : "224, 242, 254"}
    >
      <NeuralOverlay theme={theme} />
      <div className="h-screen w-full overflow-y-auto relative z-50">
        <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
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

            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-heading font-black text-foreground">Reset your password</h2>
            <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed">
              Enter your email and we'll dispatch a 6-digit <br />
              one-time security code to reset your account credentials.
            </p>
          </div>

          <div className="glass-card p-8 border-border/50 text-left space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.edu"
                    className="glass-input w-full pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full mt-2 text-xs uppercase tracking-widest font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-bold uppercase tracking-wider">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};
export default ForgotPasswordPage;
