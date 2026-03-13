import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Search, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchGlobalTickets();
  }, []);

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
      setSelectedTicket(null);
      setResolutionNote('');
      fetchGlobalTickets();
    }
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

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold font-['Outfit'] text-white">Administration Control</h2>
          <p className="text-slate-400">Review and resolve organization-wide grievances.</p>
        </div>
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
                      <button onClick={() => setSelectedTicket(ticket)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
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

              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Description</h4>
                  <p className="text-slate-200">{selectedTicket.description}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Resolution Note</h4>
                  <textarea 
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-300 resize-none min-h-[100px]"
                    placeholder="Describe the steps taken..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-4">
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
