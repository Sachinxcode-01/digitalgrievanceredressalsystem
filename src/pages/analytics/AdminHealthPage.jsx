import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Cpu, Database, Server, RefreshCw, AlertTriangle, Terminal, ArrowLeft, Clock, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { supabase } from '../../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminHealthPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([
    { name: '10m ago', latency: 45 },
    { name: '8m ago', latency: 38 },
    { name: '6m ago', latency: 52 },
    { name: '4m ago', latency: 41 },
    { name: '2m ago', latency: 35 },
    { name: 'Now', latency: 35 }
  ]);

  const fetchHealthMetrics = async () => {
    try {
      const res = await apiClient.get('/admin/health-metrics');
      setMetrics(res.data);
      
      // Update latency history with the new value
      if (res.data.database && res.data.database.latencyMs !== undefined) {
        setLatencyHistory(prev => {
          const next = [...prev.slice(1), { name: 'Now', latency: res.data.database.latencyMs }];
          // Fix labels
          return next.map((item, idx) => {
            const minutes = (5 - idx) * 2;
            return {
              ...item,
              name: minutes === 0 ? 'Now' : `${minutes}m ago`
            };
          });
        });
      }
      setError(false);
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
      setError(true);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const syncData = async () => {
    setLoading(true);
    await Promise.all([fetchHealthMetrics(), fetchAuditLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      syncData();
    }, 0);
    const interval = setInterval(() => {
      fetchHealthMetrics();
      fetchAuditLogs();
    }, 15000); // refresh every 15s

    // Subscribe to realtime audit logs inserts
    const channel = supabase
      .channel('health-audit-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setAuditLogs((prev) => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getSystemStatusLabel = () => {
    if (error) return 'TELEMETRY_UNAVAILABLE';
    if (!metrics) return 'SYNCING...';
    if (metrics.database.status === 'offline') return 'CRITICAL_OUTAGE';
    if (metrics.database.status === 'degraded' || parseFloat(metrics.system.memory.usagePercentage) > 90) return 'SYSTEM_DEGRADED';
    return 'SYSTEM_HEALTHY';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Outfit'] p-6 space-y-8 pt-20">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <Server className="text-indigo-500 w-8 h-8" /> Server Health & Telemetry
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Enterprise Kernel Diagnostics and Real-time load analysis.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={syncData}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sync Telemetry</span>
          </button>
          
          <div className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${
            getSystemStatusLabel() === 'SYSTEM_HEALTHY' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5' :
            getSystemStatusLabel() === 'SYSTEM_DEGRADED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              getSystemStatusLabel() === 'SYSTEM_HEALTHY' ? 'bg-emerald-400' :
              getSystemStatusLabel() === 'SYSTEM_DEGRADED' ? 'bg-amber-400' : 'bg-rose-500'
            }`} />
            {getSystemStatusLabel()}
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertTriangle className="text-rose-500 w-12 h-12 animate-bounce" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Failed to Reach Diagnostics Kernel</h3>
          <p className="text-slate-400 text-xs max-w-md">The telemetry service could not extract metrics. Ensure the backend server is running and your administrative clearance is active.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hardware Load Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CPU Load Card */}
              <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-widest">CPU LOAD AVERAGE</span>
                  <Cpu size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-black text-white">
                    {metrics ? `${metrics.system.cpu.usagePercentage}%` : '---'}
                  </h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
                    Cores: {metrics ? metrics.system.cpu.cores : '---'} | Load: {metrics ? metrics.system.cpu.loadAverage[0].toFixed(2) : '---'}
                  </p>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: metrics ? `${Math.min(100, parseFloat(metrics.system.cpu.usagePercentage))}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Memory Card */}
              <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-widest">RAM UTILIZATION</span>
                  <Activity size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-black text-white">
                    {metrics ? `${metrics.system.memory.usagePercentage}%` : '---'}
                  </h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
                    {metrics ? `${(metrics.system.memory.used / (1024 * 1024 * 1024)).toFixed(2)} GB` : '---'} / {metrics ? `${(metrics.system.memory.total / (1024 * 1024 * 1024)).toFixed(2)} GB` : '---'}
                  </p>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: metrics ? `${metrics.system.memory.usagePercentage}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Database Status Card */}
              <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-widest">DATABASE HEALTH</span>
                  <Database size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className={`text-3xl font-heading font-black uppercase ${
                    metrics && metrics.database.status === 'online' ? 'text-emerald-400' : 'text-rose-500'
                  }`}>
                    {metrics ? metrics.database.status : '---'}
                  </h2>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
                    Ping Latency: {metrics ? `${metrics.database.latencyMs}ms` : '---'}
                  </p>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics && metrics.database.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: metrics && metrics.database.status === 'online' ? '100%' : '0%' }}
                  />
                </div>
              </div>

            </div>

            {/* Performance charts */}
            <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <BarChart2 size={14} className="text-primary" /> Database Query Latency Trend
                </h3>
                <span className="text-[9px] text-slate-500 font-mono">Telemetry interval: 15s</span>
              </div>
              
              <div className="h-60 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyHistory}>
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4361ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#475569' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} labelStyle={{ fontSize: 9, color: '#94a3b8' }} itemStyle={{ fontSize: 11, color: '#f8fafc' }} />
                    <Area type="monotone" dataKey="latency" stroke="#4361ee" strokeWidth={2} fillOpacity={1} fill="url(#latencyGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Integrations Health Status */}
            <div className="glass-card p-6 rounded-[24px] border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" /> Integrated Subsystems SLA
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <IntegrationItem 
                  name="Google Gemini API" 
                  status={metrics ? metrics.integrations.gemini : '---'} 
                  detail="Flash-1.5 AI triage classifier"
                />
                <IntegrationItem 
                  name="SMS Dispatcher Gate" 
                  status={metrics ? metrics.integrations.smsGateway : '---'} 
                  detail="MFA OTP transmission gateway"
                />
                <IntegrationItem 
                  name="SMTP Mailer Node" 
                  status={metrics ? metrics.integrations.smtp : '---'} 
                  detail="Verification & status communications"
                />
              </div>
            </div>

          </div>

          {/* Audit Logs and Session Telemetry Column */}
          <div className="space-y-6">
            
            {/* Database Stats overview */}
            <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <Database size={14} className="text-indigo-400" /> Database Registry Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Active Sessions</span>
                  <span className="text-2xl font-heading font-black text-white">
                    {metrics ? metrics.database.activeSessions : '---'}
                  </span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Total Grievances</span>
                  <span className="text-2xl font-heading font-black text-white">
                    {metrics ? metrics.database.totalGrievances : '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* System audit log stream */}
            <div className="glass-card p-6 rounded-[24px] border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Terminal size={14} className="text-primary" /> Live Audit Log Feed
                </h3>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-4">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    const logAction = log.action || log.event || 'Unknown';
                    const logDetails = log.details || {};
                    const logEmail = logDetails.user_email || log.user_email || 'System';
                    
                    return (
                      <div key={log.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-left space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-wider">{logAction}</span>
                          <span className="text-[8px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock size={10} /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium truncate">User: {logEmail}</p>
                        <p className="text-[8px] text-slate-600 font-mono">IP: {log.ip_address}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    Awaiting audit log feed...
                  </div>
                )}
              </div>
            </div>

            {/* System Info Block */}
            <div className="p-5 glass-card border-white/5 rounded-[24px] text-[10px] text-slate-500 tracking-widest leading-relaxed">
              <p className="mb-3 uppercase font-black text-white tracking-[0.2em]">Diagnostic Kernel Spec</p>
              <div className="space-y-2">
                <p>OS Platform: <span className="text-slate-300 font-bold">{metrics ? `${metrics.system.platform} (${metrics.system.arch})` : '---'}</span></p>
                <p>Node Run Period: <span className="text-slate-300 font-bold">{metrics ? `${(metrics.system.nodeUptime / 3600).toFixed(2)} Hrs` : '---'}</span></p>
                <p>Host Uptime: <span className="text-slate-300 font-bold">{metrics ? `${(metrics.system.uptime / 3600).toFixed(2)} Hrs` : '---'}</span></p>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

const IntegrationItem = ({ name, status, detail }) => {
  const isOnline = status === 'online' || status === 'mock_fallback';
  
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{name}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
      </div>
      <p className="text-[9px] text-slate-500">{detail}</p>
      <span className={`inline-block text-[8px] font-mono uppercase mt-1 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
        {status}
      </span>
    </div>
  );
};
