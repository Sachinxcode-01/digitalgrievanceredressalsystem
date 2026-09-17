import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Search, 
  ArrowRight, 
  Home, 
  FilePlus, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  Activity, 
  ChevronLeft,
  Moon,
  Sun,
  AlertCircle,
  FileSearch,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTheme } from '../../app/providers/ThemeProvider';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSearchOrJump = (e) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    // Check if it's a ticket ID (e.g., #TKT-2026-..., TKT-..., or pure digits)
    if (clean.toUpperCase().includes('TKT') || clean.startsWith('#')) {
      navigate(`/public-status?token=${encodeURIComponent(clean.replace('#', ''))}`);
    } else {
      navigate(`/knowledge-base?q=${encodeURIComponent(clean)}`);
    }
  };

  const quickLinks = [
    {
      title: 'Portal Dashboard',
      description: isAuthenticated ? 'Access your active grievances & live milestone updates' : 'Sign in to access your student/citizen control center',
      icon: Home,
      to: isAuthenticated 
        ? (user?.role === 'admin' || user?.role === 'super admin' ? '/admin/dashboard' : '/dashboard')
        : '/login',
      accent: 'indigo',
      badge: isAuthenticated ? 'Active' : 'Auth Required'
    },
    {
      title: 'File a Grievance',
      description: 'Submit an institutional complaint with automated AI categorization',
      icon: FilePlus,
      to: '/submit',
      accent: 'emerald',
      badge: '24-48h SLA'
    },
    {
      title: 'Public Status Tracking',
      description: 'Track anonymous ticket milestones without account credentials',
      icon: Clock,
      to: '/public-status',
      accent: 'amber',
      badge: 'Real-time'
    },
    {
      title: 'Knowledge Base & FAQs',
      description: 'Instant solutions for hostel Wi-Fi, academics, scholarships & fees',
      icon: BookOpen,
      to: '/knowledge-base',
      accent: 'cyan',
      badge: 'Self-Serve'
    },
    {
      title: 'Public Transparency',
      description: 'Review institutional resolution rates & department leaderboards',
      icon: ShieldCheck,
      to: '/transparency',
      accent: 'violet',
      badge: 'Audit Grade'
    },
    {
      title: 'Verify Proof & Status',
      description: 'Inspect SHA-256 Merkle proofs & live cluster telemetry health',
      icon: Activity,
      to: '/verify-proof',
      accent: 'rose',
      badge: 'Cryptographic'
    },
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-5xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">

          {/* Top Bar Floating Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer shadow-lg"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/verify-proof"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono transition-all"
              >
                <FileSearch size={13} className="text-cyan-400" />
                <span>Verify Proof</span>
              </Link>
              <Link
                to="/status"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono transition-all"
              >
                <Activity size={13} className="text-emerald-400" />
                <span>System Status</span>
              </Link>
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-white/10 rounded-xl transition-all hover:bg-slate-800 cursor-pointer"
                title="Toggle theme mode"
                type="button"
                aria-label="Toggle theme mode"
              >
                {theme === 'ocean' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>
          </div>

          {/* Main Hero Card */}
          <MotionCard 
            className="p-8 sm:p-12 text-center relative overflow-hidden"
            glow={true}
          >
            {/* Background cyber radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing 404 Badge */}
            <div className="relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-rose-500/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>HTTP 404 / Route Inaccessible</span>
            </div>

            {/* Compass Radar Badge */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-24 h-24 rounded-3xl bg-slate-950/80 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
                <Compass className="w-11 h-11 text-indigo-400 animate-spin" style={{ animationDuration: '24s' }} />
                <span className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest mt-1">SECTOR LOST</span>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mt-4">
              Destination Sector Not Found
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-sans mt-3">
              The routing node or cryptographic grievance record you attempted to reach has been archived, relocated, or does not exist on this cluster.
            </p>

            {/* Smart Search / Ticket Jump Form */}
            <form
              onSubmit={handleSearchOrJump}
              className="w-full max-w-xl mx-auto mt-8 relative"
            >
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Ticket ID (#TKT-2026-XXXX) or search FAQs..."
                  className="w-full pl-11 pr-28 py-3.5 bg-slate-950/90 border border-white/15 focus:border-indigo-500/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-xl transition-all shadow-xl font-mono"
                />
                <div className="absolute right-2">
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    <span>Jump</span>
                    <ArrowRight size={13} />
                  </AnimatedButton>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-2 text-left pl-2">
                Tip: Enter your tracking code to directly open public audit status.
              </p>
            </form>
          </MotionCard>

          {/* Quick Gateway Link Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                Authorized Portal Gateways
              </h2>
              <span className="text-[10px] font-mono text-slate-500">6 Direct Subsystems</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {quickLinks.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  className="block h-full cursor-pointer group"
                >
                  <MotionCard 
                    className="p-5 h-full flex flex-col justify-between group-hover:border-indigo-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600/20 transition-colors">
                          <item.icon size={18} />
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-sm font-heading font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono font-bold text-indigo-400 group-hover:text-white uppercase tracking-wider">
                      <span>Enter Sector</span>
                      <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </MotionCard>
                </Link>
              ))}
            </div>
          </div>

          {/* Emergency Support & Statutory Footer */}
          <MotionCard className="p-5 sm:p-6 bg-slate-950/60 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2.5">
                <LifeBuoy size={16} className="text-indigo-400 shrink-0" />
                <span>
                  Need direct assistance? Central Redressal desk: <strong className="text-white font-bold">support@resolvenow.gov.in</strong>
                </span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                ResolveNow Node Redressal &copy; {new Date().getFullYear()}
              </div>
            </div>
          </MotionCard>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default NotFoundPage;
