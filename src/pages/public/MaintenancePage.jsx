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
  ExternalLink,
  FileSearch,
  Sparkles,
  Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { useTheme } from '../../app/providers/ThemeProvider';

export const MaintenancePage = () => {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const { theme, toggleTheme } = useTheme();

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
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">

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
                <span>Telemetry Status</span>
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

          {/* Hero Maintenance Card */}
          <MotionCard 
            className="p-8 sm:p-12 text-center relative overflow-hidden"
            glow={true}
          >
            {/* Ambient amber glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Status Pill Badge */}
            <div className="relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Scheduled Institutional Maintenance</span>
            </div>

            {/* Central Wrench Graphic */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-24 h-24 rounded-3xl bg-slate-950/80 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
                <Wrench className="w-11 h-11 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
                <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest mt-1">UPGRADING</span>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white mt-4">
              System Upgrades in Progress
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-sans mt-3">
              The ResolveNow grievance cluster is undergoing scheduled infrastructure hardening, cryptographic ledger synchronization, and SLA engine optimization.
            </p>

            {/* Live Re-connection Probe Bar */}
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3.5">
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
                    Last heartbeat: {lastChecked ? lastChecked.toLocaleTimeString() : 'Checking node...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {isOnline ? (
                  <Link to="/" className="w-full sm:w-auto">
                    <AnimatedButton
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      <span>Return to Portal</span>
                    </AnimatedButton>
                  </Link>
                ) : (
                  <AnimatedButton
                    onClick={probeBackendHealth}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Probe Connectivity</span>
                  </AnimatedButton>
                )}
              </div>
            </div>
          </MotionCard>

          {/* Node Subsystems Health Matrix */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                Infrastructure Node Health Matrix
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Zero-Data-Loss Protected</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {systemNodes.map((node, i) => (
                <MotionCard 
                  key={i} 
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10">
                      <node.icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-heading font-bold text-white">{node.name}</h3>
                      <p className="text-[11px] font-mono text-slate-500">{node.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                    {node.status}
                  </span>
                </MotionCard>
              ))}
            </div>
          </div>

          {/* Emergency Helpdesk & SLA Guarantee Notice */}
          <MotionCard className="p-6 bg-indigo-950/30 border border-indigo-500/20 text-left space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldAlert size={16} />
              <span>Statutory SLA Assurance</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              All active SLA countdown timers for submitted complaints are securely frozen during maintenance periods. Resolution deadlines are automatically extended to match downtime, preventing unfair SLA penalties.
            </p>
            <div className="pt-3 border-t border-indigo-500/15 flex flex-wrap gap-5 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <Mail size={13} className="text-indigo-400" />
                Emergency Ops: <strong className="text-white">ops@resolvenow.gov.in</strong>
              </span>
              <span className="flex items-center gap-2">
                <PhoneCall size={13} className="text-indigo-400" />
                Hotline: <strong className="text-white">1800-REDRESS</strong>
              </span>
            </div>
          </MotionCard>

          {/* Return Button */}
          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              <span>Return to Landing Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default MaintenancePage;
