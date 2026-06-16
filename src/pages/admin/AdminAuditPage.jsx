import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Search, ArrowLeft, Loader2, Calendar, HardDrive, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [availableActions, setAvailableActions] = useState(['All']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter !== 'All') params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await apiClient.get('/admin/audit', { params });
      const logsData = res.data || [];
      setLogs(logsData);
      
      if (availableActions.length <= 1 && logsData.length > 0) {
        const actions = ['All', ...new Set(logsData.map(log => log.action))];
        setAvailableActions(actions);
      }
    } catch (err) {
      toast.error('Failed to retrieve firewall audit: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      return toast.error('No logs available to export.');
    }
    
    const headers = ['Timestamp', 'Action', 'Operator', 'IP Address', 'Details', 'User Agent'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.operatorName,
      log.ip_address || 'System',
      JSON.stringify(log.details || {}).replace(/"/g, '""'),
      (log.user_agent || '').replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
       
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit log CSV exported successfully!');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.operatorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip_address || '').includes(searchQuery) ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('LOCK') || action.includes('REVOKE') || action.includes('FAILED') || action.includes('DELETED')) {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
    if (action.includes('ROLE') || action.includes('UPDATE') || action.includes('PASSWORD_CHANGE')) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (action.includes('LOGIN') || action.includes('SUCCESS') || action.includes('VERIFY')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-8 pt-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <ShieldAlert className="text-rose-500 w-8 h-8" /> Security Firewall Audit
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Real-time security log registry of access controls, configuration changes, and session lifecycles.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-premium px-5 py-3 text-xs uppercase tracking-widest font-bold shrink-0 cursor-pointer rounded-xl bg-primary text-white border border-primary/20 hover:bg-primary/95 transition-all shadow-lg"
        >
          Export CSV Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operator, IP, details..."
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors font-medium"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-bold uppercase tracking-wider cursor-pointer h-[42px]"
          >
            {availableActions.map(act => (
              <option key={act} value={act}>
                {act === 'All' ? 'All Operations' : act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-medium h-[42px]"
          />
        </div>

        <div className="relative">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-medium h-[42px]"
          />
        </div>
      </div>

      {/* Logs Table/List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Parsing Security Stream...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
          No security logs matching search parameters.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-5 border-white/5 bg-[#0b1329]/30 hover:bg-[#0b1329]/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details Sector */}
                <div className="flex items-start gap-4 flex-grow min-w-0">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 shrink-0">
                    <Terminal size={16} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold tracking-wider ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold truncate uppercase tracking-wide">
                        {log.operatorName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        ({log.ip_address || 'Internal/System'})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono font-medium truncate max-w-2xl bg-slate-950/40 p-2 rounded border border-white/[0.02] text-left">
                      {log.details ? JSON.stringify(log.details) : 'No additional metadata payload.'}
                    </p>
                    {log.user_agent && (
                      <p className="text-[9px] text-slate-500 font-mono truncate max-w-2xl text-left">
                        {log.user_agent}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date/Time Sector */}
                <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2 font-mono text-[10px] text-slate-500 font-bold border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminAuditPage;
