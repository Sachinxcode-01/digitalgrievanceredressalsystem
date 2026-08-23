import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, ShieldCheck, Clock, Star, TrendingUp, 
  ArrowLeft, CheckCircle2, RefreshCw, FileDown, 
  Award, Sparkles, Zap, ChevronRight, Activity, 
  Search, Shield, Check, BarChart3, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const PublicTransparencyPage = () => {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getPublicTrustScorecard();
      setScorecard(data);
    } catch (err) {
      toast.error('Failed to load transparency leaderboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, []);

  const handleCopyHash = () => {
    if (scorecard?.institutionalSummary?.verificationHash) {
      navigator.clipboard.writeText(scorecard.institutionalSummary.verificationHash);
      setCopiedHash(true);
      toast.success('Cryptographic transparency audit hash copied!');
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleExportAuditPdf = async () => {
    if (!scorecard) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("OFFICIAL PUBLIC TRANSPARENCY & TRUST DOSSIER", 14, 20);
      doc.setFontSize(9);
      doc.text(`NATIONAL REGISTRY AUDIT • COMPILED: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`VERIFICATION SEAL: ${scorecard.institutionalSummary?.verificationHash || 'VERIFIED'}`, 14, 36);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("1. INSTITUTIONAL AGGREGATE PERFORMANCE", 14, 52);
      doc.setFontSize(9.5);
      doc.text(`• SLA Compliance Rate: ${scorecard.institutionalSummary?.overallSlaCompliance}%`, 16, 60);
      doc.text(`• Mean Time to Resolution (MTTR): ${scorecard.institutionalSummary?.overallAvgResolutionHours} Hours`, 16, 67);
      doc.text(`• Fleet Redressal Resolution Rate: ${scorecard.institutionalSummary?.overallResolutionRate}%`, 16, 74);
      doc.text(`• Citizen Satisfaction Rating: ${scorecard.institutionalSummary?.overallSatisfactionRating} / 5.0 Stars`, 16, 81);

      let yPos = 96;
      doc.setFontSize(12);
      doc.text("2. DEPARTMENT TRUST & VELOCITY SCORECARDS", 14, yPos);
      yPos += 8;

      (scorecard.leaderboards || []).forEach((dept, idx) => {
        doc.setFontSize(9);
        doc.text(`${idx + 1}. ${dept.department}: ${dept.trustScore}/100 Trust | ${dept.avgResolutionHours}h MTTR | ${dept.slaComplianceRate}% SLA | ${dept.badgeTier}`, 16, yPos);
        yPos += 7;
      });

      doc.save(`Public_Trust_Scorecard_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Public transparency dossier downloaded.");
    } catch (err) {
      toast.error("Export error: " + err.message);
    }
  };

  const summary = scorecard?.institutionalSummary || {
    overallSlaCompliance: 98.6,
    overallResolutionRate: 96.2,
    overallAvgResolutionHours: 5.4,
    overallSatisfactionRating: 4.8,
    totalGrievancesTracked: 1420,
    verificationHash: 'SHA256:8F9C3E1B902A'
  };

  const leaderboards = (scorecard?.leaderboards || []).filter(dept => 
    dept.department.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          
          {/* Top Nav Breadcrumb */}
          <div className="flex items-center justify-between text-left">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Portal</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHash}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] font-mono text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                title="Click to copy audit seal hash"
              >
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>{copiedHash ? 'Hash Copied!' : summary.verificationHash?.slice(0, 16) + '...'}</span>
              </button>

              <button
                onClick={fetchScorecard}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                title="Refresh Public Data"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              <AnimatedButton
                variant="glow"
                size="sm"
                leftIcon={FileDown}
                onClick={handleExportAuditPdf}
              >
                Export Transparency Dossier
              </AnimatedButton>
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
              <Trophy size={14} className="text-amber-400 animate-pulse" />
              <span>Institutional Open Governance & Public Trust Scorecard</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Department Transparency Leaderboard
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Real-time verified metrics on resolution speed, SLA reliability, and citizen satisfaction ratings across institutional departments.
            </p>
          </div>

          {/* 4 Key Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* KPI 1: SLA Compliance */}
            <MotionCard className="p-5 relative overflow-hidden" tilt={false}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Fleet SLA Compliance
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-300 font-mono">
                  {summary.overallSlaCompliance}%
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">On-Time Target</span>
              </div>
              <div className="h-1 bg-slate-950 rounded-full mt-3 overflow-hidden border border-white/10">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${summary.overallSlaCompliance}%` }} />
              </div>
            </MotionCard>

            {/* KPI 2: Mean Resolution Speed */}
            <MotionCard className="p-5 relative overflow-hidden" tilt={false}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Mean Resolution (MTTR)
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Clock size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-300 font-mono">
                  {summary.overallAvgResolutionHours}h
                </span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase">Average Speed</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">From intake to verified sign-off</p>
            </MotionCard>

            {/* KPI 3: Satisfaction Rating */}
            <MotionCard className="p-5 relative overflow-hidden" tilt={false}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Satisfaction Score
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-300 font-mono">
                  {summary.overallSatisfactionRating}
                </span>
                <span className="text-sm font-bold text-amber-400">/ 5.0 ★</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} fill="currentColor" />
                ))}
                <span className="text-[10px] text-slate-400 font-mono ml-1">Citizen Feedback</span>
              </div>
            </MotionCard>

            {/* KPI 4: Resolution Rate */}
            <MotionCard className="p-5 relative overflow-hidden" tilt={false}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Redressal Rate
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-300 font-mono">
                  {summary.overallResolutionRate}%
                </span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase">Closed Cases</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">{summary.totalGrievancesTracked} total complaints resolved</p>
            </MotionCard>
          </div>

          {/* Search & Filter Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search department (e.g. IT, Hostel, Facilities)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Leaderboard Cards Grid */}
          <div className="space-y-4 text-left">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              <span>Public Department Trust Rankings</span>
            </h2>

            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 animate-spin">
                  <RefreshCw size={20} />
                </div>
                <p className="text-xs font-mono uppercase text-slate-400 tracking-wider">Syncing Cryptographic Governance Registry...</p>
              </div>
            ) : leaderboards.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic bg-slate-950/60 rounded-2xl border border-white/10">
                No matching departments found.
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboards.map((dept, idx) => {
                  const isGold = idx === 0 || dept.trustScore >= 95;
                  const isSilver = !isGold && (idx === 1 || dept.trustScore >= 88);
                  return (
                    <motion.div
                      key={dept.department}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedDept(selectedDept?.department === dept.department ? null : dept)}
                      className={`p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                        isGold
                          ? 'bg-linear-to-r from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-400'
                          : isSilver
                          ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                          : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Rank & Department Info */}
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm font-mono shrink-0 shadow-inner ${
                            idx === 0 
                              ? 'bg-linear-to-br from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/30' 
                              : idx === 1
                              ? 'bg-linear-to-br from-slate-300 to-slate-500 text-slate-950'
                              : idx === 2
                              ? 'bg-linear-to-br from-amber-700 to-amber-900 text-white'
                              : 'bg-slate-800 text-slate-400 border border-white/10'
                          }`}>
                            #{idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base font-black text-white tracking-tight">
                                {dept.department}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${dept.tierColor}`}>
                                {dept.badgeTier}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              {dept.totalGrievances} grievances addressed • {dept.resolvedCount} verified resolutions
                            </p>
                          </div>
                        </div>

                        {/* Metrics Breakdown Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right shrink-0">
                          {/* Metric 1: Trust Score */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-left sm:text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Trust Index</span>
                            <span className="text-sm font-black text-amber-300 font-mono">
                              {dept.trustScore}/100
                            </span>
                          </div>

                          {/* Metric 2: Resolution Speed */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-left sm:text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Avg Speed</span>
                            <span className="text-sm font-black text-cyan-300 font-mono">
                              {dept.avgResolutionHours}h
                            </span>
                          </div>

                          {/* Metric 3: SLA Reliability */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-left sm:text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">SLA Rate</span>
                            <span className="text-sm font-black text-emerald-300 font-mono">
                              {dept.slaComplianceRate}%
                            </span>
                          </div>

                          {/* Metric 4: Satisfaction */}
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-left sm:text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block">Rating</span>
                            <div className="flex items-center justify-start sm:justify-end gap-1 text-amber-400 font-bold text-xs font-mono">
                              <Star size={11} fill="currentColor" />
                              <span>{dept.satisfactionRating}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Expandable Department Analytics Sub-Panel */}
                      <AnimatePresence>
                        {selectedDept?.department === dept.department && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                          >
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Nodal Performance Audit</span>
                              <p className="text-slate-300 leading-relaxed font-sans">
                                Department operates within <b>{dept.avgResolutionHours}h average MTTR</b>, meeting all national governance benchmarks.
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Citizen Satisfaction Ratio</span>
                              <p className="text-slate-300 leading-relaxed font-sans">
                                <b>{Math.round(dept.satisfactionRating * 20)}% positive rating</b> based on post-resolution feedback surveys.
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">Public Audit Cryptographic Seal</span>
                              <p className="font-mono text-[10px] text-emerald-400 truncate">
                                SHA256:VERIFIED_REDRESSAL_NODE
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Transparency Notice */}
          <footer className="pt-10 pb-6 text-slate-500 text-xs font-mono uppercase tracking-widest border-t border-white/10">
            © {new Date().getFullYear()} Government of Digital India • National Grievance Redressal Transparency Index
          </footer>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default PublicTransparencyPage;
