import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, FileText, Cpu, ArrowRight, Clock, ShieldCheck, CheckCircle2, Star } from 'lucide-react';
import GlassPanel from './GlassPanel';

export const ProcessFlowDiagram = () => {
  const flowSteps = [
    { id: 1, title: 'Citizen User', desc: 'Initiates request', icon: User, color: 'from-blue-500 to-indigo-500' },
    { id: 2, title: 'ResolveBot', desc: 'Instant AI help', icon: Bot, color: 'from-indigo-500 to-cyan-500' },
    { id: 3, title: 'Grievance Form', desc: 'Files complaint', icon: FileText, color: 'from-cyan-500 to-teal-500' },
    { id: 4, title: 'Gemini AI', desc: 'Triage & sentiment', icon: Cpu, color: 'from-purple-500 to-indigo-500' },
    { id: 5, title: 'Auto-Routing', desc: 'Department dispatch', icon: ArrowRight, color: 'from-indigo-500 to-blue-600' },
    { id: 6, title: 'SLA Tracking', desc: '48h timer countdown', icon: Clock, color: 'from-amber-500 to-orange-500' },
    { id: 7, title: 'Officer Action', desc: 'Evidence review', icon: ShieldCheck, color: 'from-blue-600 to-indigo-600' },
    { id: 8, title: 'Resolution', desc: 'Ticket closed', icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
    { id: 9, title: 'Feedback', desc: '5-Star rating', icon: Star, color: 'from-yellow-400 to-amber-500' },
  ];

  return (
    <GlassPanel doubleBezel className="p-8 sm:p-12 overflow-x-auto">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-indigo-400">
          Visual System Pipeline
        </span>
        <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
          End-to-End Governance Process Flow
        </h3>
        <p className="text-xs text-slate-400">
          Automated lifecycle from initial user input to final verified resolution.
        </p>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 min-w-[700px] py-4">
        {flowSteps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex flex-col items-center text-center space-y-2 flex-1 min-w-[90px]"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.color} p-0.5 shadow-lg shadow-indigo-500/20`}>
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
                  <step.icon size={18} />
                </div>
              </div>
              <span className="text-[10px] font-heading font-extrabold text-white uppercase tracking-wider">
                {step.title}
              </span>
              <span className="text-[9px] font-mono text-slate-400 leading-tight">
                {step.desc}
              </span>
            </motion.div>

            {idx < flowSteps.length - 1 && (
              <div className="hidden lg:flex items-center text-slate-600">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ArrowRight size={14} className="text-indigo-400/60" />
                </motion.div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </GlassPanel>
  );
};

export default ProcessFlowDiagram;
