import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Ticket, Clock, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { BackgroundGradientAnimation } from '../components/ui/background-gradient-animation';

export const PublicStatusPage = () => {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    
    setLoading(true);
    setError('');
    setTicket(null);

    try {
      const { data, error } = await supabase
        .from('grievances')
        .select('*')
        .eq('ticket_id', ticketId.trim())
        .single();

      if (error) {
        setError('No grievance found with this ID. Please check and try again.');
      } else {
        setTicket(data);
      }
    } catch (err) {
      setError('Connection to security server lost. Please try later.');
    }
    setLoading(false);
  };

  return (
    <BackgroundGradientAnimation 
      interactive={true}
      gradientBackgroundStart="rgb(0, 8, 20)" 
      gradientBackgroundEnd="rgb(0, 4, 12)"
      firstColor="67, 97, 238"    /* Indigo-Blue */
      secondColor="114, 9, 183"   /* Rich Purple */
    >
      <div className="min-h-screen p-6 flex flex-col items-center justify-center relative z-50">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[10px] font-black">
            <ChevronLeft size={16} />
            Return to Gateway
          </Link>

          <div>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-20 h-20 bg-white rounded-3xl shadow-2xl shadow-primary/20 p-2 flex items-center justify-center mx-auto mb-8 overflow-hidden"
             >
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
             </motion.div>
             <h1 className="text-4xl font-black text-white mb-3 font-['Outfit'] tracking-tighter uppercase">Token Tracker</h1>
             <p className="text-slate-400 font-medium tracking-wide">Enter your unique ticket token for live status sync.</p>
          </div>

          <form onSubmit={handleSearch} className="relative group max-w-lg mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={24} />
            <input 
              type="text" 
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g. TKT-2026-XXXX" 
              className="glass-input w-full pl-16 pr-36 py-6 text-xl font-mono font-bold tracking-[0.2em] rounded-3xl"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {loading ? 'SYNCING...' : 'SYNC'}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 bg-error/10 border border-error/20 text-error rounded-2xl max-w-lg mx-auto flex items-center gap-4 justify-center shadow-lg shadow-error/5">
                 <AlertCircle size={20} />
                 <span className="text-xs font-black uppercase tracking-widest">{error}</span>
              </motion.div>
            )}

            {ticket && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="glass-card p-10 text-left space-y-8 glass-glow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.05] pb-8">
                  <div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">Authenticated Reference</span>
                     <h2 className="text-4xl font-mono text-primary font-black tracking-tighter">{ticket.ticket_id}</h2>
                  </div>
                  <div className="flex flex-col md:items-end gap-3">
                     <StatusBadge status={ticket.status} />
                     <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] font-black">Sync Date: {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Subject Sector</h4>
                      <p className="text-xl font-black text-white font-['Outfit']">{ticket.title}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Assigned Category</h4>
                      <div className="inline-block px-4 py-2 bg-white/5 rounded-xl text-xs text-slate-300 font-bold border border-white/10 uppercase tracking-widest">{ticket.category}</div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/20 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                     <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Clock size={28} />
                     </div>
                     <h4 className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Protocol Position</h4>
                     <p className="text-4xl font-black text-white font-mono">#{Math.floor(Math.random() * 15) + 1}</p>
                     <p className="text-[9px] text-primary/60 mt-2 uppercase tracking-[0.2em] font-black italic">Est. resolution: ~3h</p>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Original Transmission</h4>
                   <p className="text-slate-400 leading-relaxed italic text-sm font-medium">"{ticket.description}"</p>
                </div>

                <div className="flex justify-center pt-4">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                     For detailed logs and admin dialogue, please 
                     <Link to="/login" className="text-primary hover:text-white transition-colors ml-2">Authorize Access</Link>
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-16 text-slate-600 text-[10px] uppercase font-black tracking-[0.5em] opacity-50">
            &copy; {new Date().getFullYear()} ResolveNow &bull; Secure Protocol
          </footer>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    'In-Progress': 'bg-warning/10 text-warning border border-warning/20',
    'Resolved': 'bg-success/10 text-success border border-success/20',
  };
  return (
    <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest border ${styles[status]}`}>
       <div className={`w-2 h-2 rounded-full ${status === 'In-Progress' ? 'bg-warning animate-pulse' : status === 'Resolved' ? 'bg-success' : 'bg-slate-500'}`} />
       {status}
    </div>
  );
};
