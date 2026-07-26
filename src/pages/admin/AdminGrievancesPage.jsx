import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, AlertTriangle, Clock, CheckCircle, ArrowRight,
  ChevronLeft, ChevronRight, Loader2, Download, ShieldCheck, Landmark
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

  // KPIs
  const allCount = tickets.length;
  const assignedCount = tickets.filter(t => t.assigned_to !== null && t.status !== 'Resolved').length;
  const escalatedCount = tickets.filter(t => t.escalated_at !== null && t.status !== 'Resolved').length;
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'All Grievances', count: allCount, color: 'border-l-primary-bright text-primary-bright', tabId: 'all' },
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
                <th className="px-6 py-3.5">Ticket ID</th>
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
                  <td colSpan="7" className="px-6 py-16 text-center text-muted-foreground italic">
                    <Loader2 className="animate-spin text-primary-bright mx-auto mb-2" size={20} />
                    Syncing administrative indexes...
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-muted-foreground italic">
                    No tickets found in this queue.
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => (
                  <tr 
                    key={ticket.id}
                    onClick={() => navigate(`/admin/grievances/${ticket.id}`)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary-bright">
                      {ticket.ticket_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{ticket.title}</span>
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
                ))
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

    </div>
  );
};

export default AdminGrievancesPage;
