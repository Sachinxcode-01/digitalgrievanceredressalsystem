import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, AlertCircle, ChevronLeft, Landmark, Activity, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/ui/StatusBadge';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import TrackingTimeline from '../../components/ui/TrackingTimeline';

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
      const { data, error: dbError } = await supabase
        .from('grievances')
        .select('*')
        .eq('ticket_id', ticketId.trim())
        .limit(1)
        .maybeSingle();

      if (dbError || !data) {
        setError('Reference Ticket ID not found in system records.');
      } else {
        setTicket(data);
      }
    } catch {
      setError('Connection to node lost. Please retry.');
    }
    setLoading(false);
  };

  const getTimelineSteps = (t) => {
    if (!t) return [];
    const isResolved = t.status === 'Resolved' || t.status === 'Closed';
    const isInProgress = t.status === 'In Progress' || t.status === 'Under Review' || t.status === 'Assigned';
    const isEscalated = t.status === 'Escalated';

    return [
      {
        title: 'Grievance Submitted',
        desc: 'Ticket captured & cryptographic hash assigned.',
        date: new Date(t.created_at).toLocaleDateString(),
        done: true,
      },
      {
        title: 'Automated AI Triage & Department Routing',
        desc: `Routed to sector: ${t.category || 'General'}`,
        done: true,
      },
      {
        title: 'Officer Assessment & Investigation',
        desc: isEscalated ? 'Escalated to Senior Administrative Directorate.' : 'Officer reviewing dossier evidence.',
        active: isInProgress || isEscalated,
        done: isResolved,
      },
      {
        title: 'Final Resolution & Case Sign-Off',
        desc: t.resolution_notes || 'Pending final verification by redressal authority.',
        done: isResolved,
      },
    ];
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full p-4 sm:p-6 flex flex-col items-center justify-center relative z-10">
        
        <div className="w-full max-w-3xl space-y-8 text-center my-auto pt-12 pb-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-all uppercase tracking-widest text-xs font-mono font-bold">
            <ChevronLeft size={16} />
            Back to Portal Gateway
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-4">
              <Landmark size={14} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Public Registry Index</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Track Grievance Ticket
            </h1>
            <p className="text-slate-400 font-medium text-sm max-w-md mx-auto mt-2">
              Verify real-time resolution milestones, department routing, and SLA status.
            </p>
          </div>

          {/* Search Form */}
          <MotionCard className="p-4 sm:p-6 max-w-xl mx-auto" tilt={false}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="TKT-2026-XXXX" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl font-mono text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <AnimatedButton
                type="submit"
                variant="glow"
                size="md"
                isLoading={loading}
                className="w-full sm:w-auto"
              >
                Sync Status
              </AnimatedButton>
            </form>
          </MotionCard>

          {/* Results Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }} 
                className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl max-w-xl mx-auto flex items-center gap-3 justify-center shadow-sm"
              >
                <AlertCircle size={16} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">{error}</span>
              </motion.div>
            )}

            {ticket && (
              <MotionCard className="p-6 sm:p-8 text-left space-y-6 max-w-2xl mx-auto" tilt={false}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Reference Identifier</span>
                    <h2 className="text-2xl font-mono text-indigo-400 font-bold tracking-wider">{ticket.ticket_id}</h2>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <StatusBadge status={ticket.status} />
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Filing Date: {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Subject</span>
                      <p className="text-base font-heading font-extrabold text-white">{ticket.title}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Department</span>
                      <span className="inline-block px-3 py-1 bg-slate-950 rounded-lg text-xs text-white font-mono font-bold border border-white/10 uppercase tracking-widest">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-indigo-500/20 flex flex-col items-center justify-center text-center">
                    <Clock size={20} className="text-indigo-400 mb-1" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Estimated Resolution</span>
                    <p className="text-xl font-heading font-black text-white mt-0.5">24-48 Hrs</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Narrative Statement Log</span>
                  <p className="text-slate-300 text-xs leading-relaxed italic">"{ticket.description}"</p>
                </div>

                {/* Progress Timeline */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Live Progress Milestones
                  </h3>
                  <TrackingTimeline steps={getTimelineSteps(ticket)} />
                </div>
              </MotionCard>
            )}
          </AnimatePresence>

          <footer className="pt-10 text-slate-500 text-xs font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} Government of Digital India • Official Public Registry
          </footer>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default PublicStatusPage;
