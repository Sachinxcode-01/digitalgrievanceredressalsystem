import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  ShieldAlert, 
  RefreshCw, 
  Activity, 
  Database, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  Moon, 
  Sun,
  Mail,
  PhoneCall,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../../components/ui/AnimatedPage';

export const MaintenancePage = () => {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const probeBackendHealth = async () => {
    setLoading(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/v1\/?$/, '');
      const res = await fetch(`${apiBase}/health`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const healthyStatus = data.status === 'healthy' || data.status === 'ok';
        setIsOnline(typeof data.online === 'boolean' ? data.online : healthyStatus);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
    } finally {
      setLastChecked(new Date());
      setLoading(false);
      setCountdown(30);
    }
  };

  useEffect(() => {
    probeBackendHealth();
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          probeBackendHealth();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const systemNodes = [
    {
      name: 'PostgreSQL DB Pool',
      role: 'Supabase Data Ledger',
      status: isOnline ? 'Nominal' : 'Synchronizing',
      icon: Database,
      accent: 'emerald'
    },
    {
      name: 'Gemini AI Engine',
      role: 'Complaint Triage & Semantics',
      status: isOnline ? 'Ready' : 'Model Warmup',
      icon: Cpu,
      accent: 'cyan'
    },
    {
      name: 'SLA Escalation Queue',
      role: 'Automated 24/48h Timers',
      status: 'Paused Safe',
      icon: Clock,
      accent: 'amber'
    },
    {
      name: 'SHA-256 Merkle Chain',
      role: 'Immutable Audit Firewall',
      status: 'Protected',
      icon: Lock,
      accent: 'indigo'
    }
  ];

  return (
    <AnimatedPage className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Background ambient mesh */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-125 h-125 bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-150 h-150 bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

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
          <Link
            to="/status"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <Activity size={13} className="text-emerald-400" />
            <span>Full Telemetry</span>
          </Link>

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

      {/* Main Content Area */}
      <main className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 pb-20 pt-4 flex flex-col items-center text-center">
        
        {/* Status Pill Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Scheduled Institutional Maintenance</span>
          </div>
        </motion.div>

        {/* Central Wrench Graphic */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="relative flex items-center justify-center mb-6"
        >
          <div className="absolute w-36 h-36 rounded-full bg-linear-to-tr from-amber-500/20 via-orange-500/20 to-indigo-500/20 blur-xl" />
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-slate-950/80 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
            <Wrench className="w-10 h-10 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
        </motion.div>

        {/* Heading & Summary */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="space-y-3 max-w-lg mx-auto"
        >
          <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white">
            System Upgrades in Progress
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
            The ResolveNow platform is currently undergoing scheduled infrastructure hardening, cryptographic ledger synchronization, and SLA engine optimization.
          </p>
        </motion.div>

        {/* Live Re-connection Probe Card */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="w-full mt-8 p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Activity size={20} className={loading ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold text-white">
                  Cluster Status: {isOnline ? 'Nodes Online & Accessible' : 'Maintenance Mode Active'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {isOnline ? 'READY' : `SYNC (${countdown}s)`}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Last heartbeat: {lastChecked ? lastChecked.toLocaleTimeString() : 'Checking...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isOnline ? (
              <Link
                to="/"
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} />
                <span>Return to Portal</span>
              </Link>
            ) : (
              <button
                onClick={probeBackendHealth}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Probe Connectivity</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Node Subsystems Health Matrix */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full mt-8 text-left"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Infrastructure Node Health Matrix
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Zero-Data-Loss Protected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {systemNodes.map((node, i) => (
              <div 
                key={i} 
                className="p-4 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                    <node.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-heading font-bold text-white">{node.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500">{node.role}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                  {node.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Emergency Helpdesk & SLA Guarantee Notice */}
        <div className="mt-12 p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-left w-full space-y-3">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldAlert size={15} />
            <span>Statutory SLA Assurance</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            All running SLA countdown timers for submitted complaints are securely frozen during maintenance periods. Resolution deadlines are automatically extended to match downtime, preventing unfair SLA breaches.
          </p>
          <div className="pt-2 border-t border-indigo-500/10 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail size={12} className="text-indigo-400" />
              Emergency Ops: <strong className="text-white">ops@resolvenow.gov.in</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <PhoneCall size={12} className="text-indigo-400" />
              Hotline: <strong className="text-white">1800-REDRESS</strong>
            </span>
          </div>
        </div>

        {/* Return Button */}
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            <span>Return to Landing Portal</span>
            <ExternalLink size={12} />
          </Link>
        </div>

      </main>
    </AnimatedPage>
  );
};

export default MaintenancePage;
