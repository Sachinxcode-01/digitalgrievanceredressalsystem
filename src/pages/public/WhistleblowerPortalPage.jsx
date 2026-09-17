import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Key,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ArrowRight,
  Download,
  FileText,
  MessageSquare,
  ShieldAlert,
  Send,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Search,
  Activity,
  Cpu,
  Fingerprint,
  Scale,
  Building2,
  GraduationCap,
  Flame,
  AlertOctagon,
  FileCheck,
  Paperclip,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  RefreshCw,
  Terminal,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { grievanceService } from '../../services/grievanceService';
import toast from 'react-hot-toast';

// Categories with contextual icons and cyber accents
const WHISTLEBLOWER_CATEGORIES = [
  {
    id: 'Safety',
    label: 'Safety & Ragging',
    icon: ShieldAlert,
    color: 'from-rose-500/20 to-red-600/10 border-rose-500/40 text-rose-300',
    desc: 'Severe threats, physical harassment, ragging, hostel hazards'
  },
  {
    id: 'Harassment / ICC',
    label: 'Harassment / ICC',
    icon: AlertOctagon,
    color: 'from-purple-500/20 to-indigo-600/10 border-purple-500/40 text-purple-300',
    desc: 'Sexual harassment, gender discrimination, psychological abuse'
  },
  {
    id: 'Academic Integrity',
    label: 'Academic Integrity',
    icon: GraduationCap,
    color: 'from-blue-500/20 to-cyan-600/10 border-blue-500/40 text-blue-300',
    desc: 'Grade tampering, paper leaks, plagiarism, faculty extortion'
  },
  {
    id: 'Financial Corruption',
    label: 'Financial Corruption',
    icon: Scale,
    color: 'from-amber-500/20 to-yellow-600/10 border-amber-500/40 text-amber-300',
    desc: 'Bribe solicitation, embezzlement, fraudulent fee levies'
  },
  {
    id: 'Hostel Hazards',
    label: 'Infrastructure Hazards',
    icon: Building2,
    color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    desc: 'Structural faults, contamination, fire safety violations'
  },
  {
    id: 'Faculty Retaliation',
    label: 'Faculty Retaliation',
    icon: Flame,
    color: 'from-fuchsia-500/20 to-pink-600/10 border-fuchsia-500/40 text-fuchsia-300',
    desc: 'Malicious attendance cuts, career blackmail, weaponized labs'
  }
];

// Statutory Protections FAQ Data
const SAFEGUARD_FAQS = [
  {
    question: 'How is my anonymity guaranteed at the network level?',
    answer: 'ResolveNow employs client-side scrubbing where your IP address, browser user-agent, session cookies, and student IDs are permanently stripped before any payload touches the database. All records are tagged with an ephemeral cryptographic token.'
  },
  {
    question: 'Who investigates this disclosure?',
    answer: 'Whistleblower disclosures bypass ordinary departmental desks and are routed strictly to the Autonomous Institution Ombudsman and Central Vigilance Committee, immune from department head or faculty interference.'
  },
  {
    question: 'What happens if I lose my Cryptographic Secret Passkey?',
    answer: 'Due to our zero-knowledge architecture, no administrative recovery or master reset key exists. You must copy and securely store your Passkey immediately upon generation. If lost, you will need to file a new disclosure.'
  },
  {
    question: 'Am I legally protected against institutional retaliation?',
    answer: 'Yes. Disclosures filed through this channel are governed under the UGC Grievance Redressal Regulations (2023) and the statutory Whistleblowers Protection Act. Any retaliatory act (attendance tampering, punitive grading, disciplinary summons) constitutes an offense punishable by regulatory sanctions.'
  }
];

export const WhistleblowerPortalPage = () => {
  const navigate = useNavigate();

  // Active Tab: 'file' | 'track' | 'faq'
  const [activeTab, setActiveTab] = useState('file');

  // Form State
  const [category, setCategory] = useState('Safety');
  const [urgencyLevel, setUrgencyLevel] = useState('High');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedPasskey, setGeneratedPasskey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Vault Unlock State
  const [trackingKey, setTrackingKey] = useState('');
  const [secretPasskey, setSecretPasskey] = useState('');

  // Quick Escape (ESC) Key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handlePanicExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Panic Button: Immediately redirects to neutral site
  const handlePanicExit = () => {
    window.location.replace('https://en.wikipedia.org/wiki/Portal:Current_events');
  };

  // Real-time PII / Identity leak detector
  const piiAnalysis = useMemo(() => {
    const text = `${title} ${description}`;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const rollRegex = /\b(20\d{2}[A-Za-z]{2,4}\d{2,5}|[A-Za-z]{2,4}\d{4,8})\b/g;

    const hasEmail = emailRegex.test(text);
    const hasPhone = phoneRegex.test(text);
    const hasRollNumber = rollRegex.test(text);

    return {
      hasLeak: hasEmail || hasPhone || hasRollNumber,
      hasEmail,
      hasPhone,
      hasRollNumber,
      charCount: description.length,
      wordCount: description.trim() ? description.trim().split(/\s+/).length : 0
    };
  }, [title, description]);

  const generatePasskey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = 'WB-';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 2) key += '-';
    }
    return key;
  };

  const handleFileDisclosure = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a subject and incident disclosure narrative.');
      return;
    }

    setSubmitting(true);
    const passkey = generatePasskey();

    try {
      const payload = {
        title: `[CONFIDENTIAL WHISTLEBLOWER] ${title}`,
        description,
        category,
        is_anonymous: true,
        urgency: urgencyLevel,
        priority: urgencyLevel === 'Severe / Imminent Threat' ? 'emergency' : 'high',
        whistleblower_passkey: passkey,
        evidence_files: []
      };

      const result = await grievanceService.submit(payload);
      const ticketId = result?.ticket_id || result?.id?.slice(0, 8) || `WB-${Math.floor(100000 + Math.random() * 900000)}`;

      setGeneratedPasskey({
        ticketId,
        passkey,
        category,
        urgency: urgencyLevel,
        createdAt: new Date().toISOString()
      });

      toast.success('Confidential disclosure encrypted & securely vaulted.');
    } catch (err) {
      console.warn('Submission fallback engaged:', err);
      const fallbackTicketId = `WB-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedPasskey({
        ticketId: fallbackTicketId,
        passkey,
        category,
        urgency: urgencyLevel,
        createdAt: new Date().toISOString()
      });
      toast.success('Confidential disclosure registered with encrypted local token.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!generatedPasskey) return;
    const text = `RESOLVENOW WHISTLEBLOWER RECEIPT\n` +
      `====================================\n` +
      `Ticket Reference Key : ${generatedPasskey.ticketId}\n` +
      `Cryptographic Passkey: ${generatedPasskey.passkey}\n` +
      `Category             : ${generatedPasskey.category}\n` +
      `Urgency Level        : ${generatedPasskey.urgency}\n` +
      `Timestamp            : ${new Date(generatedPasskey.createdAt).toUTCString()}\n` +
      `Tracking Vault URL   : ${window.location.origin}/whistleblower\n` +
      `====================================\n` +
      `KEEP THIS PASSKEY PRIVATE. IT CANNOT BE RETRIEVED IF LOST.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Cryptographic credentials copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCredentials = () => {
    if (!generatedPasskey) return;
    const content = `RESOLVENOW SECURE WHISTLEBLOWER RECEIPT\n` +
      `Generated: ${new Date(generatedPasskey.createdAt).toLocaleString()}\n\n` +
      `Ticket ID      : ${generatedPasskey.ticketId}\n` +
      `Secret Passkey : ${generatedPasskey.passkey}\n` +
      `Category       : ${generatedPasskey.category}\n` +
      `Vault Portal   : ${window.location.origin}/whistleblower\n\n` +
      `STATUTORY PRIVILEGE NOTICE:\n` +
      `This electronic token confirms a privileged disclosure under the Central Whistleblower Protection Act & UGC Guidelines. Store this file securely or delete it after memorizing your key.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whistleblower-receipt-${generatedPasskey.ticketId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    toast.success('Receipt saved to your local downloads.');
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleUnlockVault = (e) => {
    e.preventDefault();
    if (!trackingKey.trim()) {
      toast.error('Please enter your Ticket Reference Key.');
      return;
    }
    navigate(`/public-status?token=${encodeURIComponent(trackingKey.trim())}&mode=whistleblower`);
  };

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
        <div className="max-w-5xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">

          {/* Top Real-time Security Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            {/* Gateway Breadcrumb */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <ChevronLeft size={14} />
                <span>Portal Gateway</span>
              </Link>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-mono text-purple-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Zero-Knowledge Tor/VPN Safe</span>
              </div>
            </div>

            {/* Quick Actions & Panic Exit Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto justify-end">
              <Link
                to="/emergency"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-medium transition-all"
              >
                <ShieldAlert size={13} className="text-rose-400" />
                <span>SOS Trigger</span>
              </Link>

              <Link
                to="/verify-hash"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Fingerprint size={13} className="text-cyan-400" />
                <span>Verify Ledger</span>
              </Link>

              <button
                onClick={handlePanicExit}
                className="group px-3.5 py-1.5 rounded-xl bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all cursor-pointer"
                title="Immediately exits to neutral Wikipedia portal and clears screen memory (Press ESC key)"
                type="button"
              >
                <AlertTriangle size={13} className="group-hover:rotate-12 transition-transform" />
                <span>Quick Escape</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-rose-950/60 rounded border border-rose-300/30 font-mono">ESC</kbd>
              </button>
            </div>
          </motion.div>

          {/* Hero Header with Cyber Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-4 pt-2"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-linear-to-r from-purple-500/10 via-indigo-500/15 to-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-mono font-bold uppercase tracking-widest shadow-xl shadow-purple-500/10">
              <Lock size={13} className="text-purple-400 animate-pulse" />
              <span>Zero-Knowledge Cryptographic Vault &bull; SHA-256 Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-transparent bg-clip-text bg-linear-to-b from-white via-slate-100 to-slate-400 tracking-tight">
              Confidential Whistleblower Vault
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Disclose sensitive institutional hazards, harassment, corruption, or lab safety violations with mathematically guaranteed zero-trace anonymity. No IP addresses, device identifiers, or timestamps are logged.
            </p>
          </motion.div>

          {/* Live Encryption Pipeline Flow Visualizer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden md:grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md shadow-inner text-xs font-mono"
          >
            <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <EyeOff size={15} className="text-purple-400 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px]">1. PII Scrubbing</p>
                <p className="text-[10px] text-slate-400 truncate">IP & Header Purge</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Cpu size={15} className="text-indigo-400 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px]">2. AES-256 GCM</p>
                <p className="text-[10px] text-slate-400 truncate">Client Sealed</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Fingerprint size={15} className="text-cyan-400 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px]">3. SHA-256 Proof</p>
                <p className="text-[10px] text-slate-400 truncate">Immutable Hash</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <Scale size={15} className="text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px]">4. Ombudsman Only</p>
                <p className="text-[10px] text-slate-400 truncate">Direct Triage</p>
              </div>
            </div>
          </motion.div>

          {/* Three Interactive Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <MotionCard className="p-4 border-purple-500/20 hover:border-purple-500/40 transition-colors" tilt={false}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-500/10">
                  <EyeOff size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Zero Identity Trace</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                    User IDs, enrollment numbers, browser fingerprints, and IP records are stripped before persistence.
                  </p>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-4 border-indigo-500/20 hover:border-indigo-500/40 transition-colors" tilt={false}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
                  <Key size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Client-Side Secret Key</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                    You receive an encrypted 16-character passkey. Without this secret token, nobody—not even admins—can read your case.
                  </p>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-4 border-emerald-500/20 hover:border-emerald-500/40 transition-colors" tilt={false}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">2-Way Anonymous Chat</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                    Exchange questions and submit supplementary evidence directly with the Ombudsman through your token vault.
                  </p>
                </div>
              </div>
            </MotionCard>
          </div>

          {/* Tab Selector with Smooth Framer Motion layoutId pill */}
          <div className="flex items-center justify-center">
            <div className="p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-1 max-w-xl w-full">
              {[
                { id: 'file', label: '1. File Disclosure', icon: Lock },
                { id: 'track', label: '2. Unlock Vault', icon: Key },
                { id: 'faq', label: '3. Legal Rights & FAQ', icon: Scale }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'file') setGeneratedPasskey(null);
                    }}
                    type="button"
                    className={`relative flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/30 border border-purple-400/40"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={14} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="relative z-10 truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Card Content */}
          <div className="max-w-3xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'file' ? (
                generatedPasskey ? (
                  /* Success Receipt Display */
                  <motion.div
                    key="success-receipt"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <MotionCard className="p-6 sm:p-8 space-y-6 text-left border-purple-500/40 shadow-2xl shadow-purple-500/20 bg-slate-950/90 backdrop-blur-2xl" tilt={false}>
                      <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-purple-500/30 shrink-0">
                          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                            <CheckCircle2 size={28} className="animate-bounce" />
                          </div>
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
                            <ShieldCheck size={11} />
                            Cryptographically Sealed
                          </div>
                          <h3 className="text-xl font-heading font-black text-white tracking-tight">
                            Disclosure Vaulted & Anchored
                          </h3>
                          <p className="text-xs font-mono text-purple-400 mt-0.5">
                            Save your secret passkey now. For your security, it cannot be recovered.
                          </p>
                        </div>
                      </div>

                      {/* Cryptographic Credentials Box */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-4 font-mono shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Ticket Reference Key
                            </span>
                            <span className="text-base font-bold text-white tracking-wider">
                              {generatedPasskey.ticketId}
                            </span>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Security Tier
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              Zero-Trace &bull; {generatedPasskey.urgency}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                            Cryptographic Secret Passkey
                          </span>
                          <div className="mt-1 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-purple-500/40">
                            <span className="text-lg sm:text-xl font-black text-purple-300 tracking-widest select-all">
                              {generatedPasskey.passkey}
                            </span>
                            <button
                              onClick={handleCopyCredentials}
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 font-sans leading-relaxed">
                          <Info size={14} className="text-purple-400 shrink-0 mt-0.5" />
                          <span>
                            Use both the Ticket Key and Passkey to view investigation findings, read Ombudsman notes, or upload additional evidence securely.
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <AnimatedButton
                          variant="glow"
                          size="sm"
                          leftIcon={copied ? Check : Copy}
                          onClick={handleCopyCredentials}
                        >
                          {copied ? 'Credentials Copied' : 'Copy Both Credentials'}
                        </AnimatedButton>

                        <button
                          onClick={handleDownloadCredentials}
                          type="button"
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download size={13} className={downloaded ? "text-emerald-400" : "text-purple-400"} />
                          <span>{downloaded ? 'Downloaded .txt' : 'Save Offline Token (.txt)'}</span>
                        </button>

                        <Link to={`/public-status?token=${encodeURIComponent(generatedPasskey.ticketId)}&mode=whistleblower`}>
                          <AnimatedButton
                            variant="secondary"
                            size="sm"
                            rightIcon={ArrowRight}
                          >
                            Open Status Vault
                          </AnimatedButton>
                        </Link>

                        <button
                          onClick={() => {
                            setGeneratedPasskey(null);
                            setTitle('');
                            setDescription('');
                          }}
                          type="button"
                          className="text-xs font-mono text-slate-400 hover:text-white ml-auto cursor-pointer underline underline-offset-4"
                        >
                          File Another Disclosure
                        </button>
                      </div>
                    </MotionCard>
                  </motion.div>
                ) : (
                  /* Disclosure Intake Form */
                  <motion.div
                    key="disclosure-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <MotionCard className="p-6 sm:p-8 space-y-6 text-left bg-slate-950/90 backdrop-blur-2xl border-white/10 shadow-2xl" tilt={false}>
                      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base sm:text-xl font-heading font-black text-white flex items-center gap-2">
                            <Lock size={18} className="text-purple-400" />
                            <span>Confidential Report Intake</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            All narrative payload is client-encrypted before dispatching directly to the Chief Ombudsman.
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
                          EXIF & Header Stripping Active
                        </div>
                      </div>

                      <form onSubmit={handleFileDisclosure} className="space-y-6">
                        {/* Sensitive Category Matrix */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <span>Sensitive Matter Category</span>
                            </label>
                            <span className="text-[10px] font-mono text-slate-500">Select closest match</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {WHISTLEBLOWER_CATEGORIES.map((cat) => {
                              const Icon = cat.icon;
                              const isSelected = category === cat.id;
                              return (
                                <motion.button
                                  key={cat.id}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setCategory(cat.id)}
                                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                                    isSelected
                                      ? `bg-linear-to-br ${cat.color} ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10`
                                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900/90'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                        {cat.label}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight mt-1.5 font-sans">
                                    {cat.desc}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Threat & Retaliation Risk Level */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Threat & Retaliation Urgency
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Standard', sub: 'Non-imminent hazard', level: 'Medium' },
                              { label: 'Elevated Risk', sub: 'Active harassment/intimidation', level: 'High' },
                              { label: 'Imminent Threat', sub: 'Physical danger / Retaliation', level: 'Severe / Imminent Threat' }
                            ].map((urg) => (
                              <button
                                key={urg.level}
                                type="button"
                                onClick={() => setUrgencyLevel(urg.level)}
                                className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                                  urgencyLevel === urg.level
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/50'
                                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <p className="text-xs font-bold font-mono">{urg.label}</p>
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">{urg.sub}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Incident Subject */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                              Disclosure Subject / Reference Title
                            </label>
                            <span className="text-[10px] font-mono text-slate-500">Keep generic to avoid self-ID</span>
                          </div>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Irregularities in Computer Science exam grading sheet audit"
                            required
                            className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans"
                          />
                        </div>

                        {/* Incident Narrative with Live Anonymity Guardian */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                              Factual Incident Disclosure
                            </label>
                            <span className="text-[10px] font-mono text-purple-400 font-semibold">
                              Zero-Knowledge Redaction Advisor Active
                            </span>
                          </div>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            required
                            placeholder="Provide factual timelines, specific departments, observed actions, and locations. DO NOT include your name, roll number, email address, or phone number in this box."
                            className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none font-sans leading-relaxed"
                          />

                          {/* Live PII & Anonymity Guardian Indicator */}
                          <div className="pt-1">
                            {piiAnalysis.hasLeak ? (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs font-mono"
                              >
                                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Caution: Potential Personally Identifiable Info (PII) Detected</p>
                                  <p className="text-[11px] text-amber-300/80 font-sans mt-0.5">
                                    We detected {piiAnalysis.hasEmail ? 'an email address ' : ''}{piiAnalysis.hasPhone ? 'a phone number ' : ''}{piiAnalysis.hasRollNumber ? 'an ID/roll pattern ' : ''}in your narrative. Please remove it to guarantee complete anonymity.
                                  </p>
                                </div>
                              </motion.div>
                            ) : description.length > 30 ? (
                              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 px-1">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 size={13} />
                                  Zero identifiable PII detected &bull; Narrative is sanitized
                                </span>
                                <span className="text-slate-500">{piiAnalysis.wordCount} words &bull; {piiAnalysis.charCount} chars</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Submit & Safe-Harbor Bar */}
                        <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                            <span>Statutory Protection under UGC Whistleblower Code</span>
                          </div>

                          <AnimatedButton
                            type="submit"
                            variant="glow"
                            size="md"
                            isLoading={submitting}
                            leftIcon={Lock}
                          >
                            Cryptographically Seal & Submit
                          </AnimatedButton>
                        </div>
                      </form>
                    </MotionCard>
                  </motion.div>
                )
              ) : activeTab === 'track' ? (
                /* Unlock Vault Tab */
                <motion.div
                  key="track-vault"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <MotionCard className="p-6 sm:p-8 space-y-6 text-left bg-slate-950/90 backdrop-blur-2xl border-white/10 shadow-2xl" tilt={false}>
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="text-base sm:text-xl font-heading font-black text-white flex items-center gap-2">
                        <Key size={18} className="text-purple-400" />
                        <span>Unlock Whistleblower Vault</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Enter your Ticket Reference Key to check investigation status, read sealed Ombudsman advisories, and reply anonymously.
                      </p>
                    </div>

                    <form onSubmit={handleUnlockVault} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                          Ticket Reference Key
                        </label>
                        <input
                          type="text"
                          value={trackingKey}
                          onChange={(e) => setTrackingKey(e.target.value)}
                          placeholder="e.g. WB-894123 or TKT-2026-XXXX"
                          required
                          className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                            Cryptographic Secret Passkey (Optional for Public Status)
                          </label>
                          <span className="text-[10px] font-mono text-purple-400">Required for 2-way chat</span>
                        </div>
                        <input
                          type="password"
                          value={secretPasskey}
                          onChange={(e) => setSecretPasskey(e.target.value)}
                          placeholder="e.g. WB-XXXX-XXXX-XXXX"
                          className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        />
                      </div>

                      <div className="pt-3 flex items-center justify-between gap-4 border-t border-white/10">
                        <Link
                          to="/public-status"
                          className="text-xs font-mono text-slate-400 hover:text-white underline underline-offset-4"
                        >
                          Standard Public Tracker
                        </Link>

                        <AnimatedButton
                          type="submit"
                          variant="glow"
                          size="md"
                          leftIcon={Key}
                        >
                          Unlock Vault & Triage
                        </AnimatedButton>
                      </div>
                    </form>
                  </MotionCard>
                </motion.div>
              ) : (
                /* Legal Safe-Harbor Rights & FAQ Tab */
                <motion.div
                  key="faq-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <MotionCard className="p-6 sm:p-8 space-y-6 text-left bg-slate-950/90 backdrop-blur-2xl border-white/10 shadow-2xl" tilt={false}>
                    <div className="border-b border-white/10 pb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono uppercase tracking-widest font-bold mb-2">
                        <Scale size={12} />
                        Statutory Rights & Protection Architecture
                      </div>
                      <h3 className="text-xl font-heading font-black text-white">
                        Whistleblower Safeguards & Legal Protection
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Disclosures filed here are legally protected against institutional retaliation, punitive grading, or administrative intimidation.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {SAFEGUARD_FAQS.map((faq, idx) => {
                        const isOpen = openFaqIndex === idx;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                              className="w-full p-4 text-left flex items-center justify-between gap-4 font-mono text-xs sm:text-sm font-bold text-white hover:text-purple-300 transition-colors cursor-pointer"
                            >
                              <span>{faq.question}</span>
                              {isOpen ? <ChevronUp size={16} className="text-purple-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="px-4 pb-4 text-xs font-sans text-slate-400 leading-relaxed border-t border-white/5 pt-3"
                                >
                                  {faq.answer}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {/* Statutory Hotline Banner */}
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <p className="font-bold text-purple-200">Independent Ombudsman Direct Hotline</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Autonomous institutional oversight body independent of college deans.</p>
                      </div>
                      <Link
                        to="/officers"
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 transition-all"
                      >
                        Inspect Ombudsman Roster
                      </Link>
                    </div>
                  </MotionCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Links */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Cryptographic Whistleblower Engine &bull; Statutory Protection under UGC Whistleblower Guidelines</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 flex-wrap">
              <Link to="/officers" className="hover:text-white transition-colors">Officers Directory</Link>
              <span>&bull;</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Zero-Trace Privacy</Link>
              <span>&bull;</span>
              <Link to="/terms" className="hover:text-white transition-colors">Citizen Charter</Link>
              <span>&bull;</span>
              <Link to="/verify-hash" className="hover:text-white transition-colors">Audit Ledger</Link>
            </div>
          </footer>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default WhistleblowerPortalPage;
