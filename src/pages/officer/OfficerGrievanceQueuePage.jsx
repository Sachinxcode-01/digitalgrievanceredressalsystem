import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Download, 
  ShieldCheck, 
  Building2, 
  CheckSquare, 
  Square, 
  Flame, 
  RefreshCw,
  Filter,
  User,
  MessageSquare,
  Sparkles,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { grievanceService } from '../../services/grievanceService';
import { supabase } from '../../lib/supabase';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import SlaCountdownTimer from '../../components/grievances/SlaCountdownTimer';
import toast from 'react-hot-toast';

export const OfficerGrievanceQueuePage = ({ user, sessionUser }) => {
  const currentUser = user || sessionUser;
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState('all'); // all, urgent, active, resolved, breached
  
  // Multi-select & Batch Actions State
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchQueueTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getAll();
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load officer queue:', err);
      toast.error('Could not load officer department queue.');
    } finally {
      setLoading(false);
    }
  };

  useRealtimeConnection(() => {
    fetchQueueTickets();
  });

  useEffect(() => {
    fetchQueueTickets();

    const channel = supabase
      .channel('officer-queue-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev.filter(t => t.id !== payload.new.id)]);
            toast.success(`New ticket assigned: #${payload.new.ticket_id || payload.new.id.slice(0, 8)}`);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
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

  // Filter queue based on department, active tab, and search
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // If user has a department assigned, prioritize department matching
      const userDept = currentUser?.department;
      const matchesDept = !userDept || userDept === 'All' || ticket.category === userDept || ticket.department === userDept;

      // Category filter
      const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;

      // Search matching
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (ticket.title && ticket.title.toLowerCase().includes(q)) ||
        (ticket.ticket_id && ticket.ticket_id.toLowerCase().includes(q)) ||
        (ticket.id && ticket.id.toLowerCase().includes(q)) ||
        (ticket.category && ticket.category.toLowerCase().includes(q)) ||
        (ticket.submitted_by_name && ticket.submitted_by_name.toLowerCase().includes(q));

      // Queue tab filter
      let matchesTab = true;
      const status = (ticket.status || '').toLowerCase();
      const isUrgent = (ticket.priority || ticket.urgency || '').toLowerCase() === 'high' || (ticket.priority || ticket.urgency || '').toLowerCase() === 'critical';
      const isResolved = status === 'resolved' || status === 'closed';

      if (activeQueue === 'urgent') {
        matchesTab = isUrgent && !isResolved;
      } else if (activeQueue === 'active') {
        matchesTab = status === 'in_progress' || status === 'under_review' || status === 'investigating';
      } else if (activeQueue === 'resolved') {
        matchesTab = isResolved;
      } else if (activeQueue === 'breached') {
        const isBreached = ticket.sla_breached || (ticket.sla_due_date && new Date(ticket.sla_due_date) < new Date() && !isResolved);
        matchesTab = isBreached;
      }

      return matchesDept && matchesCategory && matchesSearch && matchesTab;
    });
  }, [tickets, currentUser, categoryFilter, searchTerm, activeQueue]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedTicketIds.length === paginatedTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(paginatedTickets.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedTicketIds((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedTicketIds.length === 0) return;
    setBatchUpdating(true);
    try {
      await Promise.all(
        selectedTicketIds.map((id) => grievanceService.updateStatus(id, newStatus))
      );
      toast.success(`Updated ${selectedTicketIds.length} tickets to "${newStatus.replace('_', ' ')}"`);
      setSelectedTicketIds([]);
      fetchQueueTickets();
    } catch (err) {
      toast.error('Failed to perform batch update.');
    } finally {
      setBatchUpdating(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error('No tickets in queue to export.');
      return;
    }
    const headers = ['Ticket ID', 'Title', 'Category', 'Status', 'Urgency', 'Created At', 'SLA Due Date'];
    const rows = filteredTickets.map((t) => [
      `"${t.ticket_id || t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.status || ''}"`,
      `"${t.priority || t.urgency || ''}"`,
      `"${t.created_at || ''}"`,
      `"${t.sla_due_date || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Officer_Queue_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Department queue CSV exported successfully.');
  };

  return (
    <div className="space-y-6 text-foreground font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              Department Triage Queue
            </span>
            {currentUser?.department && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border/40">
                {currentUser.department}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
            Officer Grievance Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Direct investigative intake, fast status updates, and SLA compliance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQueueTickets}
            disabled={loading}
            className="p-2 rounded-xl border border-border/60 bg-surface-elevated hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh queue"
            type="button"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-border/60 bg-surface-elevated hover:bg-surface text-xs font-bold font-mono text-foreground flex items-center gap-2 transition-colors shadow-xs"
            type="button"
          >
            <Download size={14} className="text-indigo-400" />
            Export Queue
          </button>
        </div>
      </div>

      {/* Queue Filter Tabs & Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'all', label: 'All Assigned', count: tickets.length, color: 'text-foreground' },
          { 
            id: 'urgent', 
            label: 'High / Critical', 
            count: tickets.filter(t => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'resolved').length,
            color: 'text-rose-400' 
          },
          { 
            id: 'active', 
            label: 'In Progress', 
            count: tickets.filter(t => t.status === 'in_progress' || t.status === 'under_review').length,
            color: 'text-indigo-400' 
          },
          { 
            id: 'breached', 
            label: 'SLA Breached', 
            count: tickets.filter(t => t.sla_breached && t.status !== 'resolved').length,
            color: 'text-amber-400' 
          },
          { 
            id: 'resolved', 
            label: 'Resolved', 
            count: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            color: 'text-emerald-400' 
          },
        ].map((tab) => {
          const isActive = activeQueue === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveQueue(tab.id); setCurrentPage(1); }}
              type="button"
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive 
                  ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30' 
                  : 'bg-surface-elevated/50 border-border/60 hover:bg-surface-elevated'
              }`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {tab.label}
              </span>
              <span className={`text-xl font-heading font-black mt-1 ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Bulk Action Strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-surface-elevated/60 border border-border/60">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search tickets, IDs, or citizen names..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface/80 border border-border text-foreground placeholder:text-muted-foreground/60 text-xs focus:outline-hidden focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Batch Actions when Selected */}
        {selectedTicketIds.length > 0 ? (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {selectedTicketIds.length} Selected
            </span>
            <button
              onClick={() => handleBatchStatusUpdate('in_progress')}
              disabled={batchUpdating}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('resolved')}
              disabled={batchUpdating}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
            >
              Mark Resolved
            </button>
            <button
              onClick={() => setSelectedTicketIds([])}
              type="button"
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>Showing {filteredTickets.length} tickets in queue</span>
          </div>
        )}
      </div>

      {/* Main Queue Table */}
      <div className="rounded-2xl bg-surface-elevated/70 border border-border/70 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 size={32} className="animate-spin mx-auto text-indigo-400" />
            <p className="text-xs font-mono text-muted-foreground">Synchronizing officer triage matrix...</p>
          </div>
        ) : paginatedTickets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400/80" />
            <h3 className="text-base font-bold text-foreground">Officer Queue Clear</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No tickets found matching the selected filter criteria. All departmental grievances are up to date!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="p-3.5 w-10 text-center">
                    <button onClick={handleSelectAll} type="button" className="text-muted-foreground hover:text-foreground">
                      {selectedTicketIds.length === paginatedTickets.length && paginatedTickets.length > 0 ? (
                        <CheckSquare size={16} className="text-indigo-400" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Ticket & Narrative</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Urgency & SLA Risk</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {paginatedTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.includes(ticket.id);
                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-surface/50 transition-colors ${
                        isSelected ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(ticket.id)}
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 max-w-xs sm:max-w-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-xs font-sans truncate">
                              {ticket.title || 'Untitled Grievance'}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            #{ticket.ticket_id || ticket.id.slice(0, 8)} • By {ticket.submitted_by_name || 'Anonymous Citizen'}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5 font-sans">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface border border-border/50 text-foreground">
                          {ticket.category || 'General'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <UrgencyBadge urgency={ticket.priority || ticket.urgency || 'medium'} />
                          {ticket.sla_due_date && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              Due: {new Date(ticket.sla_due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-sans">
                        <StatusBadge status={ticket.status || 'pending'} />
                      </td>

                      <td className="p-3.5 text-[11px] text-muted-foreground">
                        {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }) : 'Recently'}
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          to={`/grievances/${ticket.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-xs font-bold transition-all"
                        >
                          <span>Investigate</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between gap-4 text-xs font-mono">
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                type="button"
                className="p-1.5 rounded-lg border border-border hover:bg-surface disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                type="button"
                className="p-1.5 rounded-lg border border-border hover:bg-surface disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default OfficerGrievanceQueuePage;
