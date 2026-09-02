import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Wifi, Wrench, GraduationCap, DollarSign, 
  ShieldAlert, Sparkles, ChevronDown, PhoneCall, ExternalLink, 
  HelpCircle, ArrowRight, CheckCircle2, FileText, ArrowLeft, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';

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
    <AnimatedPage className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/50 bg-surface/30 backdrop-blur-md pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-bright/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-bright/10 border border-primary-bright/20 text-primary-bright text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Citizen Self-Service Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground">
            How can we help you today?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Search our comprehensive knowledge base of university standard operating procedures, policies, and instant troubleshooting guides.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search solutions (e.g., Wi-Fi login, fee receipt, attendance, medical leave)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface/80 border border-border/80 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary-bright/30 focus:border-primary-bright shadow-lg backdrop-blur-xl transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded-md bg-muted/40"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-bright text-white shadow-md shadow-primary-bright/20 font-bold'
                    : 'bg-surface/60 hover:bg-surface border border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Knowledge Articles Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-bright" />
              {selectedCategory === 'all' ? 'Featured Guides & Solutions' : `${selectedCategory} Guides`}
              <span className="text-xs font-normal text-muted-foreground">({filteredArticles.length} found)</span>
            </h2>
            <Link
              to="/grievances/submit"
              className="text-xs font-semibold text-primary-bright hover:underline flex items-center gap-1"
            >
              Cannot find solution? Submit Grievance <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => {
              const isExpanded = expandedArticle === article.id;
              return (
                <MotionCard
                  key={article.id}
                  className="p-5 border border-border/80 bg-surface/70 backdrop-blur-md rounded-2xl flex flex-col justify-between hover:border-primary-bright/40 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-bright/10 text-primary-bright border border-primary-bright/20">
                        {article.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {article.views} reads
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {article.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {article.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                      className="w-full py-2 px-3 rounded-xl bg-primary-bright/5 hover:bg-primary-bright/10 text-primary-bright text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isExpanded ? 'Collapse Solution' : 'Read Full Standard Operating Procedure'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 space-y-3 text-xs text-foreground/90 border-t border-border/40"
                        >
                          <div className="bg-background/80 p-3.5 rounded-xl border border-border/60 whitespace-pre-line leading-relaxed font-sans text-xs">
                            {article.content}
                          </div>

                          {article.faq && (
                            <div className="space-y-2 pt-2">
                              <p className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Frequently Asked Questions</p>
                              {article.faq.map((f, i) => (
                                <div key={i} className="p-2.5 rounded-lg bg-surface/50 border border-border/40 space-y-1">
                                  <p className="font-semibold text-foreground text-xs">Q: {f.q}</p>
                                  <p className="text-muted-foreground text-xs leading-relaxed">A: {f.a}</p>
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
            <div className="p-12 text-center rounded-2xl border border-border/80 bg-surface/40 space-y-3">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No articles match your search query.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Need immediate human assistance? Submit a formal grievance and an officer will be dispatched under SLA.
              </p>
              <Link
                to="/grievances/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-bright text-white text-xs font-bold"
              >
                Submit Grievance Now
              </Link>
            </div>
          )}
        </div>

        {/* Campus Emergency Helplines Card */}
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">24/7 Campus Emergency Quick Dial</h3>
                <p className="text-xs text-muted-foreground">For life-safety, medical emergencies, or urgent security threats.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="tel:100"
                className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-rose-600 transition-colors shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Security SOS: Ext. 100
              </a>
              <a
                href="tel:108"
                className="px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                Health Clinic: Ext. 104
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default KnowledgeBasePage;
