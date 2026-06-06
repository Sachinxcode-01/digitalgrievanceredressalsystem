import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, AlertCircle, Loader2, ArrowRight, 
  ChevronLeft, ChevronRight, Calendar, Filter, ArrowUpDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { grievanceService } from '../../api/grievanceService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import toast from 'react-hot-toast';

export const MyGrievancesPage = ({ user }) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at'); // created_at, urgency, status
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getByUser(user.id);
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
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.urgency === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sorting Logic
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'created_at') {
      comparison = new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === 'urgency') {
      const priorityWeights = { 'Low': 1, 'Medium': 2, 'High': 3 };
      comparison = (priorityWeights[a.urgency] || 0) - (priorityWeights[b.urgency] || 0);
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortBy === 'ticket_id') {
      comparison = a.ticket_id.localeCompare(b.ticket_id);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      
      {/* Header Panel */}
      <div className="bg-surface border border-border/80 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-heading font-black text-foreground uppercase tracking-wider">My Grievances</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Monitor and track resolution progress of all your filed institutional complaints.
          </p>
        </div>
        <button 
          onClick={() => navigate('/grievances/submit')}
          className="btn-premium flex items-center gap-2"
        >
          <Plus size={14} />
          <span>New Grievance</span>
        </button>
      </div>

      {/* Main Table Grid */}
      <div className="bg-surface border border-border/80 rounded-xl shadow-sm overflow-hidden">
        
        {/* Table Filters Toolbar */}
        <div className="px-6 py-4 border-b border-border/60 bg-background/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative bg-background border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-2 w-full sm:w-64">
            <Search size={14} className="text-muted-foreground/60" />
            <input 
              type="text" 
              placeholder="Search Subject/Ticket ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-muted-foreground/60" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Filters:</span>
            </div>
            
            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select 
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-background text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:bg-muted/30 select-none transition-colors"
                  onClick={() => toggleSort('ticket_id')}
                >
                  <div className="flex items-center gap-1">
                    <span>Ticket ID</span>
                    <ArrowUpDown size={10} className="text-muted-foreground/40" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:bg-muted/30 select-none transition-colors"
                  onClick={() => toggleSort('urgency')}
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown size={10} className="text-muted-foreground/40" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:bg-muted/30 select-none transition-colors"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown size={10} className="text-muted-foreground/40" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3.5 cursor-pointer hover:bg-muted/30 select-none transition-colors text-right"
                  onClick={() => toggleSort('created_at')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    <span>Created At</span>
                    <ArrowUpDown size={10} className="text-muted-foreground/40" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-muted-foreground">
                    <Loader2 className="animate-spin text-primary-bright mx-auto mb-2" size={20} />
                    Synchronizing grievance database...
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-muted-foreground italic">
                    No grievance records match the current filters.
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => (
                  <tr 
                    key={ticket.id}
                    onClick={() => navigate(`/grievances/${ticket.id}`)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary-bright">
                      {ticket.ticket_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[240px]">{ticket.title}</span>
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-primary-bright transition-all shrink-0" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={ticket.urgency} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/60 bg-background/30 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredTickets.length} total entries)
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

export default MyGrievancesPage;
