import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, AlertCircle, ChevronLeft, Landmark, Activity, CheckCircle2, QrCode, Download, ShieldCheck, Copy, FileDown, Check, Smartphone } from 'lucide-react';
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
  const [ticketId, setTicketId] = useState(searchParams.get('ticket') || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
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
    const paramTicket = searchParams.get('ticket');
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
    const isResolved = t.status === 'Resolved' || t.status === 'Closed';
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
        title: 'Officer Assessment & Investigation',
        desc: isEscalated ? 'Escalated to Senior Administrative Directorate.' : 'Officer reviewing dossier evidence.',
        active: isInProgress || isEscalated,
        done: isResolved,
      },
      {
        title: 'Final Resolution & Case Sign-Off',
        desc: t.resolution_notes || 'Pending final verification by redressal authority.',
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
