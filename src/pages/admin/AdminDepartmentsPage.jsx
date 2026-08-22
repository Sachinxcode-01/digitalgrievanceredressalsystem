import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Edit2, Trash2, X, Search, Users, Ticket,
  Clock, CheckCircle2, AlertTriangle, Loader2, ChevronDown, Save,
  BarChart3, TrendingUp, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { grievanceService } from '../../services/grievanceService';
import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// ─── Helpers ────────────────────────────────────────────────────────────────
const SLA_COLORS = { good: 'text-emerald-400', warning: 'text-amber-400', critical: 'text-rose-400' };
const slaColor = (rate) => rate >= 80 ? SLA_COLORS.good : rate >= 60 ? SLA_COLORS.warning : SLA_COLORS.critical;

const EMPTY_FORM = { name: '', description: '', head_officer_email: '', sla_hours: 48 };

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatChip = ({ icon: Icon, label, value, color = 'text-foreground' }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
    <Icon size={12} className={color} />
    <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
    <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
  </div>
);

// ─── Department Row ───────────────────────────────────────────────────────────
const DeptRow = ({ dept, tickets, onEdit, onDelete }) => {
  const deptTickets = tickets.filter(
    t => (t.department || '').toLowerCase() === (dept.name || '').toLowerCase()
  );
  const open = deptTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length;
  const resolved = deptTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const slaRate = deptTickets.length
    ? Math.round((resolved / deptTickets.length) * 100)
    : 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-surface/60 border border-border/60 hover:border-primary-bright/20 transition-all group"
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary-bright/10 border border-primary-bright/15 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-primary-bright" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{dept.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{dept.description || 'No description'}</p>
          {dept.head_officer_email && (
            <p className="text-[10px] font-mono text-indigo-400 truncate mt-0.5">
              Head: {dept.head_officer_email}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-2">
        <StatChip icon={Ticket} label="Total" value={deptTickets.length} />
        <StatChip icon={Clock} label="Open" value={open} color={open > 0 ? 'text-amber-400' : 'text-foreground'} />
        <StatChip icon={CheckCircle2} label="Resolved" value={resolved} color="text-emerald-400" />
        <StatChip
          icon={Shield}
          label="SLA"
          value={`${slaRate}%`}
          color={slaColor(slaRate)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(dept)}
          className="p-2 rounded-lg text-muted-foreground hover:text-primary-bright hover:bg-primary-bright/10 transition-colors"
          title="Edit department"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(dept)}
          className="p-2 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete department"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Department Form Modal ───────────────────────────────────────────────────
const DeptModal = ({ dept, onClose, onSave, saving }) => {
  const [form, setForm] = useState(dept ? { ...dept } : { ...EMPTY_FORM });

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-foreground">
            {dept ? 'Edit Department' : 'Add Department'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/40">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Academic Affairs"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description of this department's responsibilities..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Head Officer Email
            </label>
            <input
              type="email"
              value={form.head_officer_email}
              onChange={e => handleChange('head_officer_email', e.target.value)}
              placeholder="officer@institution.edu"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              SLA Hours (default: 48)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={form.sla_hours}
              onChange={e => handleChange('sla_hours', parseInt(e.target.value, 10) || 48)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary-bright focus:ring-1 focus:ring-primary-bright/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>
          <AnimatedButton
            onClick={() => onSave(form)}
            variant="primary"
            size="sm"
            isLoading={saving}
            leftIcon={Save}
            disabled={!form.name.trim() || saving}
          >
            {dept ? 'Save Changes' : 'Create Department'}
          </AnimatedButton>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const AdminDepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, ticketData] = await Promise.allSettled([
        apiClient.get('/admin/departments'),
        grievanceService.getAll()
      ]);

      if (deptRes.status === 'fulfilled') {
        setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
      } else {
        // Fallback: derive departments from ticket categories
        const ticketDepts = ticketData.status === 'fulfilled'
          ? [...new Set((ticketData.value || []).map(t => t.department).filter(Boolean))]
              .map(name => ({ id: name, name, description: '', head_officer_email: '', sla_hours: 48 }))
          : [];
        setDepartments(ticketDepts);
      }

      if (ticketData.status === 'fulfilled') {
        setTickets(Array.isArray(ticketData.value) ? ticketData.value : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = departments.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (form) => {
    if (!form.name.trim()) { toast.error('Department name is required.'); return; }
    setSaving(true);
    try {
      if (editingDept?.id) {
        await apiClient.put(`/admin/departments/${editingDept.id}`, form);
        toast.success('Department updated.');
      } else {
        await apiClient.post('/admin/departments', form);
        toast.success('Department created.');
      }
      setShowModal(false);
      setEditingDept(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/departments/${dept.id}`);
      toast.success('Department removed.');
      setDepartments(prev => prev.filter(d => d.id !== dept.id));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete department.');
    }
  };

  // Summary stats
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length;
  const slaBreached = tickets.filter(t => {
    const slaTarget = t.sla_due_at || t.due_date;
    if (!slaTarget) return false;
    return new Date(slaTarget) < new Date() && !['Resolved', 'Closed'].includes(t.status);
  }).length;

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-heading font-black text-foreground flex items-center gap-2.5">
              <Building2 size={20} className="text-primary-bright" />
              Departments
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage institutional departments, officers, and SLA configuration.
            </p>
          </div>
          <AnimatedButton
            onClick={() => { setEditingDept(null); setShowModal(true); }}
            variant="primary"
            size="sm"
            leftIcon={Plus}
          >
            Add Department
          </AnimatedButton>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Departments', value: departments.length, icon: Building2, color: 'text-primary-bright' },
            { label: 'Total Tickets', value: totalTickets, icon: Ticket, color: 'text-indigo-400' },
            { label: 'Open Tickets', value: openTickets, icon: Clock, color: 'text-amber-400' },
            { label: 'SLA Breached', value: slaBreached, icon: AlertTriangle, color: 'text-rose-400' },
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

        {/* Search + Table */}
        <GlassPanel className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary-bright transition-all"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              title="Refresh"
            >
              <TrendingUp size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <LoadingSkeleton key={i} className="h-18 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Building2 size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'No departments match your search.' : 'No departments yet. Add the first one.'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map(dept => (
                  <DeptRow
                    key={dept.id || dept.name}
                    dept={dept}
                    tickets={tickets}
                    onEdit={d => { setEditingDept(d); setShowModal(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </GlassPanel>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <DeptModal
            dept={editingDept}
            onClose={() => { setShowModal(false); setEditingDept(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
};

export default AdminDepartmentsPage;
