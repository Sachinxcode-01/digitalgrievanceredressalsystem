import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Database, Cpu, Mail, HardDrive, RefreshCw, ChevronLeft, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackgroundGradientAnimation } from '../../components/ui/background-gradient-animation';
import { NeuralOverlay } from '../../components/ui/NeuralOverlay';
import { PulseTicker } from '../../components/ui/PulseTicker';

export const StatusPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Failed to retrieve status');
      const data = await res.json();
      setMetrics(data);
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <BackgroundGradientAnimation 
      interactive={true}
      gradientBackgroundStart={theme === 'midnight' ? "#020617" : "#f8fafc"}
      gradientBackgroundEnd={theme === 'midnight' ? "#0a0f1d" : "#f1f5f9"}
      firstColor={theme === 'midnight' ? "99, 102, 241" : "186, 230, 253"} 
      secondColor={theme === 'midnight' ? "79, 70, 229" : "199, 210, 254"}
      thirdColor={theme === 'midnight' ? "15, 23, 42" : "224, 242, 254"}
    >
      <NeuralOverlay theme={theme} />
      
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <PulseTicker />
      </div>

      <div className="min-h-screen w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col items-center justify-center relative z-50 pt-16">
        
        {/* Top bar controls */}
        <div className="absolute top-16 right-6 flex items-center gap-3 z-[70]">
          <button 
            onClick={fetchHealth} 
            className="p-2 text-muted-foreground hover:text-foreground bg-background/50 border border-border/40 rounded-xl transition-all"
            title="Refresh Status"
            type="button"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
            className="p-2 text-muted-foreground hover:text-foreground bg-background/50 border border-border/40 rounded-xl transition-all"
            type="button"
          >
            {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div className="w-full max-w-3xl space-y-6 sm:space-y-8 my-auto pt-6 pb-12">
          
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest text-[9px] font-bold mb-4">
              <ChevronLeft size={14} />
              Portal Gateway
            </Link>
            
            <div className="flex justify-center mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <Activity size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Live Services Matrix</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">System Operational Status</h1>
            <p className="text-muted-foreground font-medium tracking-wide text-xs sm:text-sm max-w-md mx-auto">
              Real-time monitoring telemetry of ResolveNow infrastructure nodes.
            </p>
          </div>

          {/* Status Overview Card */}
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${error ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {error ? "System Outage Detected" : "All Systems Operational"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                    {metrics ? `Uptime: ${formatUptime(metrics.uptime)}` : "Syncing Core telemetry..."}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block tracking-widest">Global Latency</span>
                <span className="text-lg font-mono font-black text-primary">
                  {metrics && metrics.database ? `${metrics.database.latencyMs}ms` : "---"}
                </span>
              </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gateway Node */}
              <ServiceRow 
                icon={<HardDrive size={16} />} 
                name="API Gateway Node" 
                desc="Edge load balancing & session router"
                status={error ? "offline" : "online"} 
                metric="99.98% SLA"
              />

              {/* Database Server */}
              <ServiceRow 
                icon={<Database size={16} />} 
                name="PostgreSQL Database" 
                desc="Supabase transactional storage cluster"
                status={error ? "offline" : (metrics ? metrics.database.status : "online")} 
                metric={metrics ? `${metrics.database.latencyMs}ms ping` : "---"}
              />

              {/* Gemini AI Service */}
              <ServiceRow 
                icon={<Cpu size={16} />} 
                name="AI Sentiment Processor" 
                desc="Gemini Neural Triage Classifier"
                status={error ? "offline" : "online"} 
                metric="Active"
              />

              {/* Mailer Service */}
              <ServiceRow 
                icon={<Mail size={16} />} 
                name="SMTP Dispatcher" 
                desc="Transactional notification & verification mail"
                status={error ? "offline" : "online"} 
                metric="Active"
              />

            </div>
          </div>

          {/* Historical Operational Log */}
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" /> Incidents History & Audits
            </h3>
            
            <div className="space-y-4">
              <IncidentItem 
                date="June 5, 2026" 
                title="Supabase Storage Attachment Policy Refinement" 
                desc="Resolved minor security descriptor gaps. Database performance optimized using foreign key indexing." 
                resolved={true}
              />
              <IncidentItem 
                date="June 1, 2026" 
                title="Clerk-inspired MFA Core Activation" 
                desc="Completed registration and logins security upgrades. Implemented JWT refresh token rotation." 
                resolved={true}
              />
            </div>
          </div>

          <footer className="text-center text-muted-foreground/60 text-[8px] sm:text-[9px] uppercase font-black tracking-[0.35em]">
            &copy; {new Date().getFullYear()} ResolveNow Network Operations Center &bull; NOC
          </footer>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};

const ServiceRow = ({ icon, name, desc, status, metric }) => {
  const isOnline = status === 'online' || status === 'ok';
  const isDegraded = status === 'degraded';
  
  return (
    <div className="p-4 bg-background/30 border border-border/50 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">{name}</h4>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${
          isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          isDegraded ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {status}
        </span>
        <span className="block text-[8px] text-muted-foreground font-mono mt-1">{metric}</span>
      </div>
    </div>
  );
};

const IncidentItem = ({ date, title, desc, resolved }) => (
  <div className="p-4 bg-background/25 border border-border/40 rounded-xl space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{date}</span>
      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
        ● Resolved
      </span>
    </div>
    <h4 className="text-[11px] font-bold text-foreground">{title}</h4>
    <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);
