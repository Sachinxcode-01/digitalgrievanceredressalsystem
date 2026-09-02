import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, ChevronRight, ExternalLink, ThumbsUp, X, BookOpen, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const KNOWLEDGE_BASE_ITEMS = [
  {
    id: 'wifi-dns',
    category: 'IT Support',
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'eduroam', 'slow', 'disconnect', 'login', 'portal'],
    title: 'Instant Wi-Fi & Campus Network Troubleshooting',
    summary: '90% of campus connectivity issues can be fixed without filing a ticket.',
    steps: [
      'Ensure you are connected to "Campus-Secure" or "eduroam" with your official Roll Number username.',
      'Forget the network and reconnect, selecting EAP method: PEAP, Phase 2: MSCHAPv2.',
      'If device MAC is blocked, visit the self-service IT portal at itportal.campus.internal/register.',
      'Flush DNS on Windows: run `ipconfig /flushdns` in Command Prompt.'
    ],
    linkText: 'Open Network Setup Guide'
  },
  {
    id: 'fee-receipt',
    category: 'Financial',
    keywords: ['fee', 'payment', 'receipt', 'scholarship', 'refund', 'challan', 'transaction', 'deducted'],
    title: 'Fee Payment & Receipt Auto-Generation',
    summary: 'Online transactions may take up to 2 hours for automated gateway reconciliation.',
    steps: [
      'If payment is deducted but status says Pending, do not pay twice. Check bank UTR in the Fee Portal.',
      'Instant Fee Receipts can be downloaded at: portal.campus.internal/student/finance/receipts.',
      'Scholarship reimbursement batches are credited on the 15th of every month.'
    ],
    linkText: 'Check Finance FAQs'
  },
  {
    id: 'hostel-repairs',
    category: 'Maintenance',
    keywords: ['hostel', 'fan', 'light', 'plumbing', 'water', 'tap', 'leakage', 'ac', 'cooler', 'geyser', 'bed'],
    title: 'Hostel Routine Maintenance Quick-Service',
    summary: 'Floor technicians are on duty daily between 09:00 AM - 06:00 PM.',
    steps: [
      'Plumbing and electrical repairs registered with the Hostel Caretaker logbook are attended within 4 hours.',
      'For emergency water outage, call the 24/7 Hostel Duty Line directly from the emergency directory.',
      'Room air conditioner servicing is carried out on scheduled alternate Saturdays.'
    ],
    linkText: 'Hostel Maintenance SOP'
  },
  {
    id: 'academic-attendance',
    category: 'Academic',
    keywords: ['attendance', 'medical', 'leave', 'absent', 'shortage', 'internal', 'marks', 'faculty'],
    title: 'Medical Leave & Attendance Exemption SOP',
    summary: 'Medical exemption requests must be submitted within 7 working days of recovery.',
    steps: [
      'Attach valid medical prescription stamped by Campus Health Center Medical Officer.',
      'Submit the verified document to your Department HOD office via the Academic Portal.',
      'Attendance corrections reflect in the ERP system every Friday.'
    ],
    linkText: 'Academic Regulations & Forms'
  },
  {
    id: 'exam-reevaluation',
    category: 'Academic',
    keywords: ['exam', 'marks', 'revaluation', 'grade', 'result', 'paper', 'recheck', 'backlog'],
    title: 'Grade Re-evaluation & Answer Script Inspection',
    summary: 'Re-evaluation applications open for 10 calendar days post result declaration.',
    steps: [
      'Fill the digital Re-evaluation Form in the Examination Portal under "Student Services".',
      'Pay the standard verification fee online; receipt is auto-attached to your roll number.',
      'Evaluated answer sheet photocopy will be dispatched to your university email within 5 working days.'
    ],
    linkText: 'Examination Portal Guidelines'
  }
];

export const KnowledgeDeflector = ({ title = '', description = '', category = '', onDeflected }) => {
  const [matchedArticle, setMatchedArticle] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const text = `${title} ${description} ${category}`.toLowerCase();
    if (text.trim().length < 4) {
      setMatchedArticle(null);
      return;
    }

    const match = KNOWLEDGE_BASE_ITEMS.find(item => {
      if (category && item.category.toLowerCase() === category.toLowerCase()) return true;
      return item.keywords.some(kw => text.includes(kw));
    });

    setMatchedArticle(match || null);
  }, [title, description, category]);

  if (!matchedArticle || isResolved) {
    if (isResolved) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Self-Service Resolution Acknowledged!</p>
              <p className="text-xs text-muted-foreground">Thank you for helping reduce campus ticket volume.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsResolved(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Undo
          </button>
        </motion.div>
      );
    }
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl relative overflow-hidden group shadow-lg transition-all my-4"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                Instant Solution Available
              </span>
              <span className="text-xs text-muted-foreground">• Fast Track</span>
            </div>
            <h4 className="text-sm font-bold text-foreground mt-0.5">{matchedArticle.title}</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded-md bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 flex items-center gap-1 transition-all cursor-pointer"
        >
          {expanded ? 'Hide Guide' : 'View Quick Fix'}
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-2 relative z-10 leading-relaxed">
        {matchedArticle.summary}
      </p>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 pt-3 border-t border-amber-500/20 space-y-2 relative z-10"
          >
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Recommended Immediate Steps:
            </p>
            <ul className="space-y-1.5">
              {matchedArticle.steps.map((step, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2 bg-surface/50 p-2 rounded-lg border border-border/40">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug text-foreground/90">{step}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <Link
                to="/knowledge-base"
                target="_blank"
                className="text-xs text-primary-bright hover:underline flex items-center gap-1 font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Browse Full Knowledge Base
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsResolved(true);
                  if (onDeflected) onDeflected(matchedArticle.id);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ThumbsUp className="w-3 h-3" />
                This Solved My Issue (No Ticket Needed)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default KnowledgeDeflector;
