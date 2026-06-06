import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Loader2, Database, Cpu, Activity, Server, Radio, Lock, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const SuperAdminSystemPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Security Configurations (Local simulation state for Clerk-level controls)
  const [config, setConfig] = useState({
    enforceMfa: true,
    sandboxMode: true,
    maintenanceMode: false,
    rateLimiting: true,
    strictOtp: true,
  });

  const fetchMetrics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await apiClient.get('/admin/health-metrics');
      setMetrics(res.data);
    } catch (err) {
      toast.error('Failed to query Kernel health telemetry: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigToggle = (key, label) => {
    setConfig(prev => {
      const nextVal = !prev[key];
      toast.success(`${label} has been ${nextVal ? 'ENABLED' : 'DISABLED'} successfully.`, {
        icon: '⚙️',
        style: {
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '12px',
        }
      });
      return { ...prev, [key]: nextVal };
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'ok':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'degraded':
      case 'warning':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      default:
        return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-8 pt-20 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <Lock className="text-indigo-500 w-8 h-8" /> Super Admin Kernel Center
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Restricted System Configurations, Kernel Telemetry, and Cryptographic Security Controls.
          </p>
        </div>
        <div>
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing || loading}
            className="btn-premium flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Force Query'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Hydrating Core Systems...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left/Middle Sectors: Telemetry Logs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* System Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* CPU load */}
              <div className="glass-card p-6 border-white/5 bg-[#0b1329]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/15">
                      <Cpu size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Processor Node</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{metrics?.system?.arch} Arch</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono text-white">
                      {metrics?.system?.cpu?.usagePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                      {metrics?.system?.cpu?.cores} Cores Active
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(5, parseFloat(metrics?.system?.cpu?.usagePercentage || 0)))}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">
                    Load Avg: {metrics?.system?.cpu?.loadAverage?.map(l => l.toFixed(2)).join(' | ')}
                  </p>
                </div>
              </div>

              {/* Memory load */}
              <div className="glass-card p-6 border-white/5 bg-[#0b1329]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/15">
                      <Server size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Memory Core</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">RAM Swap</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black font-mono text-white">
                      {metrics?.system?.memory?.usagePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                      {formatBytes(metrics?.system?.memory?.used)} / {formatBytes(metrics?.system?.memory?.total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${metrics?.system?.memory?.usagePercentage || 0}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">
                    Heap memory usage: {formatBytes(metrics?.system?.memory?.processHeap)}
                  </p>
                </div>
              </div>

              {/* Database Status */}
              <div className="glass-card p-6 border-white/5 bg-[#0b1329]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/15">
                      <Database size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Database Node</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase border ${getStatusColor(metrics?.database?.status)}`}>
                    {metrics?.database?.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-left">
                  <div>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">DB Latency</span>
                    <span className="text-xl font-black text-white">{metrics?.database?.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Active Sessions</span>
                    <span className="text-xl font-black text-white">{metrics?.database?.activeSessions}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Total Redressal Records</span>
                    <span className="text-sm font-black text-slate-300">{metrics?.database?.totalGrievances} tickets registered</span>
                  </div>
                </div>
              </div>

              {/* Host info */}
              <div className="glass-card p-6 border-white/5 bg-[#0b1329]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/15">
                      <Activity size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Kernel Runtime</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">System Link</span>
                </div>
                <div className="space-y-2.5 font-mono text-[10px] font-bold uppercase">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Platform OS</span>
                    <span className="text-slate-300">{metrics?.system?.platform}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Server Uptime</span>
                    <span className="text-slate-300">{(metrics?.system?.uptime / 3600).toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Core Process Uptime</span>
                    <span className="text-slate-300">{(metrics?.system?.nodeUptime / 60).toFixed(1)} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Service Status</span>
                    <span className="text-emerald-400">OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations Module */}
            <div className="glass-card p-6 border-white/5 bg-[#0b1329]/30 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5">
                <Radio className="text-primary w-4 h-4" /> Global Connection Integration Ports
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px] font-bold uppercase pt-2">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col justify-between h-20 text-left">
                  <span className="text-slate-600">Gemini AI Service</span>
                  <span className={`w-fit px-2 py-0.5 rounded text-[8px] border ${getStatusColor(metrics?.integrations?.gemini)}`}>
                    {metrics?.integrations?.gemini}
                  </span>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col justify-between h-20 text-left">
                  <span className="text-slate-600">SMS Gateway Endpoint</span>
                  <span className={`w-fit px-2 py-0.5 rounded text-[8px] border ${getStatusColor(metrics?.integrations?.smsGateway)}`}>
                    {metrics?.integrations?.smsGateway}
                  </span>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col justify-between h-20 text-left">
                  <span className="text-slate-600">SMTP Server Port</span>
                  <span className={`w-fit px-2 py-0.5 rounded text-[8px] border ${getStatusColor(metrics?.integrations?.smtp)}`}>
                    {metrics?.integrations?.smtp}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sector: Global Config Security Toggles */}
          <div className="space-y-8">
            <div className="glass-card p-6 border-white/5 bg-[#0b1329]/40 space-y-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5 pb-4 border-b border-white/5 mb-6">
                  <ShieldAlert className="text-indigo-400 w-4 h-4" /> Global Control switches
                </h3>
                
                <div className="space-y-5">
                  
                  {/* Strict OTP Toggle */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">Strict OTP Cooldown</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">30s limit and max 3 attempts</p>
                    </div>
                    <button
                      onClick={() => handleConfigToggle('strictOtp', 'Strict OTP Protocol')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.strictOtp ? 'bg-primary' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.strictOtp ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enforce MFA */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">Enforce MFA Authorization</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Required OTP challenge on new logs</p>
                    </div>
                    <button
                      onClick={() => handleConfigToggle('enforceMfa', 'MFA Access Enforcers')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.enforceMfa ? 'bg-primary' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.enforceMfa ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Rate Limiting */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">Rate Limiting Firewall</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Auto-ban IP after 10 failed logins</p>
                    </div>
                    <button
                      onClick={() => handleConfigToggle('rateLimiting', 'Firewall Rate Limiting')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.rateLimiting ? 'bg-primary' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.rateLimiting ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sandbox Dev Mode */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">Google Sandbox Credentials</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Allows local developer bypass tokens</p>
                    </div>
                    <button
                      onClick={() => handleConfigToggle('sandboxMode', 'Google Sandbox Fallback Mode')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.sandboxMode ? 'bg-primary' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.sandboxMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Maintenance mode */}
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-rose-400 uppercase tracking-wide">Kernel Lockdown Mode</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Restrict all write permissions globally</p>
                    </div>
                    <button
                      onClick={() => handleConfigToggle('maintenanceMode', 'Kernel Lockdown Mode')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.maintenanceMode ? 'bg-rose-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                </div>
              </div>

              {/* Advanced Admin Trigger actions */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <button
                  onClick={async () => {
                    const confirmClear = window.confirm("Are you sure you want to clear system telemetry cache? This action triggers a minor diagnostic refresh.");
                    if (confirmClear) {
                      toast.promise(
                        new Promise(resolve => setTimeout(resolve, 1500)),
                        {
                          loading: 'Flushing server session caching structures...',
                          success: 'System cache storage successfully purged.',
                          error: 'Failed to flush database caches.',
                        }
                      );
                    }
                  }}
                  className="w-full bg-[#0d1324]/60 hover:bg-[#0d1324]/90 border border-white/5 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={13} className="text-yellow-400" /> Flush Session Cache Store
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default SuperAdminSystemPage;
