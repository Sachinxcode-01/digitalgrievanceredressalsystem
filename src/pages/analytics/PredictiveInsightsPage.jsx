import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, Clock, Zap, 
  BarChart3, Sparkles, Filter, RefreshCw, ArrowRight, 
  CheckCircle2, Users, Building2, Flame, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, BarChart, Bar, Legend, Cell 
} from 'recharts';
import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import BottleneckHeatmap from '../../components/analytics/BottleneckHeatmap';
import toast from 'react-hot-toast';

const FORECAST_TREND_DATA = [
  { day: 'Mon', actualInflow: 28, aiPredictedInflow: 25, resolvedRate: 27 },
  { day: 'Tue', actualInflow: 34, aiPredictedInflow: 31, resolvedRate: 30 },
  { day: 'Wed', actualInflow: 42, aiPredictedInflow: 39, resolvedRate: 38 },
  { day: 'Thu', actualInflow: 31, aiPredictedInflow: 35, resolvedRate: 33 },
  { day: 'Fri', actualInflow: 39, aiPredictedInflow: 41, resolvedRate: 36 },
  { day: 'Sat', actualInflow: 18, aiPredictedInflow: 20, resolvedRate: 22 },
  { day: 'Sun', actualInflow: 12, aiPredictedInflow: 14, resolvedRate: 15 },
];

const PREDICTIVE_BREACH_CASES = [
  {
    id: 'GRV-8821',
    title: 'Substation Transformer Phase Imbalance — North Block',
    department: 'Hostel & Facilities',
    urgency: 'High',
    elapsedHours: 21,
    slaTargetHours: 24,
    breachRiskPercent: 94,
    riskReason: 'Specialized technician required; supplier parts lead time.'
  },
  {
    id: 'GRV-8834',
    title: 'Degree Transcript Delay for Foreign University Visa',
    department: 'Academic Affairs',
    urgency: 'High',
    elapsedHours: 38,
    slaTargetHours: 48,
    breachRiskPercent: 88,
    riskReason: 'HOD physical signature queue bottleneck.'
  },
  {
    id: 'GRV-8849',
    title: 'Mess Vendor Food Quality Dispute & Sanitation Audit',
    department: 'Campus Infrastructure',
    urgency: 'Medium',
    elapsedHours: 35,
    slaTargetHours: 48,
    breachRiskPercent: 76,
    riskReason: 'Multi-officer joint inspection committee scheduling.'
  },
  {
    id: 'GRV-8862',
    title: 'Hostel 4 Wi-Fi Core Router Reboot Loop',
    department: 'IT Support & Systems',
    urgency: 'Medium',
    elapsedHours: 29,
    slaTargetHours: 48,
    breachRiskPercent: 62,
    riskReason: 'Firmware rollback required during off-peak window.'
  }
];

const DEPARTMENT_VELOCITY_DATA = [
  { department: 'IT Support', mttrHours: 6.2, csat: 4.8, fcrPercent: 82, complianceRate: 98 },
  { department: 'Facilities', mttrHours: 16.4, csat: 4.2, fcrPercent: 68, complianceRate: 91 },
  { department: 'Academics', mttrHours: 22.1, csat: 3.9, fcrPercent: 54, complianceRate: 84 },
  { department: 'Finance', mttrHours: 19.8, csat: 4.1, fcrPercent: 61, complianceRate: 88 },
  { department: 'Security', mttrHours: 1.8, csat: 4.9, fcrPercent: 95, complianceRate: 99 },
];

export const PredictiveInsightsPage = () => {
  const [activeBreaches, setActiveBreaches] = useState(PREDICTIVE_BREACH_CASES);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const handleFastTrack = (caseId) => {
    setActiveBreaches(prev => prev.filter(c => c.id !== caseId));
    toast.success(`Ticket ${caseId} expedited! Tier-2 Nodal Officer alerted via SMS.`);
  };

  return (
    <AnimatedPage className="space-y-8 text-left max-w-7xl mx-auto pb-16 pt-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-bright/10 text-primary-bright text-[10px] font-bold uppercase tracking-wider border border-primary-bright/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Intelligence Engine
            </span>
            <span className="text-xs text-muted-foreground">• Real-Time Forecasting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground mt-1">
            Predictive Grievance Insights & Bottleneck Forecaster
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Proactive SLA breach risk scoring, systemic departmental bottleneck clustering, and automated resolution velocity models.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success('Predictive models re-calibrated with latest telemetry.')}
          className="px-4 py-2 rounded-xl bg-surface/80 hover:bg-surface border border-border text-foreground text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Score Predictors
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MotionCard className="p-5 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Predicted SLA Breach Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-rose-400">4.2%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">↓ 1.8% vs last week</span>
          </div>
          <p className="text-[11px] text-muted-foreground">4 tickets forecasted at high breach risk.</p>
        </MotionCard>

        <MotionCard className="p-5 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mean Velocity (MTTR)</span>
            <div className="w-8 h-8 rounded-lg bg-primary-bright/20 text-primary-bright flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-foreground">11.4h</span>
            <span className="text-[11px] text-emerald-400 font-semibold">↓ 3.2h faster</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Average resolution across all nodes.</p>
        </MotionCard>

        <MotionCard className="p-5 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pre-Submission Deflection</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-emerald-400">34.8%</span>
            <span className="text-[11px] text-emerald-400 font-semibold">↑ 6.4% adoption</span>
          </div>
          <p className="text-[11px] text-muted-foreground">142 routine complaints deflected by SOPs.</p>
        </MotionCard>

        <MotionCard className="p-5 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Citizen CSAT Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-heading text-amber-300">4.7 / 5.0</span>
            <span className="text-[11px] text-amber-400 font-semibold">★ Excellent</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Based on 890 verified user reviews.</p>
        </MotionCard>
      </div>

      {/* SLA Breach Risk Forecaster Action Table */}
      <GlassPanel className="p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
          <div>
            <h3 className="text-sm font-heading font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              SLA Breach Risk Forecaster (Highest Urgency Queue)
            </h3>
            <p className="text-xs text-muted-foreground">
              Tickets algorithmically identified as likely to breach SLA before deadline expires.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 self-start sm:self-auto">
            {activeBreaches.length} Urgent Tickets Require Intervention
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3">Ticket Ref</th>
                <th className="py-3 px-3">Subject & Root Reason</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Elapsed vs SLA</th>
                <th className="py-3 px-3">Breach Risk %</th>
                <th className="py-3 px-3 text-right">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {activeBreaches.map((item) => (
                <tr key={item.id} className="hover:bg-surface/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-primary-bright">
                    #{item.id}
                  </td>
                  <td className="py-3.5 px-3 space-y-0.5 max-w-xs">
                    <p className="font-bold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-rose-400/90 font-medium">⚠️ {item.riskReason}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-semibold text-muted-foreground">
                      {item.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px]">
                    <span className="text-rose-400 font-bold">{item.elapsedHours}h</span>
                    <span className="text-muted-foreground"> / {item.slaTargetHours}h target</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full" 
                          style={{ width: `${item.breachRiskPercent}%` }} 
                        />
                      </div>
                      <span className="font-bold font-mono text-rose-400">{item.breachRiskPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleFastTrack(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-linear-to-r from-rose-500 to-amber-500 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-all shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      FastTrack Escalate
                    </button>
                  </td>
                </tr>
              ))}
              {activeBreaches.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    🎉 All tickets are operating safely within SLA limits! Zero high-risk breaches forecasted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {/* Root Cause Bottleneck Heatmap Component */}
      <GlassPanel className="p-6 rounded-3xl">
        <BottleneckHeatmap />
      </GlassPanel>

      {/* Predictive Volume & Resolution Inflow Trend Chart + Velocity Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <GlassPanel className="p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-heading font-bold text-foreground">
                Volume Inflow vs. AI Resolution Forecast
              </h3>
              <p className="text-xs text-muted-foreground">Weekly actual vs predicted capacity.</p>
            </div>
            <span className="text-[10px] font-mono text-primary-bright bg-primary-bright/10 px-2.5 py-1 rounded-full border border-primary-bright/20">
              98.2% Model Fit
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FORECAST_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="actualInflow" name="Actual Inflow" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="resolvedRate" name="Resolved Capacity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Velocity Benchmarks */}
        <GlassPanel className="p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-heading font-bold text-foreground">
                Department Velocity & Quality Matrix
              </h3>
              <p className="text-xs text-muted-foreground">Benchmarking response time & CSAT scores.</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">SLA Targets</span>
          </div>

          <div className="space-y-3 pt-1">
            {DEPARTMENT_VELOCITY_DATA.map((dept) => (
              <div key={dept.department} className="p-3 rounded-2xl bg-surface/40 border border-border/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">{dept.department}</span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>MTTR: <b className="text-foreground">{dept.mttrHours}h</b></span>
                    <span>•</span>
                    <span>FCR: <b className="text-emerald-400">{dept.fcrPercent}%</b></span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-xs font-bold text-amber-300">★ {dept.csat} / 5.0</span>
                  <p className="text-[10px] text-emerald-400 font-semibold">{dept.complianceRate}% SLA Rate</p>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </AnimatedPage>
  );
};

export default PredictiveInsightsPage;
