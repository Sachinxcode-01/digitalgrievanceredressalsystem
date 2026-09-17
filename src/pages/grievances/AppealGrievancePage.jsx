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
  Activity,
  ShieldCheck
} from 'lucide-react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
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
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
          {/* Top Bar Floating Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/grievances" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Grievances Registry</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/terms"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Scale size={13} className="text-rose-400" />
                <span>Escalation Ladder</span>
              </Link>
              <Link
                to="/officers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Building2 size={13} className="text-cyan-400" />
                <span>Officers</span>
              </Link>
            </div>
          </div>

          {/* Header Hero */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-rose-500/10">
              <Scale size={13} />
              <span>Institutional Appellate Tribunal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              File a Grievance Appeal
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              If you believe your grievance was closed prematurely or resolved inadequately, submit a formal petition for higher-tier appellate review.
            </p>
          </div>

          {/* Ticket Selector Card (if not loaded) */}
          {!ticket && (
            <MotionCard className="p-6 space-y-4" tilt={false}>
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchTicket(ticketQuery)}
                  disabled={loadingTicket}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-xl border border-indigo-400/30 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                >
                  {loadingTicket ? 'Searching...' : 'Locate'}
                </button>
              </div>
            </MotionCard>
          )}

          {/* Ticket Context Preview Card */}
          {ticket && (
            <MotionCard className="p-6 space-y-4 border-rose-500/30 shadow-xl shadow-rose-500/10" tilt={false}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    #{ticket.ticket_id || ticket.id}
                  </span>
                  <span className="text-xs font-heading font-bold text-white truncate max-w-md">
                    {ticket.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  Current Status: <strong className="text-white">{ticket.status}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] text-slate-500 block uppercase">Department</span>
                  <span className="text-white font-bold">{ticket.department || 'IT / Campus'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] text-slate-500 block uppercase">Appellate Ladder</span>
                  <span className="text-cyan-400 font-bold">Escalating to Tier 2 (HOD)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] text-slate-500 block uppercase">Appellate SLA Clock</span>
                  <span className="text-amber-400 font-bold">72h Fast-Track</span>
                </div>
              </div>

              {ticket.resolution_notes && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-white/10 text-xs text-slate-300 space-y-1 shadow-inner">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Previous Resolution Summary:</span>
                  <p className="font-sans italic text-slate-400">{ticket.resolution_notes}</p>
                </div>
              )}
            </MotionCard>
          )}

          {/* Formal Appeal Submission Form */}
          <MotionCard className="p-6 sm:p-10 space-y-8" tilt={false}>
            <form onSubmit={handleSubmitAppeal} className="space-y-8">
              
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
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        ground === g
                          ? 'bg-rose-500/15 border-rose-500/60 text-white shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900'
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
                  className="w-full p-4 bg-slate-950/90 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Evidence Upload */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <UploadCloud size={14} className="text-rose-400" />
                  <span>3. Supporting Rebuttal Attachments (Photos, Invoices, Emails)</span>
                </label>
                <div className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-rose-500/40 bg-slate-950/60 text-center space-y-2 transition-colors">
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
                    className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
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

                <AnimatedButton
                  type="submit"
                  variant="danger"
                  size="md"
                  isLoading={submitting}
                  leftIcon={Send}
                >
                  File Formal Appeal (Escalate to Tier 2)
                </AnimatedButton>
              </div>

            </form>
          </MotionCard>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Citizen Redressal System &bull; Statutory Appellate Tribunal</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white">Citizen Charter</Link>
              <span>•</span>
              <Link to="/feedback" className="hover:text-white">Feedback Hub</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            </div>
          </footer>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default AppealGrievancePage;
