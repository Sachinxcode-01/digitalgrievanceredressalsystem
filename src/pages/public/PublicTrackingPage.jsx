import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, AlertCircle, ChevronLeft, Landmark, Activity, CheckCircle2, QrCode, Download, ShieldCheck, Copy, FileDown, Check, Smartphone, Zap, Lock, FileText, RotateCcw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../api/apiClient';
import StatusBadge from '../../components/ui/StatusBadge';
import SlaRiskBadge from '../../components/ui/SlaRiskBadge';
import SlaRadialCountdown from '../../components/ui/SlaRadialCountdown';
import GrievanceWorkflowTimeline from '../../components/grievances/GrievanceWorkflowTimeline';
import CommunityPetitionWidget from '../../components/grievances/CommunityPetitionWidget';
import MobileNotificationSimulatorModal from '../../components/notifications/MobileNotificationSimulatorModal';
import MultilingualTranslator from '../../components/ai/MultilingualTranslator';
import AudioStatusReader from '../../components/ui/AudioStatusReader';
import SmsWhatsAppOptInCard from '../../components/ui/SmsWhatsAppOptInCard';
import PrintableQrReceipt from '../../components/ui/PrintableQrReceipt';
import SlaCountdownTimer from '../../components/grievances/SlaCountdownTimer';
import { generateAcknowledgmentReceipt, generateResolutionCertificate } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import TrackingTimeline from '../../components/ui/TrackingTimeline';

export const PublicStatusPage = () => {
  const [searchParams] = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get('token') || searchParams.get('ticket') || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);

  const fetchTicketDetails = async (idToFetch) => {
    if (!idToFetch || !idToFetch.trim()) return;
    
    setLoading(true);
    setError('');
    setTicket(null);

    const cleanId = idToFetch.trim();

    try {
      // 1. Try Supabase Direct Query first
      const { data, error: dbError } = await supabase
        .from('grievances')
        .select('*')
        .eq('ticket_id', cleanId)
        .limit(1)
        .maybeSingle();

      if (!dbError && data) {
        setTicket(data);
        setLoading(false);
        return;
      }

      // 2. Fallback to REST API Endpoint
      const apiRes = await apiClient.get(`/public/track/${cleanId}`);
      if (apiRes.data && apiRes.data.ticket_id) {
        setTicket(apiRes.data);
      } else {
        setError('Reference Ticket ID not found in system records.');
      }
    } catch {
      setError('Reference Ticket ID not found in system records.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const paramTicket = searchParams.get('token') || searchParams.get('ticket');
    if (paramTicket) {
      setTicketId(paramTicket);
      fetchTicketDetails(paramTicket);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTicketDetails(ticketId);
  };

  const [trackingMode, setTrackingMode] = useState('standard'); // 'standard' | 'whistleblower'
  const [anonPasskey, setAnonPasskey] = useState('');
  const [anonMessage, setAnonMessage] = useState('');
  const [isSubmittingAnonMsg, setIsSubmittingAnonMsg] = useState(false);
  const [anonChatMessages, setAnonChatMessages] = useState([]);

  const handleWhistleblowerTrack = async (e) => {
    if (e) e.preventDefault();
    if (!ticketId || !anonPasskey) {
      toast.error('Whistleblower Tracking Reference Key and Secret Passkey required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/public/anonymous/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketKey: ticketId.trim(), secretPasskey: anonPasskey.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicket(data.ticket);
        toast.success('Whistleblower Vault unlocked successfully.');
      } else {
        setError(data.error || 'Invalid Whistleblower tracking reference or secret passkey.');
      }
    } catch {
      setError('Whistleblower vault verification unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnonMessage = async (e) => {
    e.preventDefault();
    if (!anonMessage.trim()) return;
    setIsSubmittingAnonMsg(true);
    try {
      const res = await fetch('/api/v1/public/anonymous/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketKey: ticket.ticket_id,
          secretPasskey: anonPasskey || ticket.secret_passkey,
          messageText: anonMessage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Anonymous note delivered to department officer.');
        setAnonChatMessages(prev => [...prev, { sender: 'Whistleblower', text: anonMessage, time: 'Just now' }]);
        setAnonMessage('');
      } else {
        toast.error(data.error || 'Could not send message.');
      }
    } catch {
      toast.error('Network error. Retry message.');
    } finally {
      setIsSubmittingAnonMsg(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track?ticket=${ticket.ticket_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public tracking link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setHashCopied(true);
    toast.success('SHA-256 Ledger Hash copied!');
    setTimeout(() => setHashCopied(false), 2000);
  };

  const getReopenWindowDetails = (t) => {
    if (!t || !['Resolved', 'Closed', 'AUTO_RESOLVED'].includes(t.status)) return null;
    const resolvedTime = new Date(t.resolved_at || t.updated_at || t.created_at).getTime();
    const now = Date.now();
    const diffHours = (now - resolvedTime) / (1000 * 60 * 60);
    const remaining = Math.max(0, Math.ceil(72 - diffHours));
    return {
      isOpen: diffHours < 72,
      remainingHours: remaining,
      canReopen: diffHours < 72 && (Number(t.reopen_count) || 0) < 1
    };
  };

  const handleExportPdf = () => {
    if (!ticket) return;
    try {
      if (['Resolved', 'Closed', 'AUTO_RESOLVED'].includes(ticket.status)) {
        generateResolutionCertificate(ticket);
        toast.success('Official Resolution Certificate downloaded!');
      } else {
        generateAcknowledgmentReceipt(ticket);
        toast.success('Official Grievance Acknowledgment Receipt downloaded!');
      }
    } catch {
      toast.error('Failed to generate PDF document.');
    }
  };

  const getTimelineSteps = (t) => {
    if (!t) return [];
    const isResolved = t.status === 'Resolved' || t.status === 'Closed' || t.status === 'AUTO_RESOLVED';
    const isInProgress = t.status === 'In Progress' || t.status === 'Under Review' || t.status === 'Assigned';
    const isEscalated = t.status === 'Escalated';

    return [
      {
        title: 'Grievance Submitted',
        desc: 'Ticket captured & cryptographic hash assigned.',
        date: new Date(t.created_at).toLocaleDateString(),
        done: true,
      },
      {
        title: 'Automated AI Triage & Department Routing',
        desc: `Routed to sector: ${t.category || 'General'}`,
        done: true,
      },
      {
        title: t.status === 'AUTO_RESOLVED' ? 'Instant AI Knowledge Base Verification' : 'Officer Assessment & Investigation',
        desc: t.status === 'AUTO_RESOLVED' ? 'Matched institutional knowledge base standard operating procedure.' : (isEscalated ? 'Escalated to Senior Administrative Directorate.' : 'Officer reviewing dossier evidence.'),
        active: isInProgress || isEscalated,
        done: isResolved,
      },
      {
        title: t.status === 'AUTO_RESOLVED' ? 'Instant Redressal Resolution Applied' : 'Final Resolution & Case Sign-Off',
        desc: t.auto_resolution_notes || t.resolution_notes || (t.status === 'AUTO_RESOLVED' ? 'Verified resolution instructions issued to citizen.' : 'Pending final verification by redressal authority.'),
        done: isResolved,
      },
    ];
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full p-4 sm:p-6 flex flex-col items-center justify-center relative z-10">
        
        <div className="w-full max-w-3xl space-y-8 text-center my-auto pt-12 pb-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-all uppercase tracking-widest text-xs font-mono font-bold">
            <ChevronLeft size={16} />
            Back to Portal Gateway
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-4">
              <Landmark size={14} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Public Registry Index</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Track Grievance Ticket
            </h1>
            <p className="text-slate-400 font-medium text-sm max-w-md mx-auto mt-2">
              Verify real-time resolution milestones, department routing, and SLA status.
            </p>
          </div>

          {/* Search Form */}
          <MotionCard className="p-4 sm:p-6 max-w-xl mx-auto" tilt={false}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="TKT-2026-XXXX" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl font-mono text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <AnimatedButton
                type="submit"
                variant="glow"
                size="md"
                isLoading={loading}
                className="w-full sm:w-auto"
              >
                Sync Status
              </AnimatedButton>
            </form>
          </MotionCard>

          {/* Results Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }} 
                className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl max-w-xl mx-auto flex items-center gap-3 justify-center shadow-sm"
              >
                <AlertCircle size={16} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">{error}</span>
              </motion.div>
            )}

            {ticket && (
              <MotionCard className="p-6 sm:p-8 text-left space-y-6 max-w-2xl mx-auto" tilt={false}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Reference Identifier</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-mono text-indigo-400 font-bold tracking-wider">{ticket.ticket_id}</h2>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                      <SlaCountdownTimer 
                        createdAt={ticket.created_at}
                        slaHours={ticket.urgency === 'High' ? 24 : (ticket.urgency === 'Emergency' ? 2 : 48)}
                        status={ticket.status}
                        priority={ticket.urgency}
                        escalationLevel={ticket.escalation_level || 1}
                      />
                      <StatusBadge status={ticket.status} />
                    </div>
                    <SlaRadialCountdown createdAt={ticket.created_at} slaDueAt={ticket.sla_due_at} status={ticket.status} size={76} strokeWidth={5} />
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Filing Date: {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Active Lifecycle Banner: Citizen Clarification / SLA Paused */}
                {(ticket.status === 'Pending User Response' || ticket.sla_paused_at) && (
                  <div className="p-4 rounded-2xl bg-linear-to-r from-amber-950/70 via-amber-900/30 to-slate-950 border border-amber-500/40 text-left space-y-2 shadow-lg shadow-amber-500/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                          <Clock size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-heading font-black text-amber-300 uppercase tracking-wider">
                            Statutory SLA Paused • Citizen Clarification Requested
                          </h4>
                          <p className="text-[10px] text-amber-200/80 font-mono">
                            Investigation suspended pending citizen clarification submission
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        Paused
                      </span>
                    </div>
                    {ticket.clarification_requested && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs text-amber-100 font-sans leading-relaxed">
                        <span className="font-mono text-[10px] font-bold text-amber-400 block mb-1 uppercase tracking-wider">Officer Inquiry:</span>
                        {ticket.clarification_requested}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Lifecycle Banner: Grievance Reopened */}
                {(ticket.status === 'Reopened' || Number(ticket.reopen_count) > 0) && (
                  <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-950/70 via-purple-950/40 to-slate-950 border border-indigo-500/40 text-left space-y-2 shadow-lg shadow-indigo-500/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                          <RotateCcw size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-heading font-black text-indigo-200 uppercase tracking-wider">
                            Grievance Reopened For Re-Investigation
                          </h4>
                          <p className="text-[10px] text-indigo-300/80 font-mono">
                            Reopen Cycle #{ticket.reopen_count || 1} • Escalated for secondary supervisor audit
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                        Reopened
                      </span>
                    </div>
                    {ticket.reopen_reason && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-xs text-slate-200 font-sans leading-relaxed">
                        <span className="font-mono text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">Complainant Reopen Rationale:</span>
                        "{ticket.reopen_reason}"
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Subject</span>
                      <p className="text-base font-heading font-extrabold text-white">{ticket.title}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Department</span>
                      <span className="inline-block px-3 py-1 bg-slate-950 rounded-lg text-xs text-white font-mono font-bold border border-white/10 uppercase tracking-widest">
                        {ticket.department || ticket.category || 'General'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Digital QR Verification Badge */}
                  <div className="p-3.5 rounded-2xl bg-linear-to-tr from-indigo-950/80 to-slate-950 border border-indigo-500/30 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Official Receipt QR</span>
                    </div>
                    <div className="w-20 h-20 bg-white p-1.5 rounded-xl mx-auto flex items-center justify-center shadow-md">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/public-status?ticket=' + ticket.ticket_id)}`} 
                        alt="Grievance Verification QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[9px] font-mono text-slate-400">Scan to Verify Authentic Copy</p>
                  </div>
                </div>

                {/* Community Petition & +1 Cluster Endorsement */}
                <CommunityPetitionWidget 
                  grievance={ticket} 
                  onUpvoteSuccess={(updated) => setTicket(updated)} 
                />

                {/* Official Redressal Resolution Dossier Card */}
                {(() => {
                  const isResolved = ['Resolved', 'Closed'].includes(ticket.status) || Boolean(ticket.resolution_notes || ticket.root_cause || ticket.resolution_proof_url);
                  if (!isResolved && ticket.status !== 'AUTO_RESOLVED') return null;

                  const reopenWindow = getReopenWindowDetails(ticket);

                  return (
                    <div className="p-5 rounded-2xl bg-linear-to-br from-slate-900/90 via-slate-950 to-indigo-950/30 border border-emerald-500/30 text-left space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                              Official Redressal Resolution Dossier
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400">
                              Departmental Corrective Action & Audit Ledger
                            </span>
                          </div>
                        </div>

                        {ticket.root_cause && (
                          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            <AlertCircle size={12} className="text-indigo-400" />
                            Root Cause: {ticket.root_cause}
                          </span>
                        )}
                      </div>

                      {/* Resolution Statement */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                          Official Resolution Statement
                        </span>
                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                          {ticket.resolution_notes || ticket.auto_resolution_notes || 'Grievance resolved following institutional standard operating procedure remediation.'}
                        </div>
                      </div>

                      {/* Resolution Proof Evidence */}
                      {ticket.resolution_proof_url && (
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-heading font-bold text-white truncate">
                                Verified Remediation Evidence Artifact
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">
                                Official corrective action inspection documentation submitted by officer
                              </p>
                            </div>
                          </div>
                          <a
                            href={ticket.resolution_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
                          >
                            <Download size={13} />
                            <span>Inspect Evidence</span>
                          </a>
                        </div>
                      )}

                      {/* 72-Hour Citizen Reopen Grace Window */}
                      {reopenWindow && (
                        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          reopenWindow.isOpen
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950/60 border-white/10 text-slate-400'
                        }`}>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <Clock size={14} className={reopenWindow.isOpen ? 'text-amber-400 shrink-0' : 'text-slate-500 shrink-0'} />
                            <span>
                              {reopenWindow.isOpen
                                ? `72-Hour Citizen Grace Window Active: ${reopenWindow.remainingHours}h remaining to request supervisor reassessment`
                                : '72-Hour Citizen Grace Window Concluded • Resolution Finalized & Audited'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider self-start sm:self-auto ${
                            reopenWindow.isOpen
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {reopenWindow.isOpen ? 'Active' : 'Sealed'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Instant Knowledge Base Auto-Resolution Guidance Banner */}
                {(ticket.status === 'AUTO_RESOLVED' || ticket.auto_resolution_notes) && !ticket.resolution_notes && (
                  <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/30 text-left space-y-2.5 shadow-lg shadow-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                          <Zap size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-heading font-black text-emerald-300 uppercase tracking-wider">
                            Instant Verified Auto-Resolution
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">Matched Institutional Knowledge Base Solution</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Sub-1-Minute
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {ticket.auto_resolution_notes || 'Resolved via standard operating procedure guidance.'}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Narrative Statement Log</span>
                  <p className="text-slate-300 text-xs leading-relaxed italic font-sans">"{ticket.description}"</p>
                  
                  {/* Multilingual AI Auto-Translation Toggle */}
                  <div className="pt-2 border-t border-white/5">
                    <MultilingualTranslator text={ticket.description} title={ticket.title} />
                  </div>
                </div>

                {/* Voice Accessibility: Speech Synthesis Read-Aloud */}
                <AudioStatusReader ticket={ticket} />

                {/* Instant WhatsApp & SMS Notification Subscriptions */}
                <SmsWhatsAppOptInCard ticketId={ticket.ticket_id || ticket.id} currentPhone={ticket.mobile_number || ''} />

                {/* Physical QR Paper Receipt Printer */}
                <PrintableQrReceipt ticket={ticket} />

                {/* Receipt Actions: Copy Link & Download Official PDF */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Link Copied' : 'Share Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMobileSimulator(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="Test WhatsApp & Telegram Alerts"
                    >
                      <Smartphone size={14} />
                      <span>Mobile Simulator</span>
                    </button>
                  </div>

                  <AnimatedButton
                    variant="glow"
                    size="sm"
                    leftIcon={FileDown}
                    onClick={handleExportPdf}
                  >
                    Download Official PDF Receipt
                  </AnimatedButton>
                </div>

                {/* Cryptographic SHA-256 Case Ledger Integrity Stamp */}
                {ticket.proof_hash && (
                  <div className="p-4 rounded-2xl bg-linear-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/20 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
                          Cryptographic Case Ledger Integrity Stamp
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Lock size={10} />
                        Tamper-Evident SHA-256 Seal
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/90 border border-white/10 font-mono text-[11px] text-slate-300">
                      <span className="truncate">{ticket.proof_hash}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(ticket.proof_hash)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold transition-all cursor-pointer"
                        title="Copy Ledger Hash"
                      >
                        {hashCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{hashCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] font-sans text-slate-500">
                      Canonical digest computed from grievance filing attributes. Any record tampering invalidates this cryptographic proof.
                    </p>
                  </div>
                )}

                {/* Audit Workflow Timeline */}
                <div className="pt-2">
                  <GrievanceWorkflowTimeline ticket={ticket} />
                </div>
              </MotionCard>
            )}
          </AnimatePresence>

          <footer className="pt-10 text-slate-500 text-xs font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} Government of Digital India • Official Public Registry
          </footer>
        </div>
      </div>

      {/* Mobile WhatsApp / Telegram Webhook Simulator Modal */}
      {ticket && (
        <MobileNotificationSimulatorModal
          isOpen={showMobileSimulator}
          onClose={() => setShowMobileSimulator(false)}
          ticket={ticket}
        />
      )}
    </AuroraBackground>
  );
};

export default PublicStatusPage;
