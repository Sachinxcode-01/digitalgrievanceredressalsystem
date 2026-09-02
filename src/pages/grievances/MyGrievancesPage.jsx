import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, AlertCircle, Loader2, ArrowRight, 
  ChevronLeft, ChevronRight, Calendar, Filter, ArrowUpDown,
  LayoutGrid, List, CheckCircle2, Clock, ShieldCheck, Flame, 
  X, BookOpen, Sparkles, Building2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { grievanceService } from '../../services/grievanceService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import SlaCountdownTimer from '../../components/grievances/SlaCountdownTimer';
import MotionCard from '../../components/ui/MotionCard';
import toast from 'react-hot-toast';

export const MyGrievancesPage = ({ user }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View mode: 'grid' (visual cards) vs 'table' (compact rows)
  const [viewMode, setViewMode] = useState('grid');
  
  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('All'); // 'All', 'Active', 'Resolved', 'High Priority'
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at'); // created_at, urgency, status
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getByUser(user?.id);
      setTickets(data || []);
    } catch (err) {
      toast.error('Could not load your grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.id]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(t => ['New', 'Pending', 'Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['Resolved', 'Closed', 'AUTO_RESOLVED'].includes(t.status)).length;
    const highPriority = tickets.filter(t => t.urgency === 'High' || t.urgency === 'Emergency').length;
    return { total, active, resolved, highPriority };
  }, [tickets]);

  // Handle Sort Toggle
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Filtering Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const text = `${ticket.title} ${ticket.ticket_id} ${ticket.category} ${ticket.department || ''}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || text.includes(searchTerm.toLowerCase().trim());
      
      let matchesQuick = true;
      if (quickFilter === 'Active') {
        matchesQuick = ['New', 'Pending', 'Assigned', 'In Progress', 'Under Review'].includes(ticket.status);
      } else if (quickFilter === 'Resolved') {
        matchesQuick = ['Resolved', 'Closed', 'AUTO_RESOLVED'].includes(ticket.status);
      } else if (quickFilter === 'High Priority') {
        matchesQuick = ticket.urgency === 'High' || ticket.urgency === 'Emergency';
      }

      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || ticket.urgency === priorityFilter;
      
      return matchesSearch && matchesQuick && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, quickFilter, statusFilter, priorityFilter]);

  // Sorting Logic
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'urgency') {
        const priorityWeights = { 'Low': 1, 'Medium': 2, 'High': 3, 'Emergency': 4 };
        comparison = (priorityWeights[a.urgency] || 0) - (priorityWeights[b.urgency] || 0);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortBy === 'ticket_id') {
        comparison = (a.ticket_id || '').localeCompare(b.ticket_id || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTickets, sortBy, sortOrder]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      
      {/* Header Panel */}
      <div className="bg-surface border border-border/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-foreground uppercase tracking-wider">
              My Grievances
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-bright/10 text-primary-bright text-[11px] font-bold">
              {tickets.length} Registered
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Track real-time SLA progress, departmental dispatch, and verified resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <Link 
            to="/knowledge-base"
            className="px-3 py-2 rounded-xl bg-surface hover:bg-muted border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <BookOpen size={13} className="text-primary-bright" />
            <span>Help Center</span>
          </Link>

          <button 
            onClick={() => navigate('/grievances/submit')}
            className="px-4 py-2 rounded-xl bg-primary-bright hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-primary-bright/20 cursor-pointer"
          >
            <Plus size={14} />
            <span>Submit New Grievance</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setQuickFilter('All'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'All' 
              ? 'bg-primary-bright/10 border-primary-bright text-primary-bright shadow-sm' 
              : 'bg-surface/60 border-border/70 hover:border-border text-muted-foreground'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block">Total Filed</span>
          <span className="text-xl font-heading font-black text-foreground mt-0.5 block">{stats.total}</span>
        </div>

        <div 
          onClick={() => { setQuickFilter('Active'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'Active' 
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm' 
              : 'bg-surface/60 border-border/70 hover:border-border text-muted-foreground'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
            <Clock size={11} className="text-amber-400" /> In Progress
          </span>
          <span className="text-xl font-heading font-black text-amber-400 mt-0.5 block">{stats.active}</span>
        </div>

        <div 
          onClick={() => { setQuickFilter('Resolved'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'Resolved' 
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm' 
              : 'bg-surface/60 border-border/70 hover:border-border text-muted-foreground'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" /> Resolved
          </span>
          <span className="text-xl font-heading font-black text-emerald-400 mt-0.5 block">{stats.resolved}</span>
        </div>

        <div 
          onClick={() => { setQuickFilter('High Priority'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'High Priority' 
              ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-sm' 
              : 'bg-surface/60 border-border/70 hover:border-border text-muted-foreground'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
            <Flame size={11} className="text-rose-400" /> High Urgency
          </span>
          <span className="text-xl font-heading font-black text-rose-400 mt-0.5 block">{stats.highPriority}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-surface border border-border/80 rounded-2xl shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
        
        {/* Table/Cards Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
          
          {/* Search Box */}
          <div className="relative bg-background border border-border rounded-xl px-3 py-2 flex items-center gap-2 w-full lg:w-80 shadow-xs">
            <Search size={14} className="text-muted-foreground/60 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by ticket ID, subject, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>
          
          {/* Filter Pills & View Switcher */}
          <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Select */}
              <select 
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Priority Select */}
              <select 
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency">Emergency SOS</option>
              </select>
            </div>

            {/* View Mode Toggle Button Group */}
            <div className="flex items-center p-1 rounded-xl bg-background border border-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-surface text-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline text-[11px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-surface text-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table List View"
              >
                <List size={13} />
                <span className="hidden sm:inline text-[11px]">Table</span>
              </button>
            </div>

          </div>
        </div>

        {/* Content Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="animate-spin text-primary-bright mx-auto" size={28} />
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Synchronizing grievance logs...</p>
          </div>
        ) : currentTickets.length === 0 ? (
          /* Friendly Empty State */
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-bright/10 text-primary-bright flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-foreground">No grievances found</h3>
              <p className="text-xs text-muted-foreground">
                {searchTerm || quickFilter !== 'All' 
                  ? 'No grievances match your filter criteria. Try clearing filters or searching for something else.'
                  : 'You have not submitted any complaints yet. Everything seems running smoothly!'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {searchTerm || quickFilter !== 'All' ? (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setQuickFilter('All'); setStatusFilter('All'); setPriorityFilter('All'); }}
                  className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/grievances/submit')}
                  className="px-4 py-2 rounded-xl bg-primary-bright text-white text-xs font-bold shadow-md shadow-primary-bright/20 cursor-pointer"
                >
                  Submit Your First Grievance
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* User-Friendly Visual Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {currentTickets.map((ticket) => (
              <MotionCard
                key={ticket.id}
                onClick={() => navigate(`/grievances/${ticket.id}`)}
                className="p-5 rounded-2xl border border-border/80 bg-surface/70 hover:border-primary-bright/40 transition-all cursor-pointer flex flex-col justify-between group shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Ticket ID & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-primary-bright bg-primary-bright/10 px-2.5 py-0.5 rounded-md border border-primary-bright/20">
                      #{ticket.ticket_id}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary-bright transition-colors line-clamp-2 leading-snug">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-muted/50 border border-border/60">
                        {ticket.category}
                      </span>
                      {ticket.department && (
                        <span className="truncate max-w-[140px] flex items-center gap-1">
                          <Building2 size={10} />
                          {ticket.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SLA Countdown Timer */}
                  <div className="pt-1">
                    <SlaCountdownTimer 
                      createdAt={ticket.created_at}
                      slaHours={ticket.urgency === 'High' ? 24 : (ticket.urgency === 'Emergency' ? 2 : 48)}
                      status={ticket.status}
                      priority={ticket.urgency}
                      escalationLevel={ticket.escalation_level || 1}
                    />
                  </div>
                </div>

                {/* Footer: Date & Arrow CTA */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px] flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </span>
                  
                  <span className="text-primary-bright text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Details <ArrowRight size={11} />
                  </span>
                </div>
              </MotionCard>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-background/80 text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('ticket_id')}>
                    <div className="flex items-center gap-1">Ticket Ref <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('urgency')}>
                    <div className="flex items-center gap-1">Priority <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none text-right" onClick={() => toggleSort('created_at')}>
                    <div className="flex items-center gap-1 justify-end">Filed <ArrowUpDown size={10} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {currentTickets.map((ticket) => (
                  <tr 
                    key={ticket.id}
                    onClick={() => navigate(`/grievances/${ticket.id}`)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary-bright">
                      #{ticket.ticket_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[260px]">{ticket.title}</span>
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-primary-bright transition-all shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.category}
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBadge level={ticket.urgency} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredTickets.length} total tickets)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-background hover:bg-muted border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-background hover:bg-muted border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground transition-colors"
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

export default MyGrievancesPage;
