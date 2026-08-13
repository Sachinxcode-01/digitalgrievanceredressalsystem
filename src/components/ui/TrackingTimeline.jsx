import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const TrackingTimeline = ({ steps = [], className = '' }) => {
  return (
    <div className={`relative pl-4 space-y-8 ${className}`}>
      {/* Connecting Vertical Line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-slate-800" />

      {steps.map((step, idx) => {
        const isDone = step.status === 'completed' || step.done;
        const isActive = step.status === 'active' || step.active;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="relative flex items-start gap-4 group"
          >
            {/* Step Icon Node */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : isActive
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isActive ? (
                <Clock className="w-4 h-4 animate-spin-slow" />
              ) : (
                <span className="text-[10px] font-mono font-bold">{idx + 1}</span>
              )}
            </div>

            {/* Step Card Details */}
            <div className="flex-1 p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md group-hover:border-white/10 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDone || isActive ? 'text-white' : 'text-slate-400'}`}>
                  {step.title || step.label}
                </h4>
                {step.date && (
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                    {step.date}
                  </span>
                )}
              </div>
              {(step.description || step.desc) && (
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {step.description || step.desc}
                </p>
              )}
              {step.actor && (
                <span className="inline-block text-[9px] font-mono text-indigo-400 mt-2">
                  Officer: {step.actor}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TrackingTimeline;
