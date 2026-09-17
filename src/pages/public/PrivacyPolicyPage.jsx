import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Server, 
  Clock, 
  Trash2, 
  FileText, 
  ChevronLeft, 
  Download, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Mail,
  Printer,
  Sparkles,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

export const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'overview', title: '1. Executive Overview & Scope', icon: ShieldCheck },
    { id: 'zero-trust', title: '2. Zero-Knowledge Architecture', icon: EyeOff },
    { id: 'cryptographic', title: '3. Cryptographic Audit Proofs', icon: KeyRound },
    { id: 'retention', title: '4. Data Retention Lifecycle', icon: Clock },
    { id: 'rights', title: '5. Citizen Data Rights & Erasure', icon: Trash2 },
    { id: 'ai-triage', title: '6. AI Processing & Gemini Guardrails', icon: Cpu },
    { id: 'compliance', title: '7. Statutory Contacts & DPO', icon: Mail }
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
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
                <span>Print Policy</span>
              </button>
              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <FileText size={13} className="text-cyan-400" />
                <span>Citizen Charter</span>
              </Link>
            </div>
          </div>

          {/* Hero Title Section */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/10">
              <ShieldCheck size={13} />
              <span>Statutory Governance & Compliance</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Privacy & Data Retention Policy
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Institutional standards governing citizen confidentiality, cryptographic audit logs, automated AI triage, and GDPR-compliant record erasure.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500">
              <span>Version: <strong className="text-slate-300">2026.3.1</strong></span>
              <span>•</span>
              <span>Effective Date: <strong className="text-slate-300">January 1, 2026</strong></span>
              <span>•</span>
              <span>Classification: <strong className="text-emerald-400">Public Tier-1</strong></span>
            </div>
          </div>

          {/* Two-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Interactive Table of Contents */}
            <aside className="lg:col-span-4 sticky top-24 space-y-3 hidden lg:block">
              <MotionCard className="p-5" tilt={false}>
                <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
                        activeSection === sec.id
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <sec.icon size={14} className="shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </a>
                  ))}
                </nav>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
                      <Lock size={12} className="text-indigo-400" />
                      <span>Zero-Knowledge Node</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed font-sans">
                      Personal identities are decoupled from complaint narratives via salted SHA-256 tokens.
                    </p>
                  </div>
                </div>
              </MotionCard>
            </aside>

            {/* Right Column: Full Document Articles */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* 1. Overview */}
              <MotionCard id="overview" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">1. Executive Overview & Jurisdiction</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Institutional Charter Standards</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  ResolveNow is deployed as an enterprise grievance redressal hub for educational institutions, government departments, and corporate organisations. This policy governs how personal data, evidence attachments, ticket updates, and telemetry logs are collected, processed, encrypted, and discarded.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                    <div className="font-heading font-bold text-white text-xs mb-1">Core Principle: Minimisation</div>
                    <p className="text-[11px] text-slate-400 font-sans">We only collect data strictly necessary to resolve your institutional dispute.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                    <div className="font-heading font-bold text-white text-xs mb-1">Core Principle: Non-Retaliation</div>
                    <p className="text-[11px] text-slate-400 font-sans">Complainant identities are shielded by role-based access gates.</p>
                  </div>
                </div>
              </MotionCard>

              {/* 2. Zero-Knowledge Architecture */}
              <MotionCard id="zero-trust" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">2. Zero-Knowledge Architecture & Whistleblower Shield</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Identity Anonymisation Protocols</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  When filing grievances flagged as <strong>Anonymous</strong> or <strong>Whistleblower</strong>, the platform detaches your user ID, IP address, and student profile before routing the complaint to department officers.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-sans">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Cryptographic Pseudonyms:</strong> Tickets receive an anonymous reference key (e.g. <code className="font-mono text-cyan-300 bg-slate-950 px-1 py-0.5 rounded border border-white/10">#TKT-2026-XXXX</code>) and private passcode.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Public Milestone Tracking:</strong> Citizens can monitor resolution milestones without authenticating into personal accounts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>End-to-End Chat Encryption:</strong> Follow-up communications between complainant and assigned officers are relayed through proxy channels.</span>
                  </li>
                </ul>
              </MotionCard>

              {/* 3. Cryptographic Audit Proofs */}
              <MotionCard id="cryptographic" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">3. Cryptographic Proofs & Tamper Prevention</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">SHA-256 Merkle Verification</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  To guarantee that grievance status, officer notes, and timestamps cannot be retroactively manipulated or deleted, each state change generates an immutable <strong>SHA-256 digital signature</strong>.
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-400 space-y-2 shadow-inner">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-indigo-400">
                    <span>Cryptographic Proof Formula</span>
                    <span>Hardware Accelerated</span>
                  </div>
                  <div className="text-slate-200 text-[11px] bg-black/50 p-3 rounded-lg border border-white/5 break-all">
                    SHA256(ticket_id + timestamp + status + officer_id + previous_hash)
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Anyone can verify ticket immutability via the public <Link to="/verify-hash" className="text-indigo-400 underline hover:text-indigo-300">Cryptographic Hash Verifier</Link>.
                  </p>
                </div>
              </MotionCard>

              {/* 4. Data Retention Lifecycle */}
              <MotionCard id="retention" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">4. Data Retention & Archival Schedules</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Automated Cleanup Timelines</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  Information is retained strictly in accordance with statutory academic schedules and legal requirements:
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
                    <span className="text-slate-300">Active Grievance Dossiers</span>
                    <span className="text-amber-400 font-bold">Retained Until Resolution + 30 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
                    <span className="text-slate-300">Resolution Evidence Attachments</span>
                    <span className="text-amber-400 font-bold">Auto-Purged After 180 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
                    <span className="text-slate-300">Audit Proof Hashes & Timestamps</span>
                    <span className="text-emerald-400 font-bold">Permanent Immutable Ledger (Anonymized)</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
                    <span className="text-slate-300">Account Access & Session Tokens</span>
                    <span className="text-indigo-400 font-bold">Purged on Logout / 7-Day Inactivity</span>
                  </div>
                </div>
              </MotionCard>

              {/* 5. Citizen Data Rights */}
              <MotionCard id="rights" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">5. Citizen Data Rights & Safe Erasure (GDPR)</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">User Control & Self-Service</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  You retain complete sovereign ownership over your personal data:
                </p>

                <div className="space-y-3 text-xs text-slate-300 font-sans">
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                    <div className="font-heading font-bold text-rose-300 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>Right to Erasure (Account Termination)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Users can execute complete self-service profile deletion through <Link to="/security" className="text-white underline font-bold">Account Security Settings</Link>. Deletion executes a cascading purge of email addresses, passwords, MFA secrets, and active session credentials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
                      <strong className="text-white block font-heading mb-1">Right to Access (Data Export)</strong>
                      <span className="text-[11px] text-slate-400">Export certified PDF dossiers of your historical complaints and officer responses at any time.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
                      <strong className="text-white block font-heading mb-1">Right to Rectification</strong>
                      <span className="text-[11px] text-slate-400">Update contact profiles, phone notification preferences, and department designations instantly.</span>
                    </div>
                  </div>
                </div>
              </MotionCard>

              {/* 6. AI Processing */}
              <MotionCard id="ai-triage" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">6. AI Processing & Gemini Guardrails</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Algorithmic Transparency</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  Incoming grievance narratives are processed by Google Gemini to automatically classify departments, detect emergency risks, and calculate priority scores.
                </p>

                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs font-mono text-slate-300 space-y-2">
                  <span className="text-purple-300 font-bold uppercase text-[10px] block">AI Ethical Guardrails:</span>
                  <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans">
                    <li>• No human data is used to train public machine learning models.</li>
                    <li>• Automatic sanitization strips payment details, national IDs, and passwords before AI inference.</li>
                    <li>• Automated routing can always be manually reclassified by department officers.</li>
                  </ul>
                </div>
              </MotionCard>

              {/* 7. Statutory Contacts */}
              <MotionCard id="compliance" className="p-6 sm:p-8 space-y-4" tilt={false}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-white">7. Data Protection Officer (DPO) & Regulatory Appeals</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Institutional Point of Contact</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  If you believe your personal data has been handled inconsistently with this policy or statutory provisions, direct inquiries to our Data Protection Office:
                </p>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="text-slate-400">Office of the Ombudsman:</span>
                    <span className="text-white font-bold">Institutional Redressal Council</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="text-slate-400">Data Protection Email:</span>
                    <a href="mailto:dpo@resolvenow.gov.in" className="text-indigo-400 hover:text-indigo-300 font-bold underline">dpo@resolvenow.gov.in</a>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-slate-400">Standard Response Turnaround:</span>
                    <span className="text-emerald-400 font-bold">Within 48 Working Hours</span>
                  </div>
                </div>
              </MotionCard>

            </div>

          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Citizen Redressal System &bull; Statutory Privacy Directive</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white">Citizen Charter</Link>
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

export default PrivacyPolicyPage;
