import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  UserCheck, 
  ChevronLeft, 
  ExternalLink, 
  Scale, 
  ArrowRight,
  AlertCircle,
  FilePlus,
  HelpCircle,
  GraduationCap,
  Wifi,
  Wrench,
  DollarSign,
  ShieldAlert,
  Sparkles,
  Activity,
  Layers,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

const DIRECTORY_DATA = [
  {
    id: 'gro-ombudsman',
    name: 'Justice (Retd.) K. R. Ramanathan',
    designation: 'Institutional Ombudsman & Appellate Authority',
    department: 'Ombudsman',
    category: 'Ombudsman',
    tier: 'Tier 3 (Appellate)',
    email: 'ombudsman@resolvenow.gov.in',
    phone: '+91 (011) 2899-4001',
    office: 'Block A, Executive Secretariat, 4th Floor',
    hours: 'Mon, Wed, Fri • 14:00 – 17:00',
    experience: 'Former High Court Judge • Judicial Redressal',
    badge: 'Statutory Authority',
    badgeColor: 'amber'
  },
  {
    id: 'gro-nodal',
    name: 'Dr. Sunita Deshmukh, Ph.D.',
    designation: 'Chief Nodal Grievance Officer & Dean Student Affairs',
    department: 'Central Administration',
    category: 'Central',
    tier: 'Tier 2 (Nodal)',
    email: 'nodal.officer@resolvenow.gov.in',
    phone: '+91 (011) 2899-4020',
    office: 'Administrative Block, Suite 204',
    hours: 'Mon – Fri • 10:00 – 17:00',
    experience: '18 Years Academic Administration',
    badge: 'Chief Nodal',
    badgeColor: 'indigo'
  },
  {
    id: 'gro-it',
    name: 'Er. Rajeshwar Verma',
    designation: 'Director of ICT & Chief Technical Officer',
    department: 'IT Support',
    category: 'IT Support',
    tier: 'Tier 1 (Departmental GRO)',
    email: 'it.grievances@resolvenow.gov.in',
    phone: '+91 (011) 2899-4555',
    office: 'Computing Center, Level 1, Room CC-102',
    hours: 'Mon – Sat • 09:00 – 18:00',
    experience: 'Network Infrastructure, ERP & Cybersecurity',
    badge: 'Fast SLA <24h',
    badgeColor: 'cyan'
  },
  {
    id: 'gro-acad',
    name: 'Prof. Ananya Mukherjee',
    designation: 'Controller of Examinations & Academic Registrar',
    department: 'Academic',
    category: 'Academic',
    tier: 'Tier 1 (Departmental GRO)',
    email: 'academic.cell@resolvenow.gov.in',
    phone: '+91 (011) 2899-4112',
    office: 'Academic Senate Wing, Room SW-301',
    hours: 'Mon – Fri • 10:30 – 16:30',
    experience: 'Curriculum, Grade Audits & Attendance Condonation',
    badge: 'Academic Cell',
    badgeColor: 'emerald'
  },
  {
    id: 'gro-maint',
    name: 'Er. Vikram Malhotra',
    designation: 'Chief Estate Officer & Facilities Superintendent',
    department: 'Maintenance',
    category: 'Maintenance',
    tier: 'Tier 1 (Departmental GRO)',
    email: 'estate.care@resolvenow.gov.in',
    phone: '+91 (011) 2899-4780',
    office: 'Estate Office, Maintenance Depot 2',
    hours: '24x7 Emergency Line • Office: 08:30 – 17:30',
    experience: 'Civil Works, Electrical Grids & Water Supply',
    badge: '24/7 Field Team',
    badgeColor: 'cyan'
  },
  {
    id: 'gro-fin',
    name: 'Shri Arvind Narayanan, FCA',
    designation: 'Joint Finance Comptroller & Student Accounts Officer',
    department: 'Financial',
    category: 'Financial',
    tier: 'Tier 1 (Departmental GRO)',
    email: 'finance.grievance@resolvenow.gov.in',
    phone: '+91 (011) 2899-4330',
    office: 'Bursar Building, Counter 6',
    hours: 'Mon – Fri • 10:00 – 15:30',
    experience: 'Scholarships, Fee Discrepancies & Refund Audits',
    badge: 'Fee Discrepancies',
    badgeColor: 'indigo'
  },
  {
    id: 'gro-safety',
    name: 'Dr. Priya Sundaram',
    designation: 'Chairperson, Internal Complaints Committee (ICC)',
    department: 'Safety',
    category: 'Safety',
    tier: 'Tier 1 & 2 (Confidential)',
    email: 'icc.chair@resolvenow.gov.in',
    phone: '+91 (011) 2899-SAFE (7233)',
    office: 'Confidential Redressal Suite, Health Center Annex',
    hours: '24/7 Emergency Support • Walk-in: 09:00 – 17:00',
    experience: 'POSH Act Compliance & Campus Safety',
    badge: '100% Confidential',
    badgeColor: 'emerald'
  },
  {
    id: 'gro-hostel',
    name: 'Dr. Harpreet Singh Gill',
    designation: 'Chief Proctor & Chief Warden Council Head',
    department: 'Hostel & Proctorial',
    category: 'Maintenance',
    tier: 'Tier 1 (Departmental GRO)',
    email: 'proctor.cell@resolvenow.gov.in',
    phone: '+91 (011) 2899-4890',
    office: 'Proctorial Complex, Gate 3',
    hours: 'Daily • 11:00 – 18:00',
    experience: 'Hostel Allotment, Mess Hygiene & Disciplinary Appeals',
    badge: 'Proctorial Head',
    badgeColor: 'indigo'
  }
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Officers', icon: UserCheck },
  { id: 'IT Support', label: 'IT & Systems', icon: Wifi },
  { id: 'Academic', label: 'Academic & Exams', icon: GraduationCap },
  { id: 'Maintenance', label: 'Estate & Hostel', icon: Wrench },
  { id: 'Financial', label: 'Finance & Accounts', icon: DollarSign },
  { id: 'Safety', label: 'Safety & ICC', icon: ShieldAlert },
  { id: 'Ombudsman', label: 'Ombudsman Tribunal', icon: Scale },
];

export const OfficerDirectoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredOfficers = useMemo(() => {
    return DIRECTORY_DATA.filter((officer) => {
      const matchesCategory = selectedCategory === 'all' || officer.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        officer.name.toLowerCase().includes(q) ||
        officer.designation.toLowerCase().includes(q) ||
        officer.department.toLowerCase().includes(q) ||
        officer.experience.toLowerCase().includes(q) ||
        officer.office.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Scale size={13} className="text-cyan-400" />
                <span>Citizen Charter</span>
              </Link>
              <Link
                to="/status"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Activity size={13} className="text-emerald-400" />
                <span>System Status</span>
              </Link>
              <Link
                to="/verify-hash"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <ShieldCheck size={13} className="text-indigo-400" />
                <span>Verify Proof</span>
              </Link>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/10">
              <ShieldCheck size={14} className="text-indigo-400 animate-pulse" />
              <span>Institutional Public Directory • Statutory RTI Section 4(1)(b)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Grievance Redressal Officers
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Official roster of designated institutional officers, department heads, and appellate authorities empowered to investigate and resolve grievances under statutory SLAs.
            </p>
          </div>

          {/* 3-Tier Escalation Matrix Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MotionCard className="p-4" tilt={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm shrink-0">
                  1
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Tier 1 • Departmental GRO</p>
                  <p className="text-xs font-bold text-white">Frontline Officers (24h–48h SLA)</p>
                  <p className="text-[11px] text-slate-400">Initial fact-finding & field resolution</p>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-4" tilt={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-black text-sm shrink-0">
                  2
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Tier 2 • First Appellate</p>
                  <p className="text-xs font-bold text-white">Nodal Officers & Deans (72h SLA)</p>
                  <p className="text-[11px] text-slate-400">Appeals on rejected or delayed cases</p>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-4" tilt={false}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm shrink-0">
                  3
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Tier 3 • Apex Ombudsman</p>
                  <p className="text-xs font-bold text-white">Judicial Tribunal (7–10 Days)</p>
                  <p className="text-[11px] text-slate-400">Statutory binding administrative orders</p>
                </div>
              </div>
            </MotionCard>
          </div>

          {/* Search Bar & Category Filter Chips */}
          <MotionCard className="p-6 space-y-4" tilt={false}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by officer name, department, designation, room number, or remit..."
                className="w-full pl-11 pr-10 py-3.5 bg-slate-950/90 border border-white/10 rounded-xl font-mono text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    type="button"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </MotionCard>

          {/* Officers Grid */}
          <div>
            {filteredOfficers.length === 0 ? (
              <MotionCard className="text-center py-16 px-4 space-y-3" tilt={false}>
                <AlertCircle size={36} className="mx-auto text-slate-500" />
                <h3 className="text-base font-bold text-white">No Officers Match Your Search</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No official records matched "{searchQuery}". Try searching with a broader keyword or reset the category filter.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </MotionCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredOfficers.map((officer) => (
                  <MotionCard
                    key={officer.id}
                    className="p-6 flex flex-col justify-between space-y-5"
                    tilt={false}
                  >
                    <div className="space-y-3">
                      {/* Header: Tier Badge & Department */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {officer.tier}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {officer.department}
                        </span>
                      </div>

                      {/* Name & Designation */}
                      <div>
                        <h3 className="text-lg font-heading font-black text-white tracking-tight">
                          {officer.name}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-400">
                          {officer.designation}
                        </p>
                      </div>

                      {/* Officer Details List */}
                      <div className="space-y-2 pt-2 text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-2.5">
                          <MapPin size={14} className="text-indigo-400 shrink-0" />
                          <span className="truncate text-slate-300">{officer.office}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock size={14} className="text-cyan-400 shrink-0" />
                          <span>{officer.hours}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-emerald-400 shrink-0" />
                          <a href={`mailto:${officer.email}`} className="hover:text-white transition-colors truncate">
                            {officer.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-amber-400 shrink-0" />
                          <a href={`tel:${officer.phone}`} className="hover:text-white transition-colors">
                            {officer.phone}
                          </a>
                        </div>
                      </div>

                      {/* Portfolio / Remit */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] text-slate-400 font-sans leading-relaxed">
                        <span className="font-bold text-white">Remit: </span>
                        {officer.experience}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active Redressal Node
                      </span>

                      <Link
                        to={`/submit-grievance?category=${encodeURIComponent(officer.category)}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-mono font-bold transition-all shadow-sm"
                      >
                        <FilePlus size={13} />
                        <span>File with Officer</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </MotionCard>
                ))}
              </div>
            )}
          </div>

          {/* AI Intake Assistance Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-950/50 via-purple-950/40 to-slate-950/90 border border-indigo-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-heading font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles size={18} className="text-amber-400" />
                <span>Unsure Which Officer Handles Your Issue?</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl font-sans leading-relaxed">
                Use our AI Smart Triage engine. File your issue and Google Gemini will automatically analyze frustration scores, classify the sector, and route it to the exact responsible officer within milliseconds.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/submit-grievance">
                <AnimatedButton
                  variant="glow"
                  size="sm"
                  leftIcon={FilePlus}
                >
                  AI Smart Submission
                </AnimatedButton>
              </Link>
              <Link to="/knowledge-base">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  leftIcon={HelpCircle}
                >
                  Knowledge Base
                </AnimatedButton>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Enterprise Grievance Redressal System &bull; Section 4(1)(b) Right to Information</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
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

export default OfficerDirectoryPage;
