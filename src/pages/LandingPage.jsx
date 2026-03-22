import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe, Sparkles, Ticket } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { BackgroundGradientAnimation } from '../components/ui/background-gradient-animation';
import { RainbowButton } from '../components/ui/RainbowButton';

export const LandingPage = ({ session }) => {
  if (session) return <Navigate to="/" />;

  const features = [
    { icon: <Zap size={24} />, title: 'Instant Triage', desc: 'AI-powered categorization ensures your grievance reaches the right department in seconds.' },
    { icon: <ShieldCheck size={24} />, title: 'Secure & Private', desc: 'Enterprise-grade encryption protecting your data and identity throughout the resolution process.' },
    { icon: <Globe size={24} />, title: 'Transparency First', desc: 'Real-time tracking and public status verification for total accountability.' },
  ];

  return (
    <BackgroundGradientAnimation 
      interactive={true}
      gradientBackgroundStart="rgb(0, 8, 20)" 
      gradientBackgroundEnd="rgb(0, 4, 12)"
      firstColor="67, 97, 238"    /* Indigo-Blue */
      secondColor="114, 9, 183"   /* Rich Purple */
    >
      <div className="min-h-screen relative z-50 flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full max-w-7xl px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-2xl shadow-primary/20">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase font-['Outfit']">ResolveNow</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/track" className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
              <Ticket size={18} />
              Track Ticket
            </Link>
            <Link to="/login">
              <RainbowButton className="!py-2.5 !px-6 rounded-xl">
                <span className="text-xs font-black uppercase tracking-widest">Login Terminal</span>
              </RainbowButton>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center justify-center px-6 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-premium text-primary border border-primary/20 bg-primary/5">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI-Powered Redressal v2.0</span>
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black text-white font-['Outfit'] leading-[0.95] tracking-tight">
              Grievance Redressal <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-slate-200 to-secondary">
                Redefined.
              </span>
            </h2>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Experience the world's most advanced digital redressal system. Fast, transparent, and driven by intelligent agents to resolve your concerns in record time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link to="/login">
                <RainbowButton className="h-16 px-10 rounded-2xl group">
                  <span className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    Initialize Terminal
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </RainbowButton>
              </Link>
              <Link to="/track">
                <button className="h-16 px-10 rounded-2xl border border-white/10 glass-premium hover:bg-white/10 transition-all text-sm font-black uppercase tracking-[0.2em] text-white">
                  Track Existing
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="glass-card p-10 text-left group hover:border-primary/30 transition-all cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3 font-['Outfit']">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </main>

        <footer className="w-full py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
          &copy; {new Date().getFullYear()} ResolveNow &bull; Built for Society &bull; AI Powered
        </footer>
      </div>
    </BackgroundGradientAnimation>
  );
};
