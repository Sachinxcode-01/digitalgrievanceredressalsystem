import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, CheckCircle2, AlertCircle, Filter, X, Send, Ticket } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const UserDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New grievance states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [urgency, setUrgency] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data);
    setLoading(false);
  };

  const handleCreateGrievance = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase
      .from('grievances')
      .insert([
        { 
          ticket_id: ticketId,
          user_id: user.id,
          title, 
          description, 
          category, 
          urgency,
          status: 'Pending'
        }
      ]);

    if (!error) {
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } else {
      alert(error.message);
    }
    setIsSubmitting(false);
  };

  const stats = [
    { label: 'Total Tickets', value: tickets.length, icon: <Filter size={20} />, color: 'bg-primary' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'In-Progress').length, icon: <Clock size={20} />, color: 'bg-warning' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length, icon: <CheckCircle2 size={20} />, color: 'bg-success' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-['Outfit']">Dashboard Overview</h2>
          <p className="text-slate-400">Manage and track your reported grievances.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Report New Grievance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
            <div className={`p-4 ${stat.color}/20 text-white rounded-2xl shadow-inner`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-lg">My Grievances</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-slate-500">Loading your tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No grievances found. Create one to get started.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Urgency</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map((ticket, idx) => (
                  <tr key={idx} onClick={() => setSelectedTicket(ticket)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-5 font-mono text-xs text-primary font-bold">{ticket.ticket_id}</td>
                    <td className="px-6 py-5 font-medium text-slate-200">{ticket.title}</td>
                    <td className="px-6 py-5">
                      <span className="bg-white/5 px-2 py-1 rounded text-xs text-slate-400">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <UrgencyBadge level={ticket.urgency} />
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-5 text-right text-sm text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card w-full max-w-xl p-8 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 font-['Outfit']">
                <div className="p-2 bg-primary/20 rounded-lg text-primary"><Ticket size={24} /></div>
                New Grievance
              </h2>
              <form className="space-y-6" onSubmit={handleCreateGrievance}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input w-full bg-[#1a1f2e] border-white/10">
                      <option>IT Support</option>
                      <option>Maintenance</option>
                      <option>Academic</option>
                      <option>Financial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Urgency</label>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="glass-input w-full bg-[#1a1f2e] border-white/10">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Subject</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className="glass-input w-full" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Detailed Description</label>
                  <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your problem..." className="glass-input w-full resize-none py-3" required></textarea>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                  <button disabled={isSubmitting} type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-2xl overflow-hidden relative">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
              >
                <X size={24} />
              </button>
              <div className="p-8 border-b border-white/10 flex justify-between items-start pt-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold font-['Outfit'] text-white">{selectedTicket.ticket_id}</h2>
                    <StatusBadge status={selectedTicket.status} />
                    <UrgencyBadge level={selectedTicket.urgency} />
                  </div>
                  <p className="text-slate-400 text-lg">{selectedTicket.title}</p>
                </div>
              </div>

              <div className="p-8 space-y-6 text-left">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Category</h4>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg text-sm text-slate-300 font-medium border border-white/10">{selectedTicket.category}</span>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Description</h4>
                  <p className="text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">{selectedTicket.description}</p>
                </div>
                
                {selectedTicket.admin_comment && (
                  <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                    <h4 className="text-xs uppercase font-bold text-success tracking-widest mb-2">
                      Admin Resolution Note
                    </h4>
                    <p className="text-slate-200 leading-relaxed">{selectedTicket.admin_comment}</p>
                  </div>
                )}
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
    'Pending': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    'In-Progress': 'bg-warning/10 text-warning border border-warning/20',
    'Resolved': 'bg-success/10 text-success border border-success/20',
  };
  return <span className={`status-badge ${styles[status]}`}>{status}</span>;
}

const UrgencyBadge = ({ level }) => {
  const styles = {
    'Low': 'text-success',
    'Medium': 'text-warning',
    'High': 'text-error font-bold underline underline-offset-4',
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${level === 'High' ? 'bg-error animate-pulse' : level === 'Medium' ? 'bg-warning' : 'bg-success'}`}></div>
      <span className={`text-xs font-semibold ${styles[level]}`}>{level}</span>
    </div>
  );
}
