import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Shield, Clock, BarChart2, CheckCircle2, Ticket, AlertTriangle, TrendingUp } from 'lucide-react';
import GlassPanel from './GlassPanel';
import StatusBadge from './StatusBadge';
import UrgencyBadge from './UrgencyBadge';

export const DashboardPreviewMock = () => {
  const [activeTab, setActiveTab] = useState('student');

  return (
    <GlassPanel doubleBezel className="p-6 md:p-8 space-y-6">
      {/* Tab Controls - Centered & Visually Associated */}
      <div className="flex flex-col items-center text-center gap-3 border-b border-white/10 pb-5">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          Interactive Product Preview
        </span>
        <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
          Enterprise Management Terminals
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950 p-1.5 rounded-full border border-white/10 mt-1">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
              activeTab === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Console
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Command Center
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
              activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Tracking
          </button>
        </div>
      </div>

      {/* Mock Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'student' && (
          <motion.div
            key="student"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 text-left"
          >
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10">
                <span className="text-xs font-mono text-slate-400">My Complaints</span>
                <p className="text-lg font-black text-white">4 Active</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10">
                <span className="text-xs font-mono text-slate-400">In Progress</span>
                <p className="text-lg font-black text-indigo-400">2 In Review</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/10">
                <span className="text-xs font-mono text-slate-400">Resolved</span>
                <p className="text-lg font-black text-emerald-400">12 Total</p>
              </div>
            </div>

            {/* Mock Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 font-mono text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                  <tr>
                    <td className="p-3 font-bold text-indigo-400">#TKT-2026-8812</td>
                    <td className="p-3 font-semibold text-white">Campus Library Wi-Fi Intermittent Disconnections</td>
                    <td className="p-3">IT Support</td>
                    <td className="p-3"><StatusBadge status="In Progress" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-400">#TKT-2026-7901</td>
                    <td className="p-3 font-semibold text-white">Hostel Block B Hot Water Heater Maintenance</td>
                    <td className="p-3">Facilities</td>
                    <td className="p-3"><StatusBadge status="Resolved" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 text-left"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-500/20">
                <span className="text-xs font-mono text-slate-400">Global Cases</span>
                <p className="text-lg font-black text-white">1,482</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-amber-500/20">
                <span className="text-xs font-mono text-slate-400">Pending Triage</span>
                <p className="text-lg font-black text-amber-400">18 Queue</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-emerald-500/20">
                <span className="text-xs font-mono text-slate-400">SLA Compliance</span>
                <p className="text-lg font-black text-emerald-400">99.4%</p>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-rose-500/20">
                <span className="text-xs font-mono text-slate-400">Escalations</span>
                <p className="text-lg font-black text-rose-400">2 Critical</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Automated Department Routing</h3>
                  <p className="text-xs text-slate-400">Gemini AI classified #TKT-9912 &rarr; IT Support Directorate (98.4% confidence)</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
                Live Dispatch
              </span>
            </div>
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 text-left font-mono"
          >
            {[
              { title: 'Grievance Submitted', desc: 'Ticket #TKT-2026-9901 registered by student.', time: '09:00 AM', done: true },
              { title: 'Gemini AI Sentiment & Categorization Audit', desc: 'Triage score: 8/10. Routed to Facilities.', time: '09:01 AM', done: true },
              { title: 'SLA Timer Initialized (48 Hours)', desc: 'Due date set for Aug 15, 2026.', time: '09:01 AM', done: true },
              { title: 'Officer Assigned & Investigation Active', desc: 'Officer Ramesh Kumar reviewing evidence photos.', time: '10:30 AM', active: true },
            ].map((st, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${st.done ? 'bg-emerald-400' : st.active ? 'bg-indigo-400 animate-ping' : 'bg-slate-700'}`} />
                  <div>
                    <p className="font-bold text-white">{st.title}</p>
                    <p className="text-xs text-slate-400">{st.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-indigo-400 font-bold">{st.time}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
};

export default DashboardPreviewMock;
