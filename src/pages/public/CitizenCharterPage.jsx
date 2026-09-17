import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, 
  ShieldCheck, 
  Clock, 
  Users, 
  Scale, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  Download,
  Award,
  Layers,
  PhoneCall,
  Mail,
  HelpCircle,
  FilePlus,
  Printer,
  Sparkles,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const CitizenCharterPage = () => {
  const [activeTier, setActiveTier] = useState(1);

  const handlePrint = () => {
    window.print();
  };

  const slaTiers = [
    {
      tier: 1,
      title: 'Tier 1: Department Handling Officer',
      turnaround: '24 – 48 Hours',
      badge: 'Primary Resolution',
      color: 'emerald',
      description: 'The assigned frontline departmental officer conducts initial fact-finding, contacts the complainant if necessary, and executes operational fixes.',
      actions: ['Field inspection or server logs review', 'Direct dialogue with citizen via chat', 'Submission of resolution evidence']
    },
    {
      tier: 2,
      title: 'Tier 2: Head of Department (HOD)',
      turnaround: '72 Hours',
      badge: 'Auto-Escalation Level 1',
      color: 'cyan',
      description: 'Triggered automatically if Tier 1 misses SLA deadline or if the complainant formally rejects the proposed solution with valid reasoning.',
      actions: ['Review of departmental delays', 'Reassignment of priority resources', 'Administrative intervention']
    },
    {
      tier: 3,
      title: 'Tier 3: Institutional Dean / Director',
      turnaround: '5 Working Days',
      badge: 'Executive Tribunal',
      color: 'amber',
      description: 'High-level committee inquiry involving academic deans, campus director, and student welfare representatives for unresolved institutional matters.',
      actions: ['Joint committee hearings', 'Policy amendment directives', 'Departmental accountability audits']
    },
    {
      tier: 4,
      title: 'Tier 4: Independent University Ombudsman',
      turnaround: '7 – 10 Working Days',
      badge: 'Final Statutory Appellate',
      color: 'rose',
      description: 'Highest appellate authority with statutory judicial impartiality. Ombudsman rulings are binding upon institutional administration.',
      actions: ['Independent legal & ethical review', 'Binding corrective orders', 'Institutional compliance sanctions']
    }
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-5xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
          {/* Top Bar Floating Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Charter</span>
              </button>
              <Link
                to="/officers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Users size={13} className="text-cyan-400" />
                <span>Officers Directory</span>
              </Link>
            </div>
          </div>

          {/* Hero Title Section */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/10">
              <Landmark size={13} />
              <span>Institutional Service Level Commitments</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Citizen Charter & Redressal Commitments
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Our solemn institutional covenant establishing citizen rights, guaranteed resolution timelines, non-retaliation protections, and tiered appellate safeguards.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500">
              <span>Charter Ref: <strong className="text-slate-300">UGC-REDRESS-2026</strong></span>
              <span>•</span>
              <span>Mandatory SLA: <strong className="text-emerald-400">24h – 48h</strong></span>
              <span>•</span>
              <span>Appellate Levels: <strong className="text-cyan-400">4 Tiers</strong></span>
            </div>
          </div>

          {/* 3 Core Commitments Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MotionCard className="p-6 space-y-2" tilt={false}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">Time-Bound Redressal</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Complaints are acknowledged within 5 minutes and acted upon within statutory 24 to 48 hours by designated department officers.
              </p>
            </MotionCard>

            <MotionCard className="p-6 space-y-2" tilt={false}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Scale size={20} />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">Zero Retaliation Guarantee</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Filing a grievance shall never prejudice a student's grades, campus standing, or staff evaluations under strict institutional sanction.
              </p>
            </MotionCard>

            <MotionCard className="p-6 space-y-2" tilt={false}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">Tamper-Proof Audit</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                All investigation logs, status transitions, and notes are cryptographically sealed via SHA-256 for public audit verification.
              </p>
            </MotionCard>
          </div>

          {/* Multi-Tier Escalation Matrix Section */}
          <MotionCard className="p-6 sm:p-8 space-y-6" tilt={false}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
                  <Layers size={14} />
                  <span>Statutory Escalation Ladder</span>
                </div>
                <h2 className="text-xl font-heading font-black text-white">
                  Four-Tier Resolution & Appellate Hierarchy
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                Auto-escalates on SLA breach
              </span>
            </div>

            {/* Interactive Tier Selection Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slaTiers.map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => setActiveTier(tier.tier)}
                  type="button"
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTier === tier.tier
                      ? 'bg-cyan-950/50 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/15'
                      : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase block text-cyan-400">
                    Level 0{tier.tier}
                  </span>
                  <span className="text-xs font-heading font-bold truncate block text-white mt-0.5">
                    Tier {tier.tier}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Tier Spotlight Card */}
            {(() => {
              const current = slaTiers.find(t => t.tier === activeTier) || slaTiers[0];
              return (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-heading font-black text-white">{current.title}</h3>
                      <span className="text-xs font-mono text-cyan-400">{current.badge}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                      <Clock size={13} />
                      <span>Statutory Window: {current.turnaround}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {current.description}
                  </p>

                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Key Escalation Actions:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {current.actions.map((act, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 font-sans">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </MotionCard>

          {/* Rights & Obligations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Citizen Rights */}
            <MotionCard className="p-6 space-y-4" tilt={false}>
              <div className="flex items-center gap-2.5 text-emerald-400 font-heading font-bold text-sm">
                <Award size={18} />
                <span>Rights of the Citizen / Student</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Right to receive digital acknowledgment within 5 minutes of filing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Right to track investigation milestones live without delays.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Right to elect anonymous / whistleblower handling for sensitive matters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Right to file one formal appeal if the resolution does not solve the root issue.</span>
                </li>
              </ul>
            </MotionCard>

            {/* Citizen Obligations */}
            <MotionCard className="p-6 space-y-4" tilt={false}>
              <div className="flex items-center gap-2.5 text-amber-400 font-heading font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Obligations & Terms of Fair Use</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Submissions must contain factual, accurate information without fabrication.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Frivolous, spam, or intentionally abusive filings are subject to disciplinary review.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Complainants must cooperate with officer inquiries for clarifying documents.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Confidential passkeys generated for anonymous tickets must be safeguarded.</span>
                </li>
              </ul>
            </MotionCard>
          </div>

          {/* Bottom Call to Action Card */}
          <div className="p-8 rounded-3xl bg-linear-to-r from-indigo-950/40 via-cyan-950/30 to-slate-950/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-heading font-black text-white">Need to File a Complaint?</h3>
              <p className="text-xs text-slate-400 max-w-md font-sans leading-relaxed">
                Our AI-assisted triage system will direct your grievance to the appropriate authority immediately under guaranteed SLA.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <Link to="/submit-grievance" className="w-full sm:w-auto">
                <AnimatedButton
                  variant="glow"
                  size="md"
                  leftIcon={FilePlus}
                  className="w-full sm:w-auto"
                >
                  File Grievance
                </AnimatedButton>
              </Link>
              <Link to="/public-status" className="w-full sm:w-auto">
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  rightIcon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  Track Ticket
                </AnimatedButton>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Citizen Redressal System &bull; Statutory Citizen Charter</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <span>•</span>
              <Link to="/feedback" className="hover:text-white">Feedback Hub</Link>
              <span>•</span>
              <Link to="/appeal" className="hover:text-white">File Appeal</Link>
            </div>
          </footer>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default CitizenCharterPage;
