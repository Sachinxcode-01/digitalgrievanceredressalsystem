import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FilePlus2, 
  Cpu, 
  UserCheck, 
  FileCheck2, 
  Scale, 
  ChevronLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Search,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';

export const HowItWorksPage = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01',
      title: 'Digital Lodgement & Hashing',
      tagline: 'Cryptographically Secured Submission',
      icon: FilePlus2,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'from-emerald-500/10',
      description: 'The grievant submits a complaint with incident chronology and PDF/image evidence. The system immediately computes an immutable SHA-256 audit digest and issues a unique tracking ID (e.g. TKT-2026-X8B9).',
      details: [
        'End-to-end encrypted file attachments with virus scanning',
        'Option for complete whistleblower anonymity with metadata stripping',
        'Instant confirmation via SMS & Email with tracking link'
      ],
      sla: 'Instantaneous (&lt; 2 seconds)'
    },
    {
      step: '02',
      title: 'AI Classification & De-duplication',
      tagline: 'Automated Sentiment & Urgency Triaging',
      icon: Cpu,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgGlow: 'from-cyan-500/10',
      description: 'The neural engine parses the grievance text to detect department routing (Academics, Facilities, Ragging, Finance), checks for duplicate filings, and triggers statutory priority flags.',
      details: [
        'Automatic routing to one of 12 campus nodal officers',
        'Severity indexing: Emergency issues bypass normal queues',
        'Duplicate suppression prevents departmental logjams'
      ],
      sla: 'Real-time (< 30 seconds)'
    },
    {
      step: '03',
      title: 'Officer Allocation & Scrutiny',
      tagline: 'Active Investigation & Fact-Finding',
      icon: UserCheck,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      bgGlow: 'from-indigo-500/10',
      description: 'The designated Redressal Officer admits the complaint and commences enquiry. The officer can request supplemental clarification from the grievant via the authenticated portal communication log.',
      details: [
        'Strict SLA countdown timer (24 – 48 Hours) visibly enforced',
        'Direct two-way messaging between citizen and officer',
        'Automatic supervisor alert if enquiry stalls past 50% SLA'
      ],
      sla: 'SLA Clock: 24 to 48 Hours'
    },
    {
      step: '04',
      title: 'Formal Resolution Dossier',
      tagline: 'Binding Corrective Action & Closure',
      icon: FileCheck2,
      color: 'text-teal-400',
      borderColor: 'border-teal-500/30',
      bgGlow: 'from-teal-500/10',
      description: 'The officer issues a comprehensive Resolution Dossier stating findings, institutional remedy enacted, and administrative orders. Both the grievant and department head receive certified copies.',
      details: [
        'Official signed resolution report generated in PDF format',
        'Full timeline recorded in the public transparency index',
        'Citizen satisfaction survey (CSAT) unlocked for feedback'
      ],
      sla: 'Official Closure Notice'
    },
    {
      step: '05',
      title: '72-Hour Ombudsman Appeal Window',
      tagline: 'Autonomous Secondary Tribunal Review',
      icon: Scale,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgGlow: 'from-amber-500/10',
      description: 'If dissatisfied with the remedy, the grievant can file an electronic Appeal within 72 hours. The case escalates directly to the Chief Ombudsman Appellate Tribunal for an independent hearing.',
      details: [
        'Zero departmental influence on appellate proceedings',
        'Option for virtual or in-person ombudsman mediation hearing',
        'Final binding statutory order with compliance mandate'
      ],
      sla: 'Statutory 72-Hour Window'
    }
  ];

  const dosAndDonts = {
    dos: [
      'Provide specific dates, room numbers, and chronological order of events.',
      'Attach clear corroborating evidence (fee receipts, emails, photographs).',
      'Keep your ticket tracking ID and secret key confidential.',
      'Check your registered email and SMS for officer clarification requests.'
    ],
    donts: [
      'Do not submit multiple tickets for the exact same incident (AI merges duplicates).',
      'Do not use abusive, defamatory, or unparliamentary language.',
      'Do not file grievances on behalf of third parties without written authorization.',
      'Do not wait until semester conclusion to raise critical academic grievances.'
    ]
  };

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-12 pt-4 pb-20">
          
          {/* Top Bar Floating Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/public-status"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
              >
                <Search size={14} />
                <span>Track Ticket</span>
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>File Grievance</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Sparkles size={13} />
              <span>Standard Redressal Operating Procedure (SOP)</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white uppercase">
              How Redressal Works. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                From Submission To Remedy.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Learn how your grievance moves through encrypted intake, AI auto-classification, departmental investigation, and statutory ombudsman appeal with full transparency at every phase.
            </p>
          </div>

          {/* Interactive Step Timeline */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {steps.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-mono font-black ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {item.step}
                      </span>
                      <Icon size={16} className={isActive ? item.color : 'text-slate-500'} />
                    </div>
                    <div className={`text-xs font-heading font-bold uppercase truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Showcase Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MotionCard className={`p-6 sm:p-8 border ${steps[activeStep].borderColor} bg-gradient-to-br ${steps[activeStep].bgGlow} via-slate-900/90 to-slate-900/90 backdrop-blur-md space-y-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        Stage {steps[activeStep].step} of 05 • {steps[activeStep].tagline}
                      </div>
                      <h2 className="text-2xl font-heading font-bold text-white uppercase tracking-tight">
                        {steps[activeStep].title}
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-slate-300">
                      <Clock size={13} className="text-emerald-400" />
                      <span>{steps[activeStep].sla}</span>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                    {steps[activeStep].description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                      Technical & Governance Guarantees:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {steps[activeStep].details.map((detail, dIdx) => (
                        <div key={dIdx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5 text-xs text-slate-300 font-sans">
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Guidelines: Do's and Don'ts */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle size={18} className="text-cyan-400" />
                <span>Best Practices For Expedited Redressal</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Do's */}
              <MotionCard className="p-6 border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-heading font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 size={16} />
                  <span>Recommended (Do's)</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-sans">
                  {dosAndDonts.dos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </MotionCard>

              {/* Don'ts */}
              <MotionCard className="p-6 border border-rose-500/20 bg-rose-950/10 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-heading font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  <span>Prohibited & Avoid (Don'ts)</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-sans">
                  {dosAndDonts.donts.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </MotionCard>
            </div>
          </div>

          {/* Action CTA Banner */}
          <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight">
                Ready to file your grievance?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-lg">
                Filing takes under 3 minutes. Your case is safeguarded by strict SLA timers and judicial ombudsman oversight.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <Link
                to="/public-status"
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-bold transition-all border border-white/10"
              >
                Track Existing
              </Link>
              <Link
                to="/submit"
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                File New Grievance
              </Link>
            </div>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default HowItWorksPage;
