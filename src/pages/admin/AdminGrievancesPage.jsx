import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, AlertTriangle, Clock, CheckCircle, ArrowRight,
  ChevronLeft, ChevronRight, Loader2, Download, ShieldCheck, Landmark, CheckSquare, Square, Flame
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { grievanceService } from '../../services/grievanceService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import toast from 'react-hot-toast';

export const AdminGrievancesPage = ({ user, sessionUser }) => {
  const currentUser = user || sessionUser;
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState('all'); // all, assigned, escalated, resolved
  
  // Multi-select & Batch Actions State
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Search & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchGlobalTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getAll();
      setTickets(data || []);
    } catch (err) {
      toast.error('Could not load global grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalTickets();
  }, []);

  const getPriorityScore = (ticket) => {
    const urgencyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const ageInDays = (new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24);
    const frustrationBonus = (ticket.frustration_index || 1) * 0.5;
    return (urgencyMap[ticket.urgency] || 1) * (1 + ageInDays) + frustrationBonus;
  };

  // Filter queues
  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      // Search check
      const matchesSearch = 
        ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (ticket.location && ticket.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
      
      if (!matchesSearch || !matchesCategory) return false;

      // Queue checks
      if (activeQueue === 'assigned') {
        return ticket.assigned_to !== null && ticket.status !== 'Resolved';
      }
      if (activeQueue === 'escalated') {
        return ticket.escalated_at !== null && ticket.status !== 'Resolved';
      }
      if (activeQueue === 'petitions') {
        return (ticket.upvote_count >= 2 || ticket.is_petition_cluster) && ticket.status !== 'Resolved';
      }
      if (activeQueue === 'resolved') {
        return ticket.status === 'Resolved';
      }
      return true; // 'all'
    });
  };

  const filteredTickets = getFilteredTickets();
  const sortedTickets = [...filteredTickets].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);

  const handleExportCSV = () => {
    if (tickets.length === 0) return toast.error("No records to export.");
    const headers = ['Ticket ID', 'Title', 'Category', 'Urgency', 'Status', 'Department', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...tickets.map(t => [
        t.ticket_id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.urgency,
        t.status,
        t.department || 'General',
        new Date(t.created_at).toLocaleString()
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Registry_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV Registry exported.');
  };

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === currentTickets.length && currentTickets.length > 0) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(currentTickets.map(t => t.id));
    }
  };

  const toggleSelectTicket = (id, e) => {
    e.stopPropagation();
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedTicketIds.length === 0) return;
    setBatchUpdating(true);
    try {
      await Promise.all(
        selectedTicketIds.map(id => grievanceService.updateStatus(id, newStatus, `Batch updated to ${newStatus}`))
      );
      toast.success(`Updated ${selectedTicketIds.length} tickets to ${newStatus}.`);
      setSelectedTicketIds([]);
      fetchGlobalTickets();
    } catch {
      toast.error('Batch status update failed.');
    } finally {
      setBatchUpdating(false);
    }
  };

  const handleBatchExportSelected = () => {
    const selectedTickets = tickets.filter(t => selectedTicketIds.includes(t.id));
    if (selectedTickets.length === 0) return toast.error("No selected records.");
    const headers = ['Ticket ID', 'Title', 'Category', 'Urgency', 'Status', 'Department', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...selectedTickets.map(t => [
        t.ticket_id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.urgency,
        t.status,
        t.department || 'General',
        new Date(t.created_at).toLocaleString()
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Batch_Export_${selectedTickets.length}_Tickets.csv`;
    link.click();
    toast.success(`Exported ${selectedTickets.length} selected records.`);
  };

  // KPIs
  const allCount = tickets.length;
  const assignedCount = tickets.filter(t => t.assigned_to && t.status !== 'Resolved').length;
  const escalatedCount = tickets.filter(t => t.escalated_at && t.status !== 'Resolved').length;
  const petitionsCount = tickets.filter(t => (t.upvote_count >= 2 || t.is_petition_cluster) && t.status !== 'Resolved').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      
      {/* Header Area */}
      <div className="bg-surface border border-border/80 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-heading font-black text-foreground uppercase tracking-wider">Triage Registry Board</h1>
          <p className="text-xs text-muted-foreground font-medium font-sans">
            Manage, assign, escalate, and resolve citizen grievances in the system logs.
          </p>
        </div>
        <button 
          onClick={handleExportCSV} 
          className="btn-ghost flex items-center gap-1.5"
        >
          <Download size={14} />
          <span>Export Registry</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'All Grievances', count: allCount, color: 'border-l-primary-bright text-primary-bright', tabId: 'all' },
          { label: '🔥 Campus Petitions', count: petitionsCount, color: 'border-l-orange-500 text-orange-400', tabId: 'petitions' },
          { label: 'Assigned Review', count: assignedCount, color: 'border-l-secondary text-secondary', tabId: 'assigned' },
          { label: 'Escalated Warnings', count: escalatedCount, color: 'border-l-error text-error', tabId: 'escalated' },
          { label: 'Resolved Tickets', count: resolvedCount, color: 'border-l-success text-success', tabId: 'resolved' },
        ].map((kpi, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActiveQueue(kpi.tabId);
              setCurrentPage(1);
            }}
            className={`bg-surface border border-border/80 border-l-4 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:bg-muted/20 transition-all text-left ${kpi.color} ${activeQueue === kpi.tabId ? 'bg-muted/40 ring-1 ring-primary-bright/20' : ''}`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              {kpi.label}
            </span>
            <span className="text-2xl font-black">{kpi.count}</span>
          </button>
        ))}
      </div>

      {/* Grid Table Workspace */}
      <div className="bg-surface border border-border/80 rounded-xl shadow-xs overflow-hidden">
        
        {/* Table Filters Toolbar */}
        <div className="px-6 py-4 border-b border-border/60 bg-background/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative bg-background border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-2 w-full sm:w-64">
            <Search size={14} className="text-muted-foreground/60" />
            <input 
              type="text" 
              placeholder="Search ID/Subject/Coords..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="IT Support">IT Support</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Academic">Academic</option>
              <option value="Financial">Financial</option>
              <option value="Public Infrastructure">Public Infrastructure</option>
              <option value="Eco-Sustainability">Eco-Sustainability</option>
              <option value="Social Welfare">Social Welfare</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-background text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                <th className="pl-6 pr-2 py-3.5 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedTicketIds.length > 0 && selectedTicketIds.length === currentTickets.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Ticket ID</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Age Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-muted-foreground italic">
                    <Loader2 className="animate-spin text-primary-bright mx-auto mb-2" size={20} />
                    Syncing administrative indexes...
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-muted-foreground italic">
                    No tickets found in this queue.
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.includes(ticket.id);
                  return (
                    <tr 
                      key={ticket.id}
                      onClick={() => navigate(`/admin/grievances/${ticket.id}`)}
                      className={`hover:bg-muted/40 transition-colors cursor-pointer group ${isSelected ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td className="pl-6 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectTicket(ticket.id, e)}
                          className="rounded border-border bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-primary-bright">
                        {ticket.ticket_id}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-45">{ticket.title}</span>
                          {ticket.upvote_count >= 2 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase flex items-center gap-0.5 shrink-0" title={`${ticket.upvote_count} student endorsements`}>
                              <Flame size={10} />
                              {ticket.upvote_count}
                            </span>
                          )}
                          <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-primary-bright transition-all shrink-0" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 border border-border bg-background rounded-md text-[10px] text-foreground font-mono">
                          {ticket.department || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge level={ticket.urgency} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/60 bg-background/30 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredTickets.length} queue entries)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Batch Control Bar */}
      <AnimatePresence>
        {selectedTicketIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/90 border border-indigo-500/40 backdrop-blur-2xl px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 text-white text-xs font-bold"
          >
            <span className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
              <CheckSquare size={14} />
              <span>{selectedTicketIds.length} Selected</span>
            </span>

            <div className="h-4 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchStatusUpdate('In Progress')}
                disabled={batchUpdating}
                className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Set In Progress
              </button>

              <button
                onClick={() => handleBatchStatusUpdate('Under Review')}
                disabled={batchUpdating}
                className="px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Set Under Review
              </button>

              <button
                onClick={() => handleBatchStatusUpdate('Resolved')}
                disabled={batchUpdating}
                className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Mark Resolved
              </button>
            </div>

            <div className="h-4 w-px bg-white/20" />

            <button
              onClick={handleBatchExportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGrievancesPage;
