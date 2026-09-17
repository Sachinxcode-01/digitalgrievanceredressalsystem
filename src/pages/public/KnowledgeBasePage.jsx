import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Wifi, Wrench, GraduationCap, DollarSign, 
  ShieldAlert, Sparkles, ChevronDown, PhoneCall, ExternalLink, 
  HelpCircle, ArrowRight, CheckCircle2, FileText, ChevronLeft, Mail,
  X, Activity, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';

const CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'IT Support', label: 'Wi-Fi & IT Systems', icon: Wifi },
  { id: 'Academic', label: 'Academics & Attendance', icon: GraduationCap },
  { id: 'Maintenance', label: 'Hostel & Infrastructure', icon: Wrench },
  { id: 'Financial', label: 'Fees & Scholarships', icon: DollarSign },
  { id: 'Safety', label: 'Campus Safety & Emergency', icon: ShieldAlert },
];

const ARTICLES = [
  {
    id: 'kb-wifi-setup',
    category: 'IT Support',
    title: 'How to Connect to Eduroam & Campus High-Speed Wi-Fi',
    summary: 'Step-by-step setup for iOS, Android, macOS, and Windows 10/11 devices.',
    views: '12.4k',
    tags: ['eduroam', 'wi-fi', 'network', 'dns'],
    content: `
      1. Choose **eduroam** or **Campus-Secure** from your Wi-Fi settings.
      2. Set Security to **WPA2-Enterprise** / PEAP.
      3. CA Certificate: Select **Don't validate** or use the campus root cert.
      4. Enter identity as your **RollNumber@campus.edu** and your student portal password.
      5. If your device fails to acquire an IP, open terminal/cmd and run \`ipconfig /release\` then \`ipconfig /renew\`.
    `,
    faq: [
      { q: 'What is the maximum simultaneous devices per student?', a: 'Up to 3 devices (Laptop, Phone, Tablet) can be registered concurrently.' },
      { q: 'How to request MAC whitelist for lab equipment?', a: 'Submit a MAC Whitelist request through the IT Self-Service portal.' }
    ]
  },
  {
    id: 'kb-attendance-exemption',
    category: 'Academic',
    title: 'Medical Leave & Academic Attendance Discrepancy Policy',
    summary: 'Rules for medical exemptions, sporting leave credits, and ERP sync timelines.',
    views: '8.9k',
    tags: ['attendance', 'medical', 'exemption', 'erp'],
    content: `
      - Submit medical prescriptions stamped by the Campus Health Center within 7 working days of resuming classes.
      - A maximum of 10% attendance condonation can be sanctioned under Dean approval for genuine verified hospitalization.
      - Inter-collegiate sports and hackathon participants must obtain faculty advisor pre-approval before departure.
    `,
    faq: [
      { q: 'How often does attendance update in ERP?', a: 'Attendance logs are finalized by professors every Friday at 5:00 PM.' },
      { q: 'What is the minimum threshold required for exam hall tickets?', a: '75% aggregate attendance is mandatory across theory and laboratory subjects.' }
    ]
  },
  {
    id: 'kb-hostel-maintenance',
    category: 'Maintenance',
    title: 'Hostel Room Maintenance & Emergency Technician Timetable',
    summary: 'SOP for electrical repairs, plumbing issues, AC servicing, and room inspection.',
    views: '15.1k',
    tags: ['hostel', 'electrical', 'plumber', 'cleaning'],
    content: `
      - Daily Maintenance Shifts: 09:00 AM - 01:00 PM & 02:00 PM - 06:00 PM.
      - Routine complaints logged via the Caretaker Desk are attended within 4 hours.
      - Emergency electrical faults (sparking, total blackouts) are attended 24/7 by the rapid response squad.
    `,
    faq: [
      { q: 'Are room changes allowed during mid-semester?', a: 'Room adjustments are only permitted under valid medical grounds endorsed by Chief Warden.' },
      { q: 'Who pays for standard fixture replacements?', a: 'Standard wear & tear (tubelight, taps) is fully covered by university facilities.' }
    ]
  },
  {
    id: 'kb-fee-refunds',
    category: 'Financial',
    title: 'Semester Fee Receipts, Payment Reconciliation & Refund SOP',
    summary: 'Guidelines for duplicate deductions, scholarship reimbursements, and tax challans.',
    views: '6.7k',
    tags: ['fee', 'payment', 'refund', 'scholarship'],
    content: `
      - Double Debits: If payment gateway shows 'Pending' but bank account was debited, wait 120 minutes for auto-reversal.
      - Official payment receipts with QR verification can be downloaded instantly from the Student Finance portal.
      - National & State Scholarship DBT funds are credited directly to Aadhaar-seeded bank accounts.
    `,
    faq: [
      { q: 'How do I submit an education loan bank demand letter?', a: 'Upload the bank mandate letter in the Fee Portal under Loan Disbursement section.' },
      { q: 'What is the refund timeline for security deposits on graduation?', a: 'Within 21 working days after final "No Dues" clearance.' }
    ]
  },
  {
    id: 'kb-campus-safety',
    category: 'Safety',
    title: 'Campus Safety, Anti-Ragging Directives & Emergency SOS',
    summary: '24/7 Helpline numbers, Internal Complaints Committee (ICC), and safety escort details.',
    views: '19.3k',
    tags: ['emergency', 'safety', 'anti-ragging', 'security', 'helpline'],
    content: `
      - University maintains a **Zero-Tolerance Policy** against ragging, harassment, and discrimination.
      - Immediate Emergency Control Room: +91 (0) 800-CAMPUS-911 (Ext. 100).
      - Women's Safety Escort & Counseling Cell is available round the clock at Student Welfare Block.
    `,
    faq: [
      { q: 'Are grievance reports completely confidential?', a: 'Yes, anonymous and confidential reporting options are fully enforced by cryptographic hashing.' },
      { q: 'How quickly does the emergency security patrol respond?', a: 'Campus security response vehicles reach any location on campus within 4 minutes.' }
    ]
  }
];

export const KnowledgeBasePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      const matchCat = selectedCategory === 'all' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchQuery = 
        article.title.toLowerCase().includes(q) || 
        article.summary.toLowerCase().includes(q) ||
        article.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

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
                to="/officers"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <BookOpen size={13} className="text-cyan-400" />
                <span>Officers Directory</span>
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
              <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              <span>Citizen Self-Service Knowledge Base</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Instant Knowledge & Policy Guides
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Explore university standard operating procedures, examination rules, hostel guidelines, and automated troubleshooting workflows.
            </p>
          </div>

          {/* Search Bar & Category Chips */}
          <MotionCard className="p-6 space-y-4" tilt={false}>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search solutions (e.g. Wi-Fi setup, attendance condonation, fee receipt, hostel repair)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </MotionCard>

          {/* Articles Section Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-heading font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>{selectedCategory === 'all' ? 'Featured Guides & Solutions' : `${selectedCategory} Guides`}</span>
                <span className="text-xs font-mono text-slate-500">({filteredArticles.length} found)</span>
              </h2>
              <Link
                to="/submit-grievance"
                className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>Cannot find solution? File Grievance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => {
                const isExpanded = expandedArticle === article.id;
                return (
                  <MotionCard
                    key={article.id}
                    className="p-5 flex flex-col justify-between"
                    tilt={false}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {article.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {article.views} reads
                        </span>
                      </div>

                      <h3 className="text-base font-heading font-black text-white leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {article.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {article.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/5 text-slate-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-500/20"
                      >
                        <span>{isExpanded ? 'Collapse Solution' : 'Read Full Standard Operating Procedure'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 space-y-3 text-xs text-slate-300 border-t border-white/10 overflow-hidden"
                          >
                            <div className="bg-slate-950/90 p-4 rounded-xl border border-white/10 whitespace-pre-line leading-relaxed font-sans text-xs text-slate-300 shadow-inner">
                              {article.content}
                            </div>

                            {article.faq && (
                              <div className="space-y-2 pt-2">
                                <p className="font-bold text-[10px] uppercase font-mono tracking-wider text-slate-400">Frequently Asked Questions</p>
                                {article.faq.map((f, i) => (
                                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                                    <p className="font-bold text-white text-xs">Q: {f.q}</p>
                                    <p className="text-slate-400 text-xs leading-relaxed font-sans">A: {f.a}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </MotionCard>
                );
              })}
            </div>

            {filteredArticles.length === 0 && (
              <MotionCard className="p-12 text-center space-y-3" tilt={false}>
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No articles match your search query.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  Need immediate human assistance? Submit a formal grievance and an officer will be dispatched under statutory SLA.
                </p>
                <div className="pt-2">
                  <Link to="/submit-grievance">
                    <AnimatedButton variant="glow" size="sm">
                      Submit Grievance Now
                    </AnimatedButton>
                  </Link>
                </div>
              </MotionCard>
            )}
          </div>

          {/* Campus Emergency Helplines Card */}
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">24/7 Campus Emergency Quick Dial</h3>
                <p className="text-xs text-slate-400 font-sans">For life-safety, medical emergencies, or urgent security threats.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="tel:01128991000"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Security: Ext. 100</span>
              </a>
              <Link
                to="/emergency"
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>All Helplines</span>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Citizen Redressal System &bull; Institutional Knowledge Base</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/whistleblower" className="hover:text-white">Whistleblower Vault</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white">Citizen Charter</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            </div>
          </footer>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default KnowledgeBasePage;
