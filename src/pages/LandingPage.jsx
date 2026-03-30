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

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="flex items-center justify-center gap-12 mt-16 px-10 py-6 glass-premium border-white/5 bg-white/[0.02]"
            >
              {[
                { label: 'Grievances Resolved', val: '12,840+' },
                { label: 'Avg. Response Time', val: '< 15s' },
                { label: 'AI Confidence Score', val: '99.8%' }
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <p className="text-2xl font-black text-white group-hover:text-primary transition-colors">{stat.val}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
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

          {/* Institutional Intelligence (About) */}
          <div className="mt-48 w-full text-left space-y-16">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-black text-white font-['Outfit'] mb-6 uppercase tracking-tight">Institutional <span className="text-primary">Intelligence.</span></h2>
              <p className="text-lg text-slate-400 leading-relaxed font-medium">
                ResolveNow is engineered to transform how modern institutions handle feedback. By leveraging high-density AI triage and secure neural networks, we eliminate the friction between administrative bottlenecks and user satisfaction.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="glass-card p-10 border-primary/20 bg-primary/5">
                <h4 className="text-xl font-black text-white mb-4 font-['Outfit'] uppercase tracking-tight">For Administration</h4>
                <ul className="space-y-4">
                  {[
                    'Automated Categorization using Gemini 1.5 Flash',
                    'Executive Analytics with Frustration Index tracking',
                    'Zero-Trust Security Logs for internal auditing',
                    'Specialist Elevation Flow for rapid departmental handoff'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card p-10 border-secondary/20 bg-secondary/5">
                <h4 className="text-xl font-black text-white mb-4 font-['Outfit'] uppercase tracking-tight">For the Public</h4>
                <ul className="space-y-4">
                  {[
                    'Real-time Progress Tracking with Neural Timeline',
                    'AI ResolveBot for instant 24/7 assistance',
                    'Document & Evidence Attachment Support',
                    'Voice Synthesis for audible resolution updates'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-48 w-full max-w-4xl text-left pb-32">
            <h2 className="text-3xl font-black text-white font-['Outfit'] mb-12 uppercase tracking-tight text-center">Frequently Asked <span className="text-primary">Questions.</span></h2>
            <div className="space-y-4">
              {[
                { q: "How secure is my data?", a: "We use enterprise-grade encryption and Supabase's secure infrastructure. All administrative actions are logged in a zero-trust environment." },
                { q: "What is the typical resolution time?", a: "While complex cases vary, our AI triage reduces initial response time by up to 80%, ensuring grievances reach decision-makers in seconds." },
                { q: "Can I submit anonymous grievances?", a: "Yes, our system supports anonymous submissions while maintaining a unique tracking ID for secure updates." },
                { q: "How accurate is the AI triage?", a: "Powered by Gemini 1.5 Flash, our neural network achieves 98% accuracy in category detection and urgency prediction." }
              ].map((faq, i) => (
                <div key={i} className="glass-card p-8 group hover:bg-white/5 transition-all">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-primary text-xs font-black">0{i+1}</span>
                    {faq.q}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium pl-8">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="w-full py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
          &copy; {new Date().getFullYear()} ResolveNow &bull; Built for Society &bull; AI Powered
        </footer>
      </div>
    </BackgroundGradientAnimation>
  );
};
