import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Search, MoreVertical, X, CheckCircle2, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis } from 'recharts';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Comments logic
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    fetchGlobalTickets();

    const channel = supabase
      .channel('global-grievances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
            
            // If the selected ticket was updated, update it in the view too
            setSelectedTicket((currentSelected) => {
              if (currentSelected && currentSelected.id === payload.new.id) {
                return payload.new;
              }
              return currentSelected;
            });
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const commentChannel = supabase
      .channel('admin-ticket-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_comments' },
        (payload) => {
          if (selectedTicket && payload.new.grievance_id === selectedTicket.id) {
             fetchComments(selectedTicket.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(commentChannel);
    };
  }, [selectedTicket]);

  const fetchComments = async (ticketId) => {
    const { data, error } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        profiles (full_name, role)
      `)
      .eq('grievance_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    
    setIsSendingComment(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ticket_comments')
      .insert([
        { 
          grievance_id: selectedTicket.id,
          user_id: user.id,
          message: newComment
        }
      ]);

    if (!error) {
      setNewComment('');
      fetchComments(selectedTicket.id);
    }
    setIsSendingComment(false);
  };

  const fetchGlobalTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (status) => {
    const { error } = await supabase
      .from('grievances')
      .update({ status, admin_comment: resolutionNote })
      .eq('id', selectedTicket.id);
    
    if (!error) {
      if (status === 'Resolved') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#ec4899']
        });
        toast.success(`Ticket ${selectedTicket.ticket_id} resolved!`);
      } else {
        toast.success(`Ticket marked as ${status}`);
      }
      setSelectedTicket(null);
      setResolutionNote('');
      fetchGlobalTickets();
    } else {
      toast.error('Failed to update ticket status');
    }
  };

  const handleExportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No tickets to export");
      return;
    }
    const headers = ['Ticket ID', 'Title', 'Category', 'Urgency', 'Status', 'User ID', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...tickets.map(t => [
        t.ticket_id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.urgency,
        t.status,
        t.user_id,
        new Date(t.created_at).toLocaleString()
      ].join(','))
    ];

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `grievances_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('CSV Report downloaded exported');
  };

  const adminStats = [
    { label: 'Pending Action', value: tickets.filter(t => t.status === 'Pending').length, icon: <Clock />, color: 'text-warning' },
    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'Resolved').length, icon: <CheckCircle />, color: 'text-success' },
    { label: 'Total Volume', value: tickets.length, icon: <Ticket />, color: 'text-primary' },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Analytics Data
  const categoryData = [
    { name: 'IT Support', value: tickets.filter(t => t.category === 'IT Support').length },
    { name: 'Maintenance', value: tickets.filter(t => t.category === 'Maintenance').length },
    { name: 'Academic', value: tickets.filter(t => t.category === 'Academic').length },
    { name: 'Financial', value: tickets.filter(t => t.category === 'Financial').length },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Pending', count: tickets.filter(t => t.status === 'Pending').length },
    { name: 'In-Progress', count: tickets.filter(t => t.status === 'In-Progress').length },
    { name: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
  ];

  const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-['Outfit'] text-white">Administration Control</h2>
          <p className="text-slate-400">Review and resolve organization-wide grievances.</p>
        </div>
        <button onClick={handleExportCSV} className="btn-ghost flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10">
          <Download size={16} />
          Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminStats.map((stat, idx) => (
          <div key={idx} className="glass-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>{stat.icon}</div>
              <span className="text-sm font-medium text-slate-400">{stat.label}</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-lg text-white mb-6">Distribution by Category</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {tickets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">No data available for charts.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-lg text-white mb-6">Resolution Velocity</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            {tickets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#ffffff20', borderRadius: '12px' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : entry.name === 'In-Progress' ? '#f59e0b' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <p className="text-slate-500 text-sm">No data available for charts.</p>
             )}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-6 border-b border-white/10 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h3 className="font-bold text-lg text-white">All Grievances</h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID or Subject..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 py-2.5 w-full text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input py-2.5 bg-[#1a1f2e] text-sm text-slate-300"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input py-2.5 bg-[#1a1f2e] text-sm text-slate-300"
              >
                <option value="All">All Categories</option>
                <option value="IT Support">IT Support</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Academic">Academic</option>
                <option value="Financial">Financial</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 text-center text-slate-500 font-['Outfit']">Fetching records...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTickets.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                       <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white mb-0.5">{ticket.ticket_id}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ticket.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={ticket.urgency} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleSelectTicket(ticket)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-2xl overflow-hidden">
              <div className="p-8 border-b border-white/10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold font-['Outfit'] text-white">{selectedTicket.ticket_id}</h2>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <p className="text-slate-400">{selectedTicket.title}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Description</h4>
                  <p className="text-slate-200">{selectedTicket.description}</p>
                </div>

                {/* Legacy Resolution Note (kept for old tickets) */}
                {selectedTicket.admin_comment && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Resolution Note</h4>
                    <p className="text-slate-300 min-h-[50px]">{selectedTicket.admin_comment}</p>
                  </div>
                )}

                {/* Comments Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Ticket size={16} className="text-primary" />
                    Ticket Updates & Responses
                  </h4>
                  
                  <div className="space-y-4 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">No updates or comments yet.</p>
                    ) : (
                      comments.map((comment, i) => (
                        <div key={i} className={`p-4 rounded-xl text-sm ${comment.profiles?.role === 'admin' ? 'bg-primary/10 border border-primary/20 ml-8' : 'bg-white/5 border border-white/10 mr-8'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${comment.profiles?.role === 'admin' ? 'text-primary' : 'text-slate-300'}`}>
                              {comment.profiles?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-200">{comment.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <form onSubmit={handleSendComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message or response to the user..." 
                      className="glass-input flex-1 text-sm py-2 px-4"
                      required
                    />
                    <button type="submit" disabled={isSendingComment} className="bg-primary hover:bg-primary-dark text-white px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                      Send
                    </button>
                  </form>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-4 border-t border-white/10">
                   <button onClick={() => handleUpdateStatus('In-Progress')} className="btn-ghost flex-1">Mark In-Progress</button>
                   <button onClick={() => handleUpdateStatus('Resolved')} className="btn-primary flex-1 bg-success hover:bg-success/80 flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    Resolve Ticket
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    'In-Progress': 'text-warning bg-warning/10 border-warning/20',
    'Resolved': 'text-success bg-success/10 border-success/20',
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${styles[status]}`}>{status}</span>;
};

const UrgencyBadge = ({ level }) => {
  const styles = {
    'High': 'text-error',
    'Medium': 'text-warning',
    'Low': 'text-success'
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${level === 'High' ? 'bg-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' : level === 'Medium' ? 'bg-warning' : 'bg-success'}`}></span>
      <span className={`text-xs font-bold uppercase tracking-wider ${styles[level]}`}>{level}</span>
    </div>
  );
};
