import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Search, Shield, ShieldOff, Plus, Edit2, X, Save,
  Loader2, Building2, Ticket, Clock, AlertTriangle, Mail,
  ChevronDown, Filter, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// ─── Constants ───────────────────────────────────────────────────────────────
const OFFICER_ROLES = ['officer', 'faculty', 'staff'];
const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'officer', department: '', status: 'active' };

// ─── Status badge ─────────────────────────────────────────────────────────────
const OfficerStatusBadge = ({ status }) => {
  const cfg = status === 'active'
    ? { label: 'Active', cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
    : { label: 'Inactive', cls: 'bg-rose-500/10 border-rose-500/20 text-rose-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase tracking-wider ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Officer Card ─────────────────────────────────────────────────────────────
const OfficerCard = ({ officer, ticketCount, onEdit, onToggleStatus, onViewActivity }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-surface/60 border border-border/60 hover:border-primary-bright/20 transition-all group"
  >
    {/* Avatar + Info */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-sm font-black text-indigo-400 shrink-0 uppercase">
        {(officer.full_name || officer.email || 'O').charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{officer.full_name || 'Officer'}</p>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{officer.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">{officer.role}</span>
          {officer.department && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[9px] font-mono text-muted-foreground">{officer.department}</span>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Stats & Workload Capacity Meter */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
      <div className="flex flex-col gap-1 w-32">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="text-muted-foreground uppercase font-bold">Capacity</span>
          <span className={`font-bold ${ticketCount >= 8 ? 'text-rose-400' : ticketCount >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {ticketCount}/10 Active
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              ticketCount >= 8 ? 'bg-rose-500' : ticketCount >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
            }`} 
            style={{ width: `${Math.min(100, (ticketCount / 10) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase tracking-wider ${
          ticketCount >= 8 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
            : ticketCount >= 5 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {ticketCount >= 8 ? 'SLA Alert' : ticketCount >= 5 ? 'Standard SLA' : '< 24h Fast'}
        </span>
        <OfficerStatusBadge status={officer.status || 'active'} />
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={() => onViewActivity(officer)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        title="View activity"
      >
        <Eye size={14} />
      </button>
      <button
        onClick={() => onEdit(officer)}
        className="p-2 rounded-lg text-muted-foreground hover:text-primary-bright hover:bg-primary-bright/10 transition-colors"
        title="Edit officer"
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={() => onToggleStatus(officer)}
        className={`p-2 rounded-lg transition-colors ${
          officer.status === 'active'
            ? 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
            : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
        }`}
        title={officer.status === 'active' ? 'Deactivate' : 'Activate'}
      >
        {officer.status === 'active' ? <ShieldOff size={14} /> : <Shield size={14} />}
      </button>
    </div>
  </motion.div>
);

// ─── Officer Form Modal ───────────────────────────────────────────────────────
const OfficerModal = ({ officer, departments, onClose, onSave, saving }) => {
  const [form, setForm] = useState(officer
    ? { fullName: officer.full_name || '', email: officer.email || '', password: '', role: officer.role || 'officer', department: officer.department || '', status: officer.status || 'active' }
    : { ...EMPTY_FORM }
  );
  const isEdit = !!officer;
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-foreground">{isEdit ? 'Edit Officer' : 'Add Officer'}</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-colors"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Full Name *</label>
              <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Dr. John Smith"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary-bright transition-all">
                <option value="officer">Officer</option>
                <option value="faculty">Faculty</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="officer@institution.edu"
              disabled={isEdit}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all disabled:opacity-50" />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all" />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Department</label>
            <select value={form.department} onChange={e => set('department', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary-bright transition-all">
              <option value="">— Unassigned —</option>
              {departments.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary-bright transition-all">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/40 transition-colors">Cancel</button>
          <AnimatedButton onClick={() => onSave(form)} variant="primary" size="sm" isLoading={saving} leftIcon={Save}
            disabled={!form.fullName.trim() || !form.email.trim() || (!isEdit && !form.password.trim()) || saving}>
            {isEdit ? 'Save Changes' : 'Add Officer'}
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const AdminOfficersPage = () => {
  const [officers, setOfficers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, ticketRes, deptRes] = await Promise.allSettled([
        apiClient.get('/admin/users'),
        import('../../services/grievanceService').then(m => m.grievanceService.getAll()),
        apiClient.get('/admin/departments')
      ]);

      if (usersRes.status === 'fulfilled') {
        const allUsers = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
        setOfficers(allUsers.filter(u => OFFICER_ROLES.includes((u.role || '').toLowerCase())));
      }
      if (ticketRes.status === 'fulfilled') setTickets(Array.isArray(ticketRes.value) ? ticketRes.value : []);
      if (deptRes.status === 'fulfilled') setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
    } catch {
      toast.error('Failed to load officer data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTicketCount = (officer) =>
    tickets.filter(t => t.assigned_to === officer.email || t.officer_email === officer.email).length;

  const filtered = officers.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (o.full_name || '').toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || o.department === deptFilter;
    const matchRole = roleFilter === 'All' || o.role === roleFilter;
    return matchSearch && matchDept && matchRole;
  });

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = { fullName: form.fullName, email: form.email, role: form.role, department: form.department, status: form.status };
      if (!editingOfficer) payload.password = form.password;

      if (editingOfficer?.id) {
        await apiClient.put(`/admin/users/${editingOfficer.id}`, payload);
        toast.success('Officer updated.');
      } else {
        await apiClient.post('/admin/users', { ...payload, role: form.role });
        toast.success('Officer added.');
      }
      setShowModal(false);
      setEditingOfficer(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save officer.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (officer) => {
    const newStatus = officer.status === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.put(`/admin/users/${officer.id}/status`, { status: newStatus });
      setOfficers(prev => prev.map(o => o.id === officer.id ? { ...o, status: newStatus } : o));
      toast.success(`Officer ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Failed to update officer status.');
    }
  };

  const handleViewActivity = async (officer) => {
    toast(`Viewing activity for ${officer.full_name || officer.email}`, { icon: '📋' });
  };

  // Summary
  const activeCount = officers.filter(o => o.status !== 'inactive').length;
  const uniqueDepts = [...new Set(officers.map(o => o.department).filter(Boolean))];

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-heading font-black text-foreground flex items-center gap-2.5">
              <UserCheck size={20} className="text-primary-bright" />
              Officers &amp; Staff
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage grievance officers, faculty, and staff assignments.
            </p>
          </div>
          <AnimatedButton onClick={() => { setEditingOfficer(null); setShowModal(true); }} variant="primary" size="sm" leftIcon={Plus}>
            Add Officer
          </AnimatedButton>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Officers', value: officers.length, icon: UserCheck, color: 'text-primary-bright' },
            { label: 'Active', value: activeCount, icon: Shield, color: 'text-emerald-400' },
            { label: 'Departments', value: uniqueDepts.length, icon: Building2, color: 'text-indigo-400' },
            { label: 'Tickets Handled', value: tickets.filter(t => t.assigned_to || t.officer_email).length, icon: Ticket, color: 'text-amber-400' },
          ].map(stat => (
            <GlassPanel key={stat.label} className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center ${stat.color}`}>
                <stat.icon size={16} />
              </div>
              <div>
                <p className="text-lg font-heading font-black text-foreground leading-none">{stat.value}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* Filters + List */}
        <GlassPanel className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search officers..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright transition-all" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-muted-foreground focus:outline-none focus:border-primary-bright transition-all">
              <option value="All">All Roles</option>
              {OFFICER_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-muted-foreground focus:outline-none focus:border-primary-bright transition-all">
              <option value="All">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={fetchData} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <LoadingSkeleton key={i} className="h-18 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <UserCheck size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'No officers match your search.' : 'No officers found. Add the first one.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map(officer => (
                  <OfficerCard
                    key={officer.id}
                    officer={officer}
                    ticketCount={getTicketCount(officer)}
                    onEdit={o => { setEditingOfficer(o); setShowModal(true); }}
                    onToggleStatus={handleToggleStatus}
                    onViewActivity={handleViewActivity}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-center text-[10px] font-mono text-muted-foreground pt-2">
              Showing {filtered.length} of {officers.length} officer{officers.length !== 1 ? 's' : ''}
            </p>
          )}
        </GlassPanel>
      </div>

      <AnimatePresence>
        {showModal && (
          <OfficerModal
            officer={editingOfficer}
            departments={departments}
            onClose={() => { setShowModal(false); setEditingOfficer(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
};

export default AdminOfficersPage;
