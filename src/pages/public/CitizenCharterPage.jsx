import React, { useState, useEffect } from 'react';
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
  Moon, 
  Sun, 
  ArrowRight,
  Download,
  Award,
  Layers,
  PhoneCall,
  Mail,
  HelpCircle,
  FilePlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { useTheme } from '../../app/providers/ThemeProvider';

export const CitizenCharterPage = () => {
  const [activeTier, setActiveTier] = useState(1);
  const { theme, setTheme, toggleTheme } = useTheme();

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
      description: 'Handles cross-departmental disputes, high-financial impact claims, or systemic academic policy issues.',
      actions: ['Convening departmental committee', 'Policy clarification or exception grant', 'Formal executive determination']
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
    <AnimatedPage className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Ambient background lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-125 h-125 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-150 h-150 bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Bar Floating Controls */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 hover:text-white uppercase transition-colors"
        >
          <ChevronLeft size={16} />
          Portal Gateway
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Print Charter</span>
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2.5 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10 cursor-pointer"
            title="Toggle theme mode"
            type="button"
            aria-label="Toggle theme mode"
          >
            {theme === 'ocean' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 pb-24 pt-4 space-y-12">
        
        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Landmark size={13} />
            <span>Institutional Service Level Commitments</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mb-3">
            Citizen Charter & Terms of Redressal
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-sans max-w-xl mx-auto leading-relaxed">
            Our solemn institutional covenant establishing citizen rights, guaranteed resolution timelines, non-retaliation protections, and tiered appellate safeguards.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
            <span>Charter Ref: <strong className="text-slate-300">UGC-REDRESS-2026</strong></span>
            <span>•</span>
            <span>Mandatory SLA: <strong className="text-emerald-400 font-bold">24h – 48h</strong></span>
            <span>•</span>
            <span>Appellate Levels: <strong className="text-cyan-400 font-bold">4 Tiers</strong></span>
          </div>
        </div>

        {/* 3 Core Commitments Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <h3 className="font-heading font-bold text-white text-sm">Time-Bound Redressal</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Complaints are acknowledged within 5 minutes and acted upon within statutory 24 to 48 hours by designated officers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Scale size={20} />
            </div>
            <h3 className="font-heading font-bold text-white text-sm">Zero Retaliation Guarantee</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Filing a grievance shall never prejudice a student's grades, campus standing, or staff evaluations under strict institutional sanction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-heading font-bold text-white text-sm">Tamper-Proof Audit</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              All investigation logs, status transitions, and notes are cryptographically sealed via SHA-256 for public audit verification.
            </p>
          </div>
        </div>

        {/* Multi-Tier Escalation Matrix Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
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
            <span className="text-[11px] font-mono text-slate-400">
              Auto-escalates on SLA breach
            </span>
          </div>

          {/* Interactive Tier Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {slaTiers.map((tier) => (
              <button
                key={tier.tier}
                onClick={() => setActiveTier(tier.tier)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTier === tier.tier
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-[10px] font-mono font-bold uppercase block text-cyan-400">
                  Level 0{tier.tier}
                </span>
                <span className="text-xs font-heading font-bold truncate block">
                  Tier {tier.tier}
                </span>
              </button>
            ))}
          </div>

          {/* Active Tier Spotlight Card */}
          {(() => {
            const current = slaTiers.find(t => t.tier === activeTier) || slaTiers[0];
            return (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-heading font-black text-white">{current.title}</h3>
                    <span className="text-xs font-mono text-slate-400">{current.badge}</span>
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
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-300 font-sans">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Rights & Obligations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Citizen Rights */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-heading font-bold text-sm">
              <Award size={18} />
              <span>Rights of the Citizen / Student</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Right to receive written or digital acknowledgment within 5 minutes of filing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Right to track investigation progress live without bureaucratic delays.</span>
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
          </div>

          {/* Citizen Obligations */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-heading font-bold text-sm">
              <AlertTriangle size={18} />
              <span>Obligations & Terms of Fair Use</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Submissions must contain factual, accurate information without malicious fabrication.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Frivolous, spam, or intentionally abusive filings are subject to disciplinary audit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Complainants must cooperate with officer requests for clarifying documentation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>Confidential passkeys generated for anonymous tickets must be safeguarded.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Call to Action Card */}
        <div className="p-8 rounded-2xl bg-linear-to-r from-indigo-950/40 via-cyan-950/30 to-slate-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-heading font-black text-white">Need to File a Complaint?</h3>
            <p className="text-xs text-slate-400 max-w-md font-sans">
              Our AI-assisted triage system will direct your grievance to the appropriate authority immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/submit"
              className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <FilePlus size={15} />
              <span>File Grievance</span>
            </Link>
            <Link
              to="/public-status"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>Track Ticket</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </main>
    </AnimatedPage>
  );
};

export default CitizenCharterPage;
