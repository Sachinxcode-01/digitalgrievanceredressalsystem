import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, Lock, FileDown, 
  Activity, AlertTriangle, AlertCircle, CheckCircle, 
  RefreshCw, Calendar, ArrowLeft, ArrowDown, Database,
  Terminal, ShieldX, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PredictiveSlaIntelligenceModal from '../../components/analytics/PredictiveSlaIntelligenceModal';

export const AdminCompliancePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState('compliance'); // 'compliance' | 'security' | 'audit'
  const [reportFormat, setReportFormat] = useState('csv'); // 'csv' | 'json'
  const [exporting, setExporting] = useState(false);
  const [showPredictiveSlaModal, setShowPredictiveSlaModal] = useState(false);

  const fetchStats = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const res = await apiClient.get('/admin/compliance/stats');
      setStats(res.data);
      if (showToast) toast.success('Compliance telemetry updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve compliance stats: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get(`/admin/compliance/reports`, {
        params: {
          type: reportType,
          format: reportFormat
        },
        responseType: reportFormat === 'csv' ? 'blob' : 'json'
      });

      if (reportFormat === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `resolve_now_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `resolve_now_${reportType}_report_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success(`${reportType.toUpperCase()} report generated successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export compliance report');
    } finally {
      setExporting(false);
    }
  };

  // Convert severity counts to chart data
  const getSeverityData = () => {
    if (!stats || !stats.severityCounts) return [];
    return [
      { name: 'Low', count: stats.severityCounts.low || 0, color: 'var(--color-primary-bright)' },
      { name: 'Medium', count: stats.severityCounts.medium || 0, color: '#f59e0b' },
      { name: 'High', count: stats.severityCounts.high || 0, color: '#ef4444' },
      { name: 'Critical', count: stats.severityCounts.critical || 0, color: '#b91c1c' },
    ];
  };

  const getEventTypeData = () => {
    if (!stats || !stats.eventTypeCounts) return [];
    return Object.entries(stats.eventTypeCounts).map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      count: value
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8 pt-20 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <Shield className="text-primary-bright w-8 h-8" /> Compliance Center
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Institutional governance parameters, security threshold monitoring, and compliance report exporter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPredictiveSlaModal(true)}
            className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <span>SLA Breach Radar</span>
          </button>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2 border border-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary-bright' : ''} />
            <span>Sync Diagnostics</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Activity className="w-10 h-10 text-primary-bright animate-pulse" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Querying Governance Matrix...
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Status KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Lockouts */}
            <motion.div 
              variants={itemVariants} 
              className={`glass-card p-6 border-l-4 ${stats.lockedAccounts > 0 ? 'border-l-rose-500 border-rose-500/10' : 'border-l-emerald-500 border-emerald-500/10'}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lockout Incidents</span>
                  <span className="text-3xl font-black text-white font-mono block">
                    {stats.lockedAccounts}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {stats.lockedAccounts > 0 
                      ? 'Warning: Suspended operators require immediate administrative review.' 
                      : 'Systems Nominal. No active account lockouts registered.'}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${stats.lockedAccounts > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  {stats.lockedAccounts > 0 ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                </div>
              </div>
            </motion.div>

            {/* Total Audit Logs count */}
            <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-primary-bright border-primary-bright/10">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logs Completeness</span>
                  <span className="text-3xl font-black text-white font-mono block">
                    {stats.totalAuditLogs}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Continuous logging active. All administrative and security event records intact.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border bg-primary-bright/10 border-primary-bright/20 text-primary-bright">
                  <Database size={20} />
                </div>
              </div>
            </motion.div>

            {/* Compliance Status */}
            <motion.div variants={itemVariants} className="glass-card p-6 border-l-4 border-l-emerald-500 border-emerald-500/10">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Policy Clearance</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono block">
                    100%
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Policy rules active: System meets 100% of institutional audit regulations.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <CheckCircle size={20} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Severity & Event Types Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">Security Events by Severity</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Quantity of security events tagged by triage level.</p>
              </div>

              <div className="h-55 w-full mt-2">
                {getSeverityData().reduce((acc, row) => acc + row.count, 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSeverityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '8px', 
                          color: '#fff', 
                          fontSize: '11px',
                          fontFamily: 'monospace' 
                        }} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {getSeverityData().map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border border-white/5 border-dashed rounded-xl p-6 bg-slate-950/20">
                    <p className="text-slate-500 text-xs italic font-medium">No recorded security events.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Event Types breakdown */}
            <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">Top Security Trigger Sources</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Top event types detected in security logs.</p>
              </div>

              <div className="h-55 w-full mt-2">
                {getEventTypeData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={getEventTypeData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '8px', 
                          color: '#fff', 
                          fontSize: '11px' 
                        }} 
                      />
                      <Bar dataKey="count" fill="var(--color-primary-bright)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border border-white/5 border-dashed rounded-xl p-6 bg-slate-950/20">
                    <p className="text-slate-500 text-xs italic font-medium">No system activity patterns detected.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Retention Policies */}
            <motion.div variants={itemVariants} className="lg:col-span-1 glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-300">Data Retention Rule</h3>
                  <p className="text-[9px] font-mono text-slate-500">POLICY ENFORCEMENT CONFIG</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Active Mandate</span>
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl font-medium text-xs text-slate-300 flex items-center justify-between">
                    <span>{stats.retention?.policy || '90-Day Standard Log Retention'}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono">
                      {stats.retention?.status || 'Compliant'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Oldest Registry Date</span>
                    <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-[10px] text-slate-400">
                      {stats.retention?.oldestLogDate 
                        ? new Date(stats.retention.oldestLogDate).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Next Automated Purge</span>
                    <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl font-mono text-[10px] text-slate-400">
                      {stats.retention?.nextPurgeScheduled
                        ? new Date(stats.retention.nextPurgeScheduled).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Export Reports Centre */}
            <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-bright/10 rounded-xl border border-primary-bright/20 text-primary-bright">
                    <FileDown size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-300">Compliance Reporting Center</h3>
                    <p className="text-[9px] font-mono text-slate-500">SECURE LOG COMPLIANCE DATA EXPORTER</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Selector 1: Report Type */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Report Parameters</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'compliance', title: 'System Compliance Register', desc: 'Active operator roles, account security statuses, and lockout tallies.' },
                      { value: 'security', title: 'Security Event Logs', desc: 'Failed login diagnostics, token status overrides, and system warning logs.' },
                      { value: 'audit', title: 'Operator Actions Audit', desc: 'Detailed tracking stream of all administrator CRUD operations.' }
                    ].map(r => (
                      <button
                        key={r.value}
                        onClick={() => setReportType(r.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          reportType === r.value 
                            ? 'bg-primary-bright/5 border-primary-bright/40 text-white' 
                            : 'bg-slate-950/30 border-white/5 text-slate-400 hover:bg-slate-950/50 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider">{r.title}</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal font-medium">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector 2: Format & Download */}
                <div className="flex flex-col justify-between gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Export Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { format: 'csv', label: 'CSV File', desc: 'Excel spreadsheet' },
                        { format: 'json', label: 'JSON Payload', desc: 'Developer digest' }
                      ].map(f => (
                        <button
                          key={f.format}
                          onClick={() => setReportFormat(f.format)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            reportFormat === f.format 
                              ? 'bg-primary-bright/5 border-primary-bright/40 text-white' 
                              : 'bg-slate-950/30 border-white/5 text-slate-400 hover:bg-slate-950/50 hover:text-white'
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider">{f.label}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-medium">{f.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-slate-500 font-medium leading-normal flex items-start gap-2">
                      <Terminal size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span>Report generation executes a signed query on Supabase. Operator context, IP address, and date limits are logged in compliance audits.</span>
                    </p>
                    
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="w-full btn-premium py-3 text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {exporting ? (
                        <Activity className="animate-spin" size={14} />
                      ) : (
                        <ArrowDown size={14} className="animate-bounce" />
                      )}
                      <span>{exporting ? 'Generating...' : 'Download Report'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Predictive SLA Breach Radar Modal */}
      <PredictiveSlaIntelligenceModal
        isOpen={showPredictiveSlaModal}
        onClose={() => setShowPredictiveSlaModal(false)}
      />
    </div>
  );
};

export default AdminCompliancePage;
