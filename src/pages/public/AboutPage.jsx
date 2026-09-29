import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Scale, 
  Award, 
  FileCheck, 
  ChevronLeft, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  Globe2,
  BookOpen,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';

export const AboutPage = () => {
  const [activeTab, setActiveTab] = useState('mission');

  const stats = [
    { label: 'Statutory Resolution Rate', value: '98.4%', trend: '+4.2% YoY', icon: TrendingUp },
    { label: 'Average Redressal Time', value: '31.2 hrs', trend: 'SLA target: 48h', icon: FileCheck },
    { label: 'Total Grievances Redressed', value: '42,900+', trend: 'Across 12 Departments', icon: CheckCircle2 },
    { label: 'Zero-Knowledge Privacy', value: '100%', trend: 'ISO 27001 Certified', icon: Lock },
  ];

  const ombudsmanCouncil = [
    {
      name: 'Hon. Justice (Retd.) R. K. Sharma',
      role: 'Chief Ombudsman & Appellate Authority',
      dept: 'Statutory Grievance Appellate Council',
      badge: 'Judicial Oversight'
    },
    {
      name: 'Dr. Aruna Sengupta',
      role: 'Dean of Student Welfare & Senior Mediator',
      dept: 'Academic & Campus Affairs Bureau',
      badge: 'Executive Redressal'
    },
    {
      name: 'Prof. Vikram Malhotra',
      role: 'Director of Institutional Ethics & Compliance',
      dept: 'Administrative & Faculty Integrity',
      badge: 'Ethics & Compliance'
    },
    {
      name: 'Adv. Meera Chawla',
      role: 'External Legal Counsel & Independent Observer',
      dept: 'Legal & Equal Opportunity Safeguards',
      badge: 'External Ombudsman'
    }
  ];

  const pillars = [
    {
      title: 'Zero-Trust Accountability',
      desc: 'Every ticket submission generates an immutable SHA-256 hash log. Neither officers nor administrators can tamper with grievance timestamps or alter investigation trails.',
      icon: ShieldCheck,
      color: 'text-emerald-400'
    },
    {
      title: 'Intelligent AI Classification',
      desc: 'Powered by Gemini & NVIDIA AI models to categorize submissions across 12 departments, eliminate duplicates, predict SLA breach hazards, and recommend relevant campus policies.',
      icon: Cpu,
      color: 'text-cyan-400'
    },
    {
      title: 'Complete Whistleblower Protection',
      desc: 'Students and staff can raise sensitive integrity, harassment, or financial concerns anonymously with zero egress metadata and quantum-safe cryptographic separation.',
      icon: Lock,
      color: 'text-amber-400'
    },
    {
      title: 'Democratic Right to Appeal',
      desc: 'Unsatisfied with a resolution? Every grievant has a statutory 72-hour window to elevate tickets directly to the Appellate Ombudsman Council for secondary review.',
      icon: Scale,
      color: 'text-indigo-400'
    }
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-10 pt-4 pb-20">
          
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
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
              >
                <BookOpen size={14} />
                <span>How It Works</span>
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
              <Building2 size={13} />
              <span>Official Institutional Charter • DoPT & UGC Aligned</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white uppercase">
              Transparent Redressal. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Guaranteed Accountability.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              ResolveNow is the autonomous digital grievance redressal authority engineered to protect student, faculty, and citizen rights through zero-trust workflows, SLA timers, and impartial ombudsman arbitration.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <MotionCard key={idx} className="p-5 border border-white/10 bg-slate-900/60 backdrop-blur-md">
                  <div className="flex items-center justify-between text-slate-400 mb-3">
                    <span className="text-xs font-mono uppercase font-semibold">{stat.label}</span>
                    <Icon size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">{stat.value}</div>
                  <div className="text-[11px] font-mono text-emerald-400/90 mt-1">{stat.trend}</div>
                </MotionCard>
              );
            })}
          </div>

          {/* Core Pillars */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award size={18} className="text-emerald-400" />
                <span>Foundational Governance Pillars</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <MotionCard key={idx} className="p-6 border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon size={20} className={pillar.color} />
                    </div>
                    <h3 className="text-base font-heading font-bold text-white uppercase tracking-wide">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {pillar.desc}
                    </p>
                  </MotionCard>
                );
              })}
            </div>
          </div>

          {/* Ombudsman Council & Leadership */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale size={18} className="text-cyan-400" />
                  <span>The Ombudsman & Redressal Tribunal</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Autonomous statutory body presiding over complex appeals and systemic issues
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ombudsmanCouncil.map((member, idx) => (
                <MotionCard key={idx} className="p-5 border border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {member.badge}
                    </div>
                    <h3 className="font-heading font-bold text-sm text-white">{member.name}</h3>
                    <p className="text-xs font-mono text-emerald-400">{member.role}</p>
                    <p className="text-xs text-slate-400 font-sans">{member.dept}</p>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Statutory Signatory</span>
                  </div>
                </MotionCard>
              ))}
            </div>
          </div>

          {/* Compliance & Legislation Notice */}
          <MotionCard className="p-6 sm:p-8 border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Globe2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-white uppercase tracking-wider">
                  National Compliance & Statutory Framework
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Operating in full accordance with UGC Grievance Redressal Regulations (2023)
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              All grievances logged within ResolveNow are treated as official institutional records. Redressal officers are legally obligated to review and resolve admitted complaints within the prescribed SLA window. Falsification of records, retributive action against grievants, or willful non-compliance constitutes an immediate statutory breach investigated by the Ombudsman Tribunal.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={13} /> ISO-27001 Security Controls</span>
              <span className="flex items-center gap-1.5 text-cyan-400"><CheckCircle2 size={13} /> Digital Personal Data Protection (DPDP) Act Compliant</span>
              <span className="flex items-center gap-1.5 text-indigo-400"><CheckCircle2 size={13} /> Right to Information (RTI) Transparency Audit Trail</span>
            </div>
          </MotionCard>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default AboutPage;
