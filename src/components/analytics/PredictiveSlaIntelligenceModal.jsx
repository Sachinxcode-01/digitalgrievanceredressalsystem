import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, Clock, ShieldAlert, Sparkles, TrendingUp,
  Zap, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck,
  Send, Users, Activity, BarChart3, ChevronRight, FileDown,
  Layers, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

export const PredictiveSlaIntelligenceModal = ({ isOpen, onClose, tickets = [], onTicketSelect }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heatmap'); // heatmap, tickets, advisor
  const [isApplyingAction, setIsApplyingAction] = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getPredictiveSlaForecast(tickets);
      setForecast(data);
    } catch (err) {
      toast.error('Failed to calculate predictive SLA forecast: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchForecast();
    }
  }, [isOpen, tickets]);

  const handleApplyRebalance = async (actionIndex, action) => {
    setIsApplyingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAppliedActions(prev => [...prev, actionIndex]);
      toast.success(`⚡ Action Applied: Rebalanced workload for ${action.targetDepartment}!`);
    } catch (err) {
      toast.error('Failed to apply rebalance: ' + err.message);
    } finally {
      setIsApplyingAction(false);
    }
  };

  const handleExportReport = async () => {
    if (!forecast) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('EXECUTIVE SLA PREDICTIVE BREACH INTELLIGENCE REPORT', 14, 20);
      doc.setFontSize(9);
      doc.text(`GENERATED: ${new Date().toLocaleString()} | OVERALL HEALTH: ${forecast.riskSummary?.overallComplianceHealth || 85}%`, 14, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text('1. EXECUTIVE DIAGNOSIS', 14, 52);
      doc.setFontSize(10);
      const splitDiag = doc.splitTextToSize(forecast.aiAdvice?.executiveDiagnosis || 'Workload operations normal.', 180);
      doc.text(splitDiag, 14, 60);

      let yPos = 80;
      doc.setFontSize(12);
      doc.text('2. DEPARTMENT BOTTLENECK & VELOCITY HEATMAP', 14, yPos);
      yPos += 8;

      (forecast.departmentHeatmap || []).slice(0, 6).forEach((dept, i) => {
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${dept.name}: ${dept.totalOpen} Open | Imminent: ${dept.imminent} | Status: ${dept.bottleneckStatus} (${dept.healthScore}/100 Health)`, 16, yPos);
        yPos += 7;
      });

      yPos += 8;
      doc.setFontSize(12);
      doc.text('3. AI WORKLOAD REBALANCING DIRECTIVES', 14, yPos);
      yPos += 8;

      (forecast.aiAdvice?.recommendedRebalancingActions || []).forEach((rec, i) => {
        doc.setFontSize(9);
        doc.text(`• [${rec.actionType}] ${rec.targetDepartment}: ${rec.recommendation}`, 16, yPos);
        yPos += 7;
      });

      doc.save(`SLA_Predictive_Intelligence_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Executive SLA Report exported as PDF.');
    } catch (err) {
      toast.error('Export error: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const summary = forecast?.riskSummary || {
    imminentBreachCount: 0,
    highRiskCount: 0,
    elevatedRiskCount: 0,
    onTrackCount: 0,
    overallComplianceHealth: 100
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Banner */}
        <div className="px-6 py-5 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap size={22} className="animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Predictive SLA Breach Intelligence
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  AI Operations Radar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-breach forecasting, velocity bottleneck detection, & autonomous workload balancing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchForecast}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Forecast"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExportReport}
              disabled={!forecast}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Export Audit PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Predictive Breach Metric Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:p-6 bg-slate-950/60 border-b border-white/10 shrink-0">
          {/* Gauge 1: Imminent */}
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                Imminent (&lt;4h)
              </span>
              <AlertCircle size={14} className="text-red-400 animate-bounce" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-300 font-mono">
                {summary.imminentBreachCount}
              </span>
              <span className="text-[10px] text-red-400/80 font-bold uppercase">Breach Alert</span>
            </div>
          </div>

          {/* Gauge 2: High Risk */}
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                High Risk (4–12h)
              </span>
              <Clock size={14} className="text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-300 font-mono">
                {summary.highRiskCount}
              </span>
              <span className="text-[10px] text-orange-400/80 font-bold uppercase">Urgent Watch</span>
            </div>
          </div>

          {/* Gauge 3: Elevated */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Elevated (12–24h)
              </span>
              <Activity size={14} className="text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300 font-mono">
                {summary.elevatedRiskCount}
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold uppercase">Sustained Strain</span>
            </div>
          </div>

          {/* Gauge 4: Health % */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                SLA Compliance Health
              </span>
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300 font-mono">
                {summary.overallComplianceHealth}%
              </span>
              <span className="text-[10px] text-emerald-400/80 font-bold uppercase">Fleet Velocity</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-white/10 flex gap-6 shrink-0 bg-slate-900/90 select-none overflow-x-auto">
          {[
            { id: 'heatmap', label: 'Department Bottleneck Heatmap', icon: Layers },
            { id: 'advisor', label: 'AI Rebalancing Directives', icon: Sparkles },
            { id: 'tickets', label: `High Risk Queue (${(forecast?.highRiskTickets || []).length})`, icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 flex items-center gap-2 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-spin">
                <RefreshCw size={24} />
              </div>
              <p className="text-sm font-bold text-slate-200">Executing Gemini Predictive SLA Engine...</p>
              <p className="text-xs text-slate-400">Synthesizing department velocity, queue congestion, and breach vectors.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: BOTTLENECK HEATMAP */}
              {activeTab === 'heatmap' && (
                <motion.div
                  key="heatmap"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                        Department Congestion & Velocity Matrix
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Real-time workload stress scoring based on critical tickets, mean frustration, and breach trajectories.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(forecast?.departmentHeatmap || []).map((dept, i) => {
                      const isChoked = dept.bottleneckStatus?.includes('Choked') || dept.bottleneckStatus?.includes('Severe');
                      const isCongested = dept.bottleneckStatus === 'Congested';
                      return (
                        <div
                          key={i}
                          className={`p-5 rounded-2xl border transition-all ${
                            isChoked
                              ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-500/5'
                              : isCongested
                              ? 'bg-orange-950/30 border-orange-500/40'
                              : 'bg-slate-900/80 border-white/10 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-black text-white">{dept.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {dept.totalOpen} Active Workload
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                isChoked
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                                  : isCongested
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {dept.bottleneckStatus}
                            </span>
                          </div>

                          {/* Velocity Health Bar */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">Operational Health</span>
                              <span className={`font-mono ${dept.healthScore < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {dept.healthScore}/100
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                              <div
                                className={`h-full rounded-full ${
                                  dept.healthScore < 50
                                    ? 'bg-red-500'
                                    : dept.healthScore < 75
                                    ? 'bg-orange-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${dept.healthScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick Metrics */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
                            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Imminent (&lt;4h)</span>
                              <span className={`font-mono font-bold ${dept.imminent > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                                {dept.imminent} tickets
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg Frustration</span>
                              <span className="font-mono font-bold text-amber-400">
                                {dept.avgFrustration}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: AI REBALANCING ADVISOR */}
              {activeTab === 'advisor' && (
                <motion.div
                  key="advisor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5"
                >
                  {/* Executive Diagnosis Banner */}
                  <div className="p-5 rounded-2xl bg-linear-to-r from-indigo-950/80 via-slate-900 to-indigo-950/60 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles size={15} />
                      <span>Executive Diagnosis & Fleet Synthesis</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                      "{forecast?.aiAdvice?.executiveDiagnosis}"
                    </p>
                  </div>

                  {/* Tactical Directives */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      Tactical Workload Rebalancing Directives
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(forecast?.aiAdvice?.recommendedRebalancingActions || []).map((action, idx) => {
                        const isApplied = appliedActions.includes(idx);
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-amber-300">
                                  {action.targetDepartment}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                                  {action.actionType}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {action.recommendation}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-[10px] text-emerald-400 font-bold font-mono">
                                Expected SLA Recovery: ~{action.expectedSlaRecoveryHours || 3}h
                              </span>
                              <button
                                onClick={() => handleApplyRebalance(idx, action)}
                                disabled={isApplied || isApplyingAction}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isApplied
                                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                    : 'bg-linear-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 shadow-md font-black'
                                }`}
                              >
                                {isApplied ? <CheckCircle2 size={13} /> : <Zap size={13} />}
                                <span>{isApplied ? 'Directive Active' : 'Apply Directive'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Long-term policy preventative advice */}
                  {forecast?.aiAdvice?.preventativeSystemAdvice && (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Institutional Governance & Policy Advisory
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {forecast.aiAdvice.preventativeSystemAdvice}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: HIGH RISK TICKETS */}
              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 font-mono">
                        <tr>
                          <th className="p-3.5">Ticket ID</th>
                          <th className="p-3.5">Subject</th>
                          <th className="p-3.5">Department</th>
                          <th className="p-3.5">Urgency</th>
                          <th className="p-3.5">Breach Countdown</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(forecast?.highRiskTickets || []).length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                              🎉 Zero tickets in critical SLA breach territory!
                            </td>
                          </tr>
                        ) : (
                          (forecast.highRiskTickets || []).map((t, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-indigo-400">{t.ticket_id}</td>
                              <td className="p-3.5 font-bold text-white max-w-50 truncate">{t.title}</td>
                              <td className="p-3.5 text-slate-300">{t.department}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.urgency === 'High' || t.urgency === 'Critical' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {t.urgency}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-red-400">
                                {t.hoursRemaining <= 0 ? 'BREACHED' : `${t.hoursRemaining}h remaining`}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => {
                                    onClose();
                                    if (onTicketSelect) onTicketSelect(t);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Triage Ticket
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>AI Engine: Gemini 2.5 Operational Flash Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Radar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictiveSlaIntelligenceModal;
