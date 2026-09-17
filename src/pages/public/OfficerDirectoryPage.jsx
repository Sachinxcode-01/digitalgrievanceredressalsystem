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
  Filter, 
  Award, 
  Scale, 
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  FilePlus,
  HelpCircle,
  GraduationCap,
  Wifi,
  Wrench,
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { useTheme } from '../../app/providers/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();

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
    <AnimatedPage>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Top Control Bar */}
        <div className="w-full max-w-6xl flex items-center justify-between gap-4 mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/50 hover:bg-surface-elevated/40"
          >
            <ChevronLeft size={14} />
            Back to Portal
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/terms"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <Scale size={13} />
              Citizen Charter
            </Link>
            <div className="hidden sm:block h-3 w-px bg-border/60" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/60 bg-surface-elevated/60 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
              title={`Switch to ${theme === 'ocean' ? 'Midnight' : 'Ocean'} Theme`}
              type="button"
            >
              {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="w-full max-w-6xl text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold tracking-wide">
            <ShieldCheck size={14} className="text-indigo-400" />
            Institutional Public Directory • Section 4(1)(b) Compliance
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground">
            Grievance Redressal Officers
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Direct registry of designated institutional officers, department heads, and appellate authorities empowered to investigate and resolve grievances under statutory SLAs.
          </p>
        </div>

        {/* Escalation Matrix Strip */}
        <div className="w-full max-w-6xl mb-8 p-4 rounded-2xl bg-surface-elevated/60 border border-border/60 shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/40">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Level 1 • Frontline GRO</p>
                <p className="text-xs font-bold text-foreground">Department Officers (24h–48h)</p>
                <p className="text-[11px] text-muted-foreground">Initial fact-finding & field resolution</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/40">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-black text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Level 2 • First Appellate</p>
                <p className="text-xs font-bold text-foreground">Nodal Officer & Deans (72h)</p>
                <p className="text-[11px] text-muted-foreground">Appeals on rejected/delayed tickets</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/40">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Level 3 • Apex Ombudsman</p>
                <p className="text-xs font-bold text-foreground">Judicial Tribunal (7 Days)</p>
                <p className="text-[11px] text-muted-foreground">Final institutional statutory binding</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Category Filters */}
        <div className="w-full max-w-6xl space-y-4 mb-8">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by officer name, department, designation, room number, or expertise..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-elevated/70 border border-border text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  type="button"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-surface-elevated/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Officer Cards Grid */}
        <div className="w-full max-w-6xl mb-12">
          {filteredOfficers.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-surface-elevated/40 border border-border/60 space-y-3">
              <AlertCircle size={36} className="mx-auto text-muted-foreground/60" />
              <h3 className="text-base font-bold text-foreground">No Officers Match Your Search</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No official records matched "{searchQuery}". Try searching with a broader keyword or reset the category filter.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOfficers.map((officer) => (
                <motion.div
                  key={officer.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl bg-surface-elevated/70 border border-border/70 hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    {/* Header: Tier Badge & Department */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {officer.tier}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {officer.department}
                      </span>
                    </div>

                    {/* Name & Designation */}
                    <div>
                      <h3 className="text-lg font-heading font-black text-foreground tracking-tight">
                        {officer.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-400">
                        {officer.designation}
                      </p>
                    </div>

                    {/* Officer Details List */}
                    <div className="space-y-2 pt-2 text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-2.5">
                        <MapPin size={14} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{officer.office}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock size={14} className="text-cyan-400 shrink-0" />
                        <span>{officer.hours}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail size={14} className="text-emerald-400 shrink-0" />
                        <a href={`mailto:${officer.email}`} className="hover:text-foreground transition-colors truncate">
                          {officer.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="text-amber-400 shrink-0" />
                        <a href={`tel:${officer.phone}`} className="hover:text-foreground transition-colors">
                          {officer.phone}
                        </a>
                      </div>
                    </div>

                    {/* Portfolio / Scope */}
                    <div className="p-2.5 rounded-xl bg-surface/60 border border-border/40 text-[11px] text-muted-foreground">
                      <span className="font-bold text-foreground">Remit: </span>
                      {officer.experience}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active Redressal Node
                    </span>

                    <Link
                      to={`/submit-grievance?category=${encodeURIComponent(officer.category)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-xs font-bold transition-all shadow-xs"
                    >
                      <FilePlus size={13} />
                      File with Officer
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Help & Support Banner */}
        <div className="w-full max-w-6xl p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-950/40 via-surface-elevated/80 to-cyan-950/30 border border-indigo-500/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-heading font-black text-foreground">
              Unsure Which Officer Handles Your Issue?
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Use our AI Smart Triage intake engine. Submit your narrative, and Google Gemini will automatically analyze frustration scores, classify the sector, and route it to the exact responsible officer within milliseconds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/submit-grievance"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <FilePlus size={14} />
              AI Smart Submission
            </Link>
            <Link
              to="/knowledge-base"
              className="px-5 py-2.5 rounded-xl border border-border hover:bg-surface-elevated text-foreground text-xs font-bold transition-all flex items-center gap-2"
            >
              <HelpCircle size={14} />
              Knowledge Base
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full max-w-6xl pt-6 border-t border-border/40 text-center text-xs font-mono text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} ResolveNow Enterprise Grievance Redressal System • Section 4(1)(b) Right to Information</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-foreground">Citizen Charter</Link>
            <span>•</span>
            <Link to="/feedback" className="hover:text-foreground">Feedback Hub</Link>
            <span>•</span>
            <Link to="/appeal" className="hover:text-foreground">File Appeal</Link>
          </div>
        </footer>

      </div>
    </AnimatedPage>
  );
};

export default OfficerDirectoryPage;
