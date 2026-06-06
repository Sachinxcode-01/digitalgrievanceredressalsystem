import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PulseTicker = () => {
  const [updates, setUpdates] = useState([
    { id: 'initial', text: 'SYSTEM_ONLINE: ALL_NEURAL_CORES_ACTIVE', type: 'system' }
  ]);

  useEffect(() => {
    // Fetch initial latest updates
    const fetchInitialUpdates = async () => {
      const { data, error } = await supabase
        .from('grievances')
        .select('ticket_id, title, category')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const mapped = data.map(t => ({
          id: t.ticket_id,
          text: `NEW_GRIEVANCE: [${t.category}] ${t.title}`,
          type: 'grievance'
        }));
        setUpdates(prev => [...mapped, ...prev]);
      }
    };

    fetchInitialUpdates();

    // Subscribe to new grievances for real-time pulse
    const channel = supabase
      .channel('public_pulse')
      .on('postgres_changes', { event: 'INSERT', table: 'grievances' }, payload => {
        const newUpdate = {
          id: payload.new.ticket_id,
          text: `INCOMING_TICKET: [${payload.new.category}] ${payload.new.title}`,
          type: 'grievance'
        };
        setUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="w-full bg-black/40 backdrop-blur-2xl border-y border-white/5 h-12 flex items-center overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 px-6 bg-primary/20 backdrop-blur-3xl border-r border-white/10 flex items-center gap-3 z-10">
        <Activity size={16} className="text-primary animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] whitespace-nowrap">Neural_Pulse</span>
      </div>

      <div className="flex-1 overflow-hidden relative h-full">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex items-center absolute whitespace-nowrap h-full"
        >
          {[...updates, ...updates].map((update, i) => (
            <div key={`${update.id}-${i}`} className="inline-flex items-center gap-4 mx-12">
              <div className={`w-1.5 h-1.5 rounded-full ${update.type === 'system' ? 'bg-primary' : 'bg-emerald-400'} animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {update.text}
              </span>
              <span className="text-[8px] text-white/20 font-black opacity-30">// SYNC_LOCK_0{i}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute right-0 top-0 bottom-0 px-6 bg-gradient-to-l from-black/80 to-transparent flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <Zap size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inference_Active</span>
        </div>
      </div>
    </div>
  );
};
