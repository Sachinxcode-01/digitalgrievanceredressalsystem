import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Ticket, Clock, AlertTriangle, TrendingUp, Search, 
  X, CheckCircle2, Download, Shield, ShieldAlert, Zap, Sparkles, 
  Activity, ChevronRight, ChevronLeft, FileDown, Loader2,
  BarChart3, RefreshCw, UserCheck, Layers, FileText,
  LogOut
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import { reportService } from '../../services/reportService';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import SlaRiskBadge from '../../components/ui/SlaRiskBadge';
import ResolutionVelocityChart from '../../components/charts/ResolutionVelocityChart';
import GrievanceWorkflowTimeline from '../../components/grievances/GrievanceWorkflowTimeline';
import SmartTriageAssistant from '../../components/ai/SmartTriageAssistant';
import PredictiveSlaIntelligenceModal from '../../components/analytics/PredictiveSlaIntelligenceModal';

import AnimatedPage from '../../components/ui/AnimatedPage';
import CounterCard from '../../components/ui/CounterCard';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ExecutiveHealthSummaryCard from '../../components/ui/ExecutiveHealthSummaryCard';

export const AdminDashboard = ({ sessionUser, userProfile, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Search & Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [timeHorizon, setTimeHorizon] = useState('all'); // '7d', '30d', 'all'

  // Modals & Drawers
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPredictiveSlaModal, setShowPredictiveSlaModal] = useState(false);

  // Form States
  const [reassignOfficer, setReassignOfficer] = useState('');
  const [reassignDept, setReassignDept] = useState('');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useRealtimeConnection(() => {
    fetchGlobalData();
  });

  async function fetchGlobalData() {
    setLoading(true);
    try {
      const isDemo = sessionUser?.id?.startsWith('demo-');
      const ticketsData = isDemo 
        ? await grievanceService.getAll()
        : (await apiClient.get('/grievances')).data;
      if (Array.isArray(ticketsData)) setTickets(ticketsData);

      try {
        const usersRes = await apiClient.get('/admin/users');
        if (Array.isArray(usersRes.data)) setUsers(usersRes.data);
      } catch { /* non-critical enrichment — silently skip */ }

      try {
        const deptRes = await apiClient.get('/admin/departments');
        if (Array.isArray(deptRes.data)) setDepartments(deptRes.data);
      } catch { /* non-critical enrichment — silently skip */ }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGlobalData();

    const channel = supabase
      .channel('global-admin-grievances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
            toast.info(`New Grievance #${payload.new.ticket_id} filed.`);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
            setSelectedTicket((curr) => curr && curr.id === payload.new.id ? payload.new : curr);
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter tickets by selected time scope for KPI cards and velocity charts
  const timeFilteredTickets = tickets.filter(t => {
    if (timeHorizon === 'all') return true;
    const ticketDate = new Date(t.created_at || Date.now());
    const cutoff = new Date();
    if (timeHorizon === '7d') cutoff.setDate(cutoff.getDate() - 7);
    else if (timeHorizon === '30d') cutoff.setDate(cutoff.getDate() - 30);
    return ticketDate >= cutoff;
  });

  const totalCount = timeFilteredTickets.length;
  const pendingCount = timeFilteredTickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
  const inProgressCount = timeFilteredTickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const resolvedCount = timeFilteredTickets.filter(t => t.status === 'Resolved').length;
  const closedCount = timeFilteredTickets.filter(t => t.status === 'Closed').length;
  const escalatedCount = timeFilteredTickets.filter(t => t.status === 'Escalated').length;

  const overdueCount = timeFilteredTickets.filter(t => {
    if (['Resolved', 'Closed', 'Rejected'].includes(t.status)) return false;
    const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
    return dueAt < new Date();
  }).length;

  const slaCompliance = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;

  const deptMap = {};
  timeFilteredTickets.forEach(t => {
    const dept = t.department || t.category || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const departmentChartData = Object.keys(deptMap).map(d => ({
    department: d,
    count: deptMap[d]
  }));

  const categoryMap = {};
  timeFilteredTickets.forEach(t => {
    const cat = t.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryPieData = Object.keys(categoryMap).map(c => ({
    name: c,
    value: categoryMap[c]
  }));

  const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const filteredTickets = tickets.filter(t => {
    const matchesQuery = 
      (t.ticket_id && t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || t.urgency === priorityFilter;
    const matchesDept = departmentFilter === 'All' || t.department === departmentFilter || t.category === departmentFilter;

    return matchesQuery && matchesStatus && matchesCategory && matchesPriority && matchesDept;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      await grievanceService.assign(selectedTicket.id, reassignOfficer || 'Dept Officer', reassignDept || selectedTicket.category);
      toast.success(`Ticket #${selectedTicket.ticket_id} reassigned.`);
      setShowReassignModal(false);
      fetchGlobalData();
    } catch (err) {
      toast.error('Reassignment failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      await grievanceService.updateStatus(selectedTicket.id, newStatus, resolutionNotes);
      toast.success(`Ticket #${selectedTicket.ticket_id} updated to ${newStatus}.`);
      setShowStatusModal(false);
      setResolutionNotes('');
      fetchGlobalData();
    } catch (err) {
      toast.error('Status update failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTriggerEscalation = async (t) => {
    try {
      await grievanceService.escalate(t.id, 'Manual Admin Escalation Trigger');
      toast.success(`Ticket #${t.ticket_id} escalated.`);
      fetchGlobalData();
    } catch (err) {
      toast.error('Escalation failed.');
    }
  };

  return (
    <AnimatedPage className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Bar */}
      <GlassPanel className="p-5" intensity="heavy">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-black text-white uppercase tracking-tight">
                  Enterprise Command Center
                </h2>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Administrator Node: {sessionUser?.email || 'admin@resolvenow.demo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1 max-w-2xl">
            <div className="relative bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 flex-1 min-w-50">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text"
                placeholder="Search Ticket ID, Subject, Student Email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
              />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select 
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchGlobalData}
              className="p-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={() => setShowPredictiveSlaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Zap size={14} className="text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Predictive SLA Radar</span>
            </button>

            <AnimatedButton
              variant="glow"
              size="sm"
              leftIcon={FileDown}
              onClick={() => setShowExportModal(true)}
            >
              Reports
            </AnimatedButton>
          </div>
        </div>
      </GlassPanel>

      {/* 2. Executive At-A-Glance Cockpit & CSAT Sentiment */}
      <ExecutiveHealthSummaryCard tickets={timeFilteredTickets} departments={departments} />

      {/* Scope Horizon Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-3 px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-indigo-400" />
          <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">Metrics Scope:</span>
          <span className="text-[11px] font-mono text-slate-400">
            {timeHorizon === '7d' ? 'Past 7 Days' : timeHorizon === '30d' ? 'Past 30 Days' : 'All Recorded History'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 w-full sm:w-auto justify-center">
          {[
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: 'all', label: 'All Time' }
          ].map(h => (
            <button
              key={h.id}
              onClick={() => setTimeHorizon(h.id)}
              className={`px-3.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeHorizon === h.id 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <CounterCard title="Total Complaints" value={totalCount} icon={Ticket} iconColor="text-indigo-400" />
        <CounterCard title="Pending Queue" value={pendingCount} icon={Clock} iconColor="text-amber-400" />
        <CounterCard title="In Progress" value={inProgressCount} icon={TrendingUp} iconColor="text-cyan-400" />
        <CounterCard title="Resolved & Closed" value={resolvedCount + closedCount} icon={CheckCircle2} iconColor="text-emerald-400" />
        <CounterCard title="Escalated" value={escalatedCount} icon={AlertTriangle} iconColor="text-rose-400" />
        <CounterCard title="SLA Overdue" value={overdueCount} icon={ShieldAlert} iconColor="text-red-500" />
      </div>

      {/* 4. Resolution Velocity & Analytics Grid */}
      <ResolutionVelocityChart tickets={timeFilteredTickets} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <GlassPanel className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-indigo-400" size={18} />
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Departmental Complaint Load
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-900 px-2.5 py-1 rounded-md border border-white/10">
              Live Feed
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Grievances" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="text-cyan-400" size={18} />
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Sector Breakdown
              </h3>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">SLA Compliance Rate</span>
            <span className="font-bold text-emerald-400 font-mono">{slaCompliance}%</span>
          </div>
        </GlassPanel>
      </div>

      {/* 4. Table */}
      <GlassPanel className="p-0 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              Administrative Master Registry
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredTickets.length} grievance records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AnimatedButton
              variant="secondary"
              size="xs"
              leftIcon={Download}
              onClick={() => reportService.exportToCsv(filteredTickets)}
            >
              Export CSV
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="xs"
              leftIcon={FileText}
              onClick={() => reportService.exportToExcel(filteredTickets)}
            >
              Export Excel
            </AnimatedButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold border-b border-white/10">
                <th className="px-6 py-3.5">Ticket ID</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">SLA Risk</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12">
                    <LoadingSkeleton variant="list" count={5} />
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 italic">
                    No grievance records match the selected filters.
                  </td>
                </tr>
              ) : (
                currentTickets.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => setSelectedTicket(t)}
                    className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedTicket?.id === t.id ? 'bg-indigo-500/10' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                      #{t.ticket_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-white max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {t.category}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {t.department || t.category}
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={t.urgency} />
                    </td>
                    <td className="px-6 py-4">
                      <SlaRiskBadge createdAt={t.created_at} slaDueAt={t.sla_due_at} status={t.status} compact={true} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setShowReassignModal(true); }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="Reassign Officer/Dept"
                      >
                        <UserCheck size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setShowStatusModal(true); }}
                        className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all"
                        title="Update Workflow Status"
                      >
                        <TrendingUp size={14} />
                      </button>
                      {t.status !== 'Escalated' && t.status !== 'Resolved' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleTriggerEscalation(t); }}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                          title="Trigger Escalation"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-white/10 rounded-lg hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-white/10 rounded-lg hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <MotionCard className="max-w-lg w-full p-6 md:p-8 space-y-6" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileDown className="text-indigo-400" size={20} />
                  <h3 className="text-lg font-heading font-black text-white uppercase">
                    Generate Executive Reports
                  </h3>
                </div>
                <button onClick={() => setShowExportModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { reportService.exportToPdfSummary(filteredTickets, { status: statusFilter, category: categoryFilter, priority: priorityFilter }); setShowExportModal(false); }}
                  className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-left transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Executive PDF Report Dossier</p>
                    <p className="text-[10px] text-slate-400">Includes KPI charts and department statistics.</p>
                  </div>
                  <FileText className="text-indigo-400" size={20} />
                </button>

                <button 
                  onClick={() => { reportService.exportToCsv(filteredTickets); setShowExportModal(false); }}
                  className="p-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-850 text-left transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Standard CSV Data Export</p>
                    <p className="text-[10px] text-slate-400">Raw comma-separated dataset.</p>
                  </div>
                  <Download className="text-slate-400" size={20} />
                </button>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <AnimatedButton variant="secondary" size="sm" onClick={() => setShowExportModal(false)}>
                  Close
                </AnimatedButton>
              </div>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

      {/* Reassign Modal */}
      <AnimatePresence>
        {showReassignModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <MotionCard className="max-w-md w-full p-6 space-y-4" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-heading font-black uppercase text-white">
                  Reassign Ticket #{selectedTicket.ticket_id}
                </h3>
                <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleReassignSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Target Department</label>
                  <select 
                    value={reassignDept}
                    onChange={(e) => setReassignDept(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">Select Department...</option>
                    <option value="IT Support">IT Support & Campus Wi-Fi</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                    <option value="Financial Services">Financial Services</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Assigned Officer</label>
                  <input 
                    type="text"
                    placeholder="Officer Name / ID..."
                    value={reassignOfficer}
                    onChange={(e) => setReassignOfficer(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <AnimatedButton type="button" variant="secondary" size="sm" onClick={() => setShowReassignModal(false)}>
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton type="submit" variant="glow" size="sm" isLoading={isUpdating} leftIcon={UserCheck}>
                    Confirm Reassignment
                  </AnimatedButton>
                </div>
              </form>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <MotionCard className="max-w-md w-full p-6 space-y-4" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-heading font-black uppercase text-white">
                  Update Status — #{selectedTicket.ticket_id}
                </h3>
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">New Workflow State</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <SmartTriageAssistant 
                  title={selectedTicket.title}
                  description={selectedTicket.description}
                  category={selectedTicket.category}
                  urgency={selectedTicket.urgency}
                  onApplyResolution={(draftText) => setResolutionNotes(draftText)}
                />

                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Resolution / Audit Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter official resolution details or status notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <AnimatedButton type="button" variant="secondary" size="sm" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton type="submit" variant="glow" size="sm" isLoading={isUpdating} leftIcon={TrendingUp}>
                    Update Status
                  </AnimatedButton>
                </div>
              </form>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Details & Timeline Drawer Modal */}
      <AnimatePresence>
        {selectedTicket && !showReassignModal && !showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <MotionCard className="max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">#{selectedTicket.ticket_id}</span>
                    <UrgencyBadge level={selectedTicket.urgency} />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mt-1">
                    {selectedTicket.title}
                  </h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10">
                  <p className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Description</p>
                  <p className="leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {selectedTicket.description || 'No detailed text description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Category</p>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.category || 'General'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Department</p>
                    <p className="font-bold text-white mt-0.5">{selectedTicket.department || 'Nodal Authority'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Submitted By</p>
                    <p className="font-bold text-white mt-0.5 truncate">{selectedTicket.email || selectedTicket.user_name || 'Student'}</p>
                  </div>
                </div>

                <GrievanceWorkflowTimeline ticket={selectedTicket} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    variant="secondary"
                    size="xs"
                    leftIcon={UserCheck}
                    onClick={() => setShowReassignModal(true)}
                  >
                    Reassign Officer
                  </AnimatedButton>
                  <AnimatedButton
                    variant="glow"
                    size="xs"
                    leftIcon={TrendingUp}
                    onClick={() => setShowStatusModal(true)}
                  >
                    Update Status
                  </AnimatedButton>
                </div>
                <AnimatedButton variant="secondary" size="xs" onClick={() => setSelectedTicket(null)}>
                  Close
                </AnimatedButton>
              </div>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

      {/* Predictive SLA Breach Intelligence Radar Modal */}
      <PredictiveSlaIntelligenceModal
        isOpen={showPredictiveSlaModal}
        onClose={() => setShowPredictiveSlaModal(false)}
        tickets={tickets}
        onTicketSelect={(t) => {
          const match = tickets.find(ticket => ticket.id === t.id || ticket.ticket_id === t.ticket_id);
          if (match) setSelectedTicket(match);
        }}
      />

    </AnimatedPage>
  );
};

export default AdminDashboard;
