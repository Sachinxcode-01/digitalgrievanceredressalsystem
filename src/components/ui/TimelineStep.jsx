import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const TimelineStep = ({ done, active, label, date, desc }) => (
  <div className="flex gap-4 pb-6 relative group text-left">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
      done ? 'bg-success/20 text-success border border-success/30' : 
      active ? 'bg-primary/20 text-primary border border-primary/30 animate-pulse' : 
      'bg-slate-800 text-slate-600 border border-white/5'
    }`}>
      {done ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
    </div>
    <div className="pt-0.5">
      <div className="flex items-center gap-2">
        <p className={`text-sm font-bold ${done || active ? 'text-white' : 'text-slate-500'}`}>{label}</p>
        {date && <span className="text-[10px] text-slate-600 font-mono">{date}</span>}
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default TimelineStep;
