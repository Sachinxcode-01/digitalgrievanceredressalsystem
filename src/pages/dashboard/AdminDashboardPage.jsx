import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Search, 
  X, CheckCircle2, Download, Shield, ShieldAlert, Lock, Zap, Sparkles, 
  ShieldCheck, Activity, Cpu, Terminal, MapPin, Send, ChevronRight, 
  ChevronLeft, ArrowRight, Radio, FileDown, Loader2, MessageSquare,
  BarChart3, RefreshCw, Bell, Filter, UserCheck, Layers, FileText,
  Building, Award, LogOut, Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import { reportService } from '../../services/reportService';
import { CommandChat } from '../../components/ai/CommandChat';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import { logSecurityEvent } from '../../lib/auditLogger';

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

  // Modals & Drawers
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Reassignment & Status Update Form State
  const [reassignOfficer, setReassignOfficer] = useState('');
  const [reassignDept, setReassignDept] = useState('');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time Connection
  const { isSystemHealthy } = useRealtimeConnection(() => {
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
      } catch {}

      try {
        const deptRes = await apiClient.get('/admin/departments');
        if (Array.isArray(deptRes.data)) setDepartments(deptRes.data);
      } catch {}
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

  // --- STATS & KPI CALCULATIONS ---
  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;

  const overdueCount = tickets.filter(t => {
    if (['Resolved', 'Closed', 'Rejected'].includes(t.status)) return false;
    const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
    return dueAt < new Date();
  }).length;

  const slaCompliance = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;

  // Recharts Data
  const deptMap = {};
  tickets.forEach(t => {
    const dept = t.department || t.category || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const departmentChartData = Object.keys(deptMap).map(d => ({
    department: d,
    count: deptMap[d]
  }));

  const categoryMap = {};
  tickets.forEach(t => {
    const cat = t.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryPieData = Object.keys(categoryMap).map(c => ({
    name: c,
    value: categoryMap[c]
  }));

  const PIE_COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const trendData = [
    { month: 'Feb', filed: Math.max(2, totalCount - 6), resolved: Math.max(1, resolvedCount - 4) },
    { month: 'Mar', filed: Math.max(3, totalCount - 4), resolved: Math.max(2, resolvedCount - 3) },
    { month: 'Apr', filed: Math.max(4, totalCount - 3), resolved: Math.max(2, resolvedCount - 2) },
    { month: 'May', filed: Math.max(3, totalCount - 1), resolved: Math.max(3, resolvedCount - 1) },
    { month: 'Jun', filed: Math.max(5, totalCount), resolved: Math.max(4, resolvedCount) },
    { month: 'Jul', filed: totalCount, resolved: resolvedCount }
  ];

  // Filtering Logic
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

  // Ticket Reassignment Action
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      await grievanceService.assign(selectedTicket.id, reassignOfficer || 'Dept Officer', reassignDept || selectedTicket.category);
      toast.success(`Ticket #${selectedTicket.ticket_id} reassigned to ${reassignDept || 'Department'}.`);
      setShowReassignModal(false);
      fetchGlobalData();
    } catch (err) {
      toast.error('Reassignment failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Ticket Status Update Action
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

  // Trigger Ticket Escalation Action
  const handleTriggerEscalation = async (t) => {
    try {
      await grievanceService.escalate(t.id, 'Manual Admin Escalation Trigger');
      toast.success(`Ticket #${t.ticket_id} escalated to Senior clearance.`);
      fetchGlobalData();
    } catch (err) {
      toast.error('Escalation failed.');
    }
  };

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. TOP ENTERPRISE CONTROLLER BAR */}
      <div className="bg-surface/90 backdrop-blur-xl border border-border/80 rounded-3xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-black text-xl shadow-md">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                Enterprise Command Center
              </h2>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Administrator Node: {sessionUser?.email || 'admin@resolvenow.demo'}
            </p>
          </div>
        </div>

        {/* Center: Global Controller Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 max-w-2xl">
          <div className="relative bg-background border border-border rounded-xl px-3 py-2 flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search Ticket ID, Subject, Student Email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/50 w-full"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none cursor-pointer"
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
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchGlobalData}
            className="p-2.5 bg-background border border-border hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>

          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <FileDown size={14} />
            <span>Generate Reports</span>
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm cursor-pointer"
            >
              {(sessionUser?.fullName || sessionUser?.email || 'A')[0].toUpperCase()}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1"
                >
                  <div className="p-2.5 border-b border-border/60">
                    <p className="font-bold text-foreground truncate">{sessionUser?.fullName || 'Administrator'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{sessionUser?.email}</p>
                  </div>
                  <a href="/profile" className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-foreground font-medium">
                    <Shield size={14} fill="currentColor" /> Profile Settings
                  </a>
                  <a href="/admin/roles" className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-foreground font-medium">
                    <Users size={14} /> Roles & Governance
                  </a>
                  <a href="/admin/audit" className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg text-foreground font-medium">
                    <Activity size={14} /> Security Audit Logs
                  </a>
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 p-2 hover:bg-error/10 text-error rounded-lg font-bold cursor-pointer text-left"
                  >
                    <LogOut size={14} /> Sign Out Node
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 2. 3D GLASSMORPHIC KPI METRICS CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Complaints', value: totalCount, icon: Ticket, tone: 'border-primary/30 bg-primary/5 text-primary' },
          { label: 'Pending Queue', value: pendingCount, icon: Clock, tone: 'border-amber-500/30 bg-amber-500/5 text-amber-500' },
          { label: 'In Progress', value: inProgressCount, icon: TrendingUp, tone: 'border-blue-400/30 bg-blue-400/5 text-blue-400' },
          { label: 'Resolved & Closed', value: resolvedCount + closedCount, icon: CheckCircle2, tone: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' },
          { label: 'Escalated', value: escalatedCount, icon: AlertTriangle, tone: 'border-rose-500/30 bg-rose-500/5 text-rose-500' },
          { label: 'SLA Overdue', value: overdueCount, icon: ShieldAlert, tone: 'border-red-600/30 bg-red-600/5 text-red-600' }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div 
              key={kpi.label}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`p-4 rounded-2xl border shadow-sm backdrop-blur-md flex flex-col justify-between space-y-2 ${kpi.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                <Icon size={16} />
              </div>
              <p className="text-2xl md:text-3xl font-heading font-black text-foreground">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE RECHARTS VISUALIZATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department-wise Grievance Distribution */}
        <div className="lg:col-span-2 bg-surface border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-primary" size={18} />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
                Department-wise Complaint Load
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-background px-2.5 py-1 rounded-md border border-border">
              Real-time Analytics
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Grievances" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sector Pie Chart */}
        <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="text-accent" size={18} />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
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
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">SLA Compliance Rate</span>
            <span className="font-bold text-emerald-400 font-mono">{slaCompliance}%</span>
          </div>
        </div>
      </div>

      {/* 4. MASTER GRIEVANCE MANAGEMENT TABLE */}
      <div className="bg-surface border border-border/80 rounded-2xl shadow-sm overflow-hidden text-left">
        
        <div className="p-5 border-b border-border/60 bg-background/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
              Administrative Master Registry
            </h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredTickets.length} grievance records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => reportService.exportToCsv(filteredTickets)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={() => reportService.exportToExcel(filteredTickets)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={13} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-background/60 text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                <th className="px-6 py-3.5">Ticket ID</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                    Syncing administrative records...
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground italic">
                    No grievance records match the selected filters.
                  </td>
                </tr>
              ) : (
                currentTickets.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => setSelectedTicket(t)}
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedTicket?.id === t.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      #{t.ticket_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {t.category}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {t.department || t.category}
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={t.urgency} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setShowReassignModal(true); }}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Reassign Officer/Dept"
                      >
                        <UserCheck size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); setShowStatusModal(true); }}
                        className="p-1.5 hover:bg-primary/10 text-primary rounded transition-all cursor-pointer"
                        title="Update Workflow Status"
                      >
                        <TrendingUp size={14} />
                      </button>
                      {t.status !== 'Escalated' && t.status !== 'Resolved' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleTriggerEscalation(t); }}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded transition-all cursor-pointer"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. REPORT EXPORT MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <FileDown className="text-primary" size={20} />
                  <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                    Generate Executive Reports
                  </h3>
                </div>
                <button onClick={() => setShowExportModal(false)} className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Select output format to download certified operational reports filtered by current active dataset ({filteredTickets.length} records).
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { reportService.exportToPdfSummary(filteredTickets, { status: statusFilter, category: categoryFilter, priority: priorityFilter }); setShowExportModal(false); }}
                  className="p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Executive PDF Report Dossier</p>
                    <p className="text-[10px] text-muted-foreground">Includes KPI charts, department statistics, and ticket audit tables.</p>
                  </div>
                  <FileText className="text-primary group-hover:scale-110 transition-transform" size={20} />
                </button>

                <button 
                  onClick={() => { reportService.exportToCsv(filteredTickets); setShowExportModal(false); }}
                  className="p-4 rounded-2xl border border-border bg-background hover:bg-muted text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Standard CSV Data Export</p>
                    <p className="text-[10px] text-muted-foreground">Raw comma-separated dataset suitable for data analysis.</p>
                  </div>
                  <Download className="text-muted-foreground group-hover:scale-110 transition-transform" size={20} />
                </button>

                <button 
                  onClick={() => { reportService.exportToExcel(filteredTickets); setShowExportModal(false); }}
                  className="p-4 rounded-2xl border border-border bg-background hover:bg-muted text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Microsoft Excel Summary Spreadsheet</p>
                    <p className="text-[10px] text-muted-foreground">Formatted tab-delimited workbook with UTF-8 encoding.</p>
                  </div>
                  <FileText className="text-emerald-400 group-hover:scale-110 transition-transform" size={20} />
                </button>
              </div>

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <button onClick={() => setShowExportModal(false)} className="px-4 py-2 bg-muted text-xs font-bold rounded-xl text-foreground cursor-pointer">
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. REASSIGNMENT MODAL */}
      <AnimatePresence>
        {showReassignModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-heading font-black uppercase text-foreground">
                  Reassign Ticket #{selectedTicket.ticket_id}
                </h3>
                <button onClick={() => setShowReassignModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleReassignSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Target Department</label>
                  <select 
                    value={reassignDept}
                    onChange={(e) => setReassignDept(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
                  >
                    <option value="">Select Department...</option>
                    <option value="IT Support">IT Support & Campus Wi-Fi</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                    <option value="Financial Services">Financial Services</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Assigned Officer</label>
                  <input 
                    type="text"
                    placeholder="Officer Name / ID..."
                    value={reassignOfficer}
                    onChange={(e) => setReassignOfficer(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <button type="button" onClick={() => setShowReassignModal(false)} className="px-4 py-2 bg-muted text-xs font-bold rounded-xl cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                    {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    <span>Confirm Reassignment</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. UPDATE STATUS MODAL */}
      <AnimatePresence>
        {showStatusModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-heading font-black uppercase text-foreground">
                  Update Status — #{selectedTicket.ticket_id}
                </h3>
                <button onClick={() => setShowStatusModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">New Workflow State</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Resolution / Audit Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter official resolution details or status notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <button type="button" onClick={() => setShowStatusModal(false)} className="px-4 py-2 bg-muted text-xs font-bold rounded-xl cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                    {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
                    <span>Update Status</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
