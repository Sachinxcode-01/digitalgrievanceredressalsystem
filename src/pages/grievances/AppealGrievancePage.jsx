import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, 
  AlertCircle, 
  UploadCloud, 
  Send, 
  ChevronLeft, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ShieldAlert, 
  Search, 
  Layers, 
  ArrowRight,
  HelpCircle,
  Building2,
  Lock,
  Moon,
  Sun
} from 'lucide-react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { useTheme } from '../../app/providers/ThemeProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../api/apiClient';

const APPEAL_GROUNDS = [
  'Inadequate or Incomplete Resolution',
  'Factual Discrepancy or Overlooked Evidence',
  'Recurring Fault / Problem Persists',
  'SLA Breach & Unreasonable Delay',
  'Procedural Irregularity or Officer Bias',
  'Other Substantive Grounds'
];

export const AppealGrievancePage = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [ticketQuery, setTicketQuery] = useState(routeId || searchParams.get('ticket') || searchParams.get('token') || '');
  const [ticket, setTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [ground, setGround] = useState(APPEAL_GROUNDS[0]);
  const [justification, setJustification] = useState('');
  const [certified, setCertified] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTicket = async (targetId) => {
    if (!targetId || !targetId.trim()) return;
    setLoadingTicket(true);
    const cleanId = targetId.trim().replace('#', '');

    try {
      // 1. Try Supabase direct lookup
      const { data, error } = await supabase
        .from('grievances')
        .select('*')
        .or(`id.eq.${cleanId},ticket_id.eq.${cleanId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setTicket(data);
        return;
      }

      // 2. Fallback to API
      const res = await apiClient.get(`/grievances/${cleanId}`);
      if (res.data) {
        setTicket(res.data.grievance || res.data);
      }
    } catch (err) {
      console.warn('Could not fetch ticket details for appeal:', err);
    } finally {
      setLoadingTicket(false);
    }
  };

  useEffect(() => {
    if (ticketQuery) {
      fetchTicket(ticketQuery);
    }
  }, [ticketQuery]);

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!ticket) {
      toast.error('Please specify a valid grievance record to appeal');
      return;
    }
    if (!justification.trim() || justification.trim().length < 20) {
      toast.error('Please provide a detailed appeal justification (at least 20 characters)');
      return;
    }
    if (!certified) {
      toast.error('You must certify that your appeal grounds are truthful and accurate');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reason: `[FORMAL APPEAL]: Grounds: ${ground}. Details: ${justification}`
      };

      // Call reopen endpoint
      const targetId = ticket.id || ticket.ticket_id;
      const res = await apiClient.post(`/grievances/${targetId}/reopen`, payload);

      if (res.status === 200 || res.status === 201) {
        toast.success('Grievance appeal registered. Escalated to Tier 2 Review Tribunal.');
        navigate(`/grievances/${targetId}`);
      } else {
        toast.success('Appellate petition registered for review.');
        navigate('/grievances');
      }
    } catch (err) {
      console.error('Appeal submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to file appeal. Ticket may have exceeded appellate window.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Background mesh lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-125 h-125 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-150 h-150 bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Bar Floating Controls */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          to="/grievances" 
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 hover:text-white uppercase transition-colors"
        >
          <ChevronLeft size={16} />
          Grievances Registry
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/terms"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <Scale size={13} className="text-rose-400" />
            <span>Escalation Ladder</span>
          </Link>

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

      {/* Main Container */}
      <main className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 pb-24 pt-4 space-y-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Scale size={13} />
            <span>Institutional Appellate Tribunal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mb-3">
            File a Grievance Appeal
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed">
            If you believe your grievance was closed prematurely or resolved inadequately, submit a formal petition for higher-tier appellate review.
          </p>
        </div>

        {/* Ticket Selector Card (if not loaded) */}
        {!ticket && (
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl space-y-4">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
              Enter Ticket Reference Key to Appeal
            </label>
            <div className="flex gap-2">
              <div className="relative grow">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={ticketQuery}
                  onChange={(e) => setTicketQuery(e.target.value)}
                  placeholder="e.g. #TKT-2026-8812"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchTicket(ticketQuery)}
                disabled={loadingTicket}
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold uppercase rounded-xl border border-white/10 cursor-pointer disabled:opacity-50"
              >
                {loadingTicket ? 'Searching...' : 'Locate'}
              </button>
            </div>
          </div>
        )}

        {/* Ticket Context Preview Card */}
        {ticket && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-rose-500/20 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  #{ticket.ticket_id || ticket.id}
                </span>
                <span className="text-xs font-heading font-bold text-white truncate max-w-md">
                  {ticket.title}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                Current Status: <strong className="text-white">{ticket.status}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Department</span>
                <span className="text-white font-bold">{ticket.department || 'IT / Campus'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Appellate Ladder</span>
                <span className="text-cyan-400 font-bold">Escalating to Tier 2 (HOD)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Appellate SLA Clock</span>
                <span className="text-amber-400 font-bold">72h Fast-Track</span>
              </div>
            </div>

            {ticket.resolution_notes && (
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Previous Resolution Summary:</span>
                <p className="font-sans italic text-slate-400">{ticket.resolution_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Formal Appeal Submission Form */}
        <form onSubmit={handleSubmitAppeal} className="p-6 sm:p-10 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl space-y-8">
          
          {/* Ground for Appeal */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-400" />
              <span>1. Primary Grounds for Institutional Appeal</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {APPEAL_GROUNDS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGround(g)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    ground === g
                      ? 'bg-rose-500/10 border-rose-500/50 text-white shadow-md shadow-rose-500/10'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${ground === g ? 'bg-rose-400' : 'bg-slate-600'}`} />
                  <span className="text-xs font-heading font-bold truncate">{g}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Justification Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText size={14} className="text-rose-400" />
              <span>2. Detailed Appellate Statement & Counter-Evidence Summary</span>
            </label>
            <textarea
              rows={6}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why the proposed resolution does not solve the root grievance, what facts were overlooked, or what ongoing harm remains..."
              className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 transition-colors resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <UploadCloud size={14} className="text-rose-400" />
              <span>3. Supporting Rebuttal Attachments (Photos, Invoices, Emails)</span>
            </label>
            <div className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-rose-500/40 bg-slate-900/50 text-center space-y-2 transition-colors">
              <UploadCloud size={28} className="mx-auto text-slate-500" />
              <div className="text-xs text-slate-300 font-heading">
                {evidenceFile ? evidenceFile.name : 'Upload supporting rebuttal files (PDF, JPG, PNG up to 10MB)'}
              </div>
              <input
                type="file"
                onChange={(e) => setEvidenceFile(e.target.files[0])}
                className="hidden"
                id="rebuttal-file-input"
              />
              <label
                htmlFor="rebuttal-file-input"
                className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Browse Files
              </label>
            </div>
          </div>

          {/* Legal Certification Checkbox */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
            <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                className="mt-0.5 rounded border-white/20 text-rose-500 focus:ring-0 cursor-pointer w-4 h-4"
              />
              <span className="leading-snug font-sans">
                I formally certify under institutional citizen charter regulations that this appeal is submitted in good faith and that all statements and evidence submitted are genuine.
              </span>
            </label>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/grievances"
              className="text-xs font-mono font-bold text-slate-400 hover:text-white uppercase transition-colors"
            >
              Cancel & Return
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting Appeal...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>File Formal Appeal (Escalate to Tier 2)</span>
                </>
              )}
            </button>
          </div>

        </form>

      </main>
    </AnimatedPage>
  );
};

export default AppealGrievancePage;
