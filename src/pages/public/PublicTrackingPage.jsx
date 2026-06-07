import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Ticket, Clock, CheckCircle2, AlertCircle, ChevronLeft, Activity, Landmark, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// Removed BackgroundGradientAnimation, NeuralOverlay, PulseTicker
import StatusBadge from '../../components/ui/StatusBadge';

export const PublicStatusPage = () => {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

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
        .limit(1)
        .maybeSingle();

      if (error) {
        setError('Reference ID not found in system records.');
      } else {
        setTicket(data);
      }
    } catch (err) {
      setError('Connection to node lost. Please retry.');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="h-screen w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col items-center justify-center relative z-50">
        
        {/* Theme Toggler top-right */}
        <div className="absolute top-16 right-6 z-[70]">
          <button 
            onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
            className="p-2 text-muted-foreground hover:text-foreground bg-background/50 border border-border/40 rounded-xl transition-all"
            type="button"
          >
            {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div className="w-full max-w-2xl space-y-6 sm:space-y-8 text-center my-auto pt-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest text-[9px] font-bold">
            <ChevronLeft size={14} />
            Portal Gateway
          </Link>

          <div>
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-md p-1.5 flex items-center justify-center mx-auto mb-6 overflow-hidden border border-border"
             >
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg" />
             </motion.div>
             
             <div className="flex justify-center mb-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                  <Landmark size={12} className="text-primary" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Public Registry Index</span>
                </div>
              </div>

             <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground tracking-tight">Track Grievance Filing</h1>
             <p className="text-muted-foreground font-medium tracking-wide text-xs sm:text-sm max-w-md mx-auto">Verify redressal milestones and real-time correspondence status.</p>
          </div>

          {/* Scrolling ticker */}
          <div className="w-full max-w-lg mx-auto py-3.5 overflow-hidden relative border-y border-border/40">
             <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
             <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
             <motion.div 
               animate={{ x: [0, -600] }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
               className="flex gap-8 whitespace-nowrap items-center"
             >
                <PulseItem type="RESOLVED" text="TKT-2026-8291: Power Grid Overload" />
                <PulseItem type="ACTIVE" text="TKT-2026-9102: Facilities Assessment" />
                <PulseItem type="RESOLVED" text="TKT-2026-7721: Portal Server Handshake" />
                <PulseItem type="ACTIVE" text="TKT-2026-1102: Public Transit Triage" />
             </motion.div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative group max-w-lg mx-auto w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="TKT-2026-XXXX" 
              className="glass-input w-full pl-12 pr-28 py-4 text-base font-mono font-bold tracking-widest"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-2.5 top-2.5 bottom-2.5 px-5 bg-primary hover:bg-secondary text-white rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all disabled:opacity-50 select-none flex items-center justify-center cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? 'SYNCING...' : 'SYNC'}
            </button>
          </form>

          {/* Results Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }} 
                className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl max-w-lg mx-auto flex items-center gap-3 justify-center shadow-sm"
              >
                 <AlertCircle size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
              </motion.div>
            )}

            {ticket && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="glass-card p-6 sm:p-8 text-left space-y-6 max-w-xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                  <div className="space-y-1">
                     <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Reference Identifier</span>
                     <h2 className="text-2xl font-mono text-primary font-bold tracking-wider">{ticket.ticket_id}</h2>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                     <StatusBadge status={ticket.status} />
                     <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-mono">Filing Date: {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="sm:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Subject Sector</span>
                      <p className="text-base font-heading font-extrabold text-foreground">{ticket.title}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Department Assignment</span>
                      <span className="inline-block px-3 py-1 bg-background/50 rounded-lg text-[9px] text-foreground font-mono font-bold border border-border/50 uppercase tracking-widest">{ticket.category}</span>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 flex flex-col items-center justify-center text-center">
                     <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2 shadow-xs">
                        <Clock size={18} />
                     </div>
                     <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Registry Queue</span>
                     <p className="text-2xl font-heading font-black text-foreground mt-0.5">#{Math.floor(Math.random() * 12) + 2}</p>
                     <p className="text-[8px] text-primary/80 mt-1 uppercase tracking-wider font-bold">ETA: 24-48 Hours</p>
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-2xl border border-border/50 space-y-4">
                   <div className="space-y-1">
                     <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Statement Log</span>
                     <p className="text-foreground text-xs leading-relaxed italic font-medium">"{ticket.description}"</p>
                   </div>
                   
                   {ticket.frustration_index > 0 && (
                     <div className="pt-3.5 border-t border-border/40">
                       <div className="flex justify-between items-center text-[9px] font-bold uppercase mb-2">
                         <span className="text-muted-foreground flex items-center gap-1"><Activity size={10} /> Impact Severity</span>
                         <span className="text-primary font-mono">{ticket.frustration_index}/10</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${ticket.frustration_index * 10}%` }}
                             className={`h-full ${ticket.frustration_index >= 7 ? 'bg-error' : 'bg-primary'}`}
                           />
                         </div>
                       </div>
                     </div>
                   )}
                </div>

                <div className="flex justify-center pt-2">
                   <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                     For interactive redressing, please 
                     <Link to="/login" className="text-primary hover:text-foreground transition-colors ml-1 underline underline-offset-2 decoration-primary/20">Authorize Identity</Link>
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-10 text-muted-foreground/60 text-[8px] sm:text-[9px] uppercase font-black tracking-[0.35em]">
            &copy; {new Date().getFullYear()} National Redressal Infrastructure &bull; Official Portal
          </footer>
        </div>
      </div>
    </div>
  );
};

const PulseItem = ({ type, text }) => (
  <div className="flex items-center gap-2">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === 'RESOLVED' ? 'bg-success' : 'bg-primary animate-pulse'}`} />
    <span className="text-[9px] font-mono font-bold tracking-wider text-muted-foreground uppercase whitespace-nowrap">
      <span className={type === 'RESOLVED' ? 'text-success' : 'text-primary'}>{type}:</span> {text}
    </span>
  </div>
);
