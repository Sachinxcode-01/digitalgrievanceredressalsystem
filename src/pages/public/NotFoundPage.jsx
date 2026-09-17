import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { GlassPanel } from '../../components/ui/GlassPanel';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { useAuth } from '../../app/providers/AuthProvider';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleSearchOrJump = (e) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    // Check if it's a ticket ID (e.g., #TKT-2026-..., TKT-..., or pure digits)
    if (clean.toUpperCase().includes('TKT') || clean.startsWith('#')) {
      navigate(`/track?token=${encodeURIComponent(clean.replace('#', ''))}`);
    } else {
      navigate(`/knowledge-base?q=${encodeURIComponent(clean)}`);
    }
  };

  const quickLinks = [
    {
      title: 'Portal Dashboard',
      description: isAuthenticated ? 'Access your active grievances & live updates' : 'Sign in to access your citizen control center',
      icon: Home,
      to: isAuthenticated 
        ? (user?.role === 'admin' || user?.role === 'super admin' ? '/admin/dashboard' : '/dashboard')
        : '/login',
      color: 'from-blue-500/20 to-cyan-500/20',
      badge: isAuthenticated ? 'Active' : 'Auth Required'
    },
    {
      title: 'File a Grievance',
      description: 'Submit an encrypted institutional complaint with AI triage',
      icon: FilePlus,
      to: '/submit',
      color: 'from-emerald-500/20 to-teal-500/20',
      badge: '24-48h SLA'
    },
    {
      title: 'Public Status Tracking',
      description: 'Track anonymous ticket milestones without account login',
      icon: Clock,
      to: '/public-status',
      color: 'from-amber-500/20 to-orange-500/20',
      badge: 'Real-time'
    },
    {
      title: 'Knowledge Base & FAQs',
      description: 'Explore instant solutions for campus Wi-Fi, academics & fees',
      icon: BookOpen,
      to: '/knowledge-base',
      color: 'from-indigo-500/20 to-purple-500/20',
      badge: 'Self-Serve'
    },
    {
      title: 'Public Transparency',
      description: 'Review institutional resolution rates and department leaderboards',
      icon: ShieldCheck,
      to: '/transparency',
      color: 'from-violet-500/20 to-fuchsia-500/20',
      badge: 'Audit Grade'
    },
    {
      title: 'Live System Health',
      description: 'Verify node connectivity, database pools & SLA timers',
      icon: Activity,
      to: '/status',
      color: 'from-rose-500/20 to-pink-500/20',
      badge: 'Telemetry'
    },
  ];

  return (
    <AnimatedPage className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-10 left-1/3 w-125 h-125 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-150 h-150 bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Bar Floating Controls */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 hover:text-white uppercase transition-colors"
        >
          <ChevronLeft size={16} />
          Portal Gateway
        </Link>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
            className="p-2.5 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10"
            title="Toggle theme mode"
            type="button"
            aria-label="Toggle theme mode"
          >
            {theme === 'ocean' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 pb-20 pt-4 flex flex-col items-center text-center">
        
        {/* Glowing Badge & 404 Beacon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-rose-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>HTTP 404 / Route Inaccessible</span>
          </div>

          <div className="mt-8 relative flex items-center justify-center">
            {/* Ambient circular glow behind 404 */}
            <div className="absolute w-44 h-44 rounded-full bg-linear-to-tr from-indigo-500/20 via-rose-500/20 to-cyan-500/20 blur-2xl" />
            
            <div className="relative z-10 w-28 h-28 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
              <Compass className="w-12 h-12 text-indigo-400 animate-spin" style={{ animationDuration: '24s' }} />
              <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest mt-1">SECTOR LOST</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Title & Explanation */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="space-y-3 max-w-xl mx-auto"
        >
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white">
            Sector Not Found
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
            The destination URL or record you attempted to reach has been archived, relocated, or does not exist on this institutional cluster.
          </p>
        </motion.div>

        {/* Smart Ticket Jump & Search Bar */}
        <motion.form
          onSubmit={handleSearchOrJump}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="w-full max-w-lg mt-8"
        >
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics or jump to Ticket (#TKT-2026-XXXX)..."
              className="w-full pl-11 pr-28 py-3.5 bg-slate-950/80 border border-white/15 focus:border-indigo-500/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-xl transition-all shadow-xl shadow-black/40 font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-heading uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Jump</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-2 text-left pl-2">
            Tip: Enter your tracking code to directly open public audit status.
          </p>
        </motion.form>

        {/* Quick Recovery Directory Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-full mt-12 text-left"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Authorized Portal Gateways
            </h2>
            <span className="text-[10px] font-mono text-slate-500">6 Node Access Points</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {quickLinks.map((item, idx) => (
              <Link
                key={idx}
                to={item.to}
                className="group relative p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/80 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-indigo-500/10"
              >
                {/* Subtle gradient hover highlight */}
                <div className={`absolute -right-8 -top-8 w-24 h-24 bg-linear-to-bl ${item.color} rounded-full blur-xl group-hover:scale-150 transition-transform duration-300 pointer-events-none`} />

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600/20 transition-colors">
                      <item.icon size={16} />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-heading font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug font-sans">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono font-bold text-indigo-400 group-hover:text-white uppercase tracking-wider">
                  <span>Enter Sector</span>
                  <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Support & Recovery Help Line */}
        <div className="mt-14 pt-8 border-t border-white/10 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span>Need institutional help? Contact Central Redressal at <strong className="text-slate-300 font-bold">support@resolvenow.gov.in</strong></span>
          </div>
          <div className="text-[10px] tracking-wider uppercase">
            ResolveNow Node Redressal &copy; {new Date().getFullYear()}
          </div>
        </div>

      </main>
    </AnimatedPage>
  );
};

export default NotFoundPage;
