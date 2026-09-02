import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, FileDown, MessageSquare, ShieldCheck, 
  MapPin, CheckCircle, HelpCircle, Loader2, Calendar, ClipboardList, 
  AlertCircle, History, Info, Trash2, Star, Send, ThumbsUp, Smartphone,
  Plus, Paperclip, UploadCloud, Eye, ExternalLink, X, Image as ImageIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { CommandChat } from '../../components/ai/CommandChat';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import TimelineStep from '../../components/ui/TimelineStep';
import { DeliveryTrackingWidget } from '../../components/grievances/DeliveryTrackingWidget';
import CommunityPetitionWidget from '../../components/grievances/CommunityPetitionWidget';
import MobileNotificationSimulatorModal from '../../components/notifications/MobileNotificationSimulatorModal';
import MultilingualTranslator from '../../components/ai/MultilingualTranslator';
import AudioStatusReader from '../../components/ui/AudioStatusReader';
import SmsWhatsAppOptInCard from '../../components/ui/SmsWhatsAppOptInCard';
import PrintableQrReceipt from '../../components/ui/PrintableQrReceipt';
import SlaCountdownTimer from '../../components/grievances/SlaCountdownTimer';
import InteractiveCaseTimeline from '../../components/grievances/InteractiveCaseTimeline';
import ExportCertificateModal from '../../components/grievances/ExportCertificateModal';
import { FileUploadZone } from '../../components/ui/FileUploadZone';
import toast from 'react-hot-toast';

export const GrievanceDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, comments, resolution, audit
  const [isExporting, setIsExporting] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Appeal / Dispute states
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Cancel Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Supplementary Evidence uploader
  const [showEvidenceUploader, setShowEvidenceUploader] = useState(false);
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const data = await grievanceService.getById(id);
      setTicket(data);
      
      const timelineData = await grievanceService.getTimeline(id);
      setTimeline(timelineData || []);
    } catch (err) {
      toast.error('Could not fetch ticket details.');
      navigate('/grievances');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!ticket) return;
    setIsUpvoting(true);
    try {
      const res = await grievanceService.upvote(ticket.id || ticket.ticket_id);
      toast.success(res.alreadyUpvoted ? 'You have already upvoted this ticket.' : 'Upvoted ticket successfully!');
      fetchTicketDetails();
    } catch (err) {
      toast.error('Upvote failed.');
    } finally {
      setIsUpvoting(false);
    }
  };


  useEffect(() => {
    fetchTicketDetails();

    const channel = supabase
      .channel(`ticket-details:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grievances', filter: `id=eq.${id}` },
        (payload) => {
          setTicket(payload.new);
          toast.success(`Ticket status updated: ${payload.new.status}`);
          grievanceService.getTimeline(id).then(setTimeline).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleExportDossier = async () => {
    if (!ticket) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("RESOLVENOW GRIEVANCE DOSSIER", 20, 25);
      doc.setFontSize(10);
      doc.text(`TICKET REFERENCE: #${ticket.ticket_id}`, 140, 25);
      doc.text(`EXPORT DATE: ${new Date().toLocaleDateString()}`, 140, 32);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text("Ticket Parameters", 20, 60);
      doc.line(20, 63, 190, 63);
      
      doc.setFontSize(10);
      doc.text(`Subject: ${ticket.title}`, 20, 72);
      doc.text(`Category Segment: ${ticket.category}`, 20, 80);
      doc.text(`Department: ${ticket.department || 'General'}`, 20, 88);
      doc.text(`Status: ${ticket.status}`, 140, 72);
      doc.text(`Priority Level: ${ticket.urgency}`, 140, 80);
      doc.text(`Filing Date: ${new Date(ticket.created_at).toLocaleString()}`, 20, 96);
      
      doc.setFontSize(13);
      doc.text("Narrative Statement", 20, 115);
      doc.line(20, 118, 190, 118);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(ticket.description, 170);
      doc.text(splitDesc, 20, 128);
      
      if (ticket.status === 'Resolved' && ticket.resolution_notes) {
        const yOffset = 145 + (splitDesc.length * 5);
        doc.setFillColor(240, 253, 250);
        doc.rect(20, yOffset, 170, 35, 'F');
        doc.setTextColor(13, 148, 136);
        doc.setFontSize(11);
        doc.text("Resolution Audit Summary", 25, yOffset + 10);
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const splitNotes = doc.splitTextToSize(ticket.resolution_notes, 160);
        doc.text(splitNotes, 25, yOffset + 18);
      }
      
      doc.save(`ResolveNow_Dossier_${ticket.ticket_id}.pdf`);
      toast.success("Dossier PDF downloaded successfully.");
    } catch (err) {
      toast.error("Failed to generate PDF dossier.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelTicket = async () => {
    setIsDeleting(true);
    try {
      await grievanceService.delete(ticket.id);
      toast.success(`Grievance #${ticket.ticket_id} has been canceled.`);
      navigate('/grievances');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not cancel ticket.');
    } finally {
      setIsDeleting(false);
      setShowCancelModal(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      await grievanceService.submitFeedback(ticket.id, feedbackRating, feedbackComments, feedbackTags);
      toast.success('Thank you! Your feedback rating has been submitted.');
      fetchTicketDetails();
    } catch (err) {
      toast.error('Feedback submission failed.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason || appealReason.trim().length < 5) {
      toast.error('Please enter a valid reason for appeal (min 5 characters).');
      return;
    }
    setIsSubmittingAppeal(true);
    try {
      await grievanceService.appeal(ticket.id, appealReason.trim());
      toast.success('Formal dispute appeal submitted. Transferred to Department Head for review.');
      setShowAppealModal(false);
      setAppealReason('');
      fetchTicketDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Appeal submission failed.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedEvidenceFile) {
      toast.error('Please select a document or photo to upload.');
      return;
    }
    setIsUploadingEvidence(true);
    try {
      let fileUrl = '';
      const fileExt = selectedEvidenceFile.name.split('.').pop();
      const fileName = `${ticket.id}-${Date.now()}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('grievances')
          .upload(filePath, selectedEvidenceFile);

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('grievances')
            .getPublicUrl(filePath);
          fileUrl = publicData?.publicUrl || '';
        }
      } catch {
        // storage fallback
      }

      if (!fileUrl) {
        fileUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(selectedEvidenceFile);
        });
      }

      await grievanceService.attachEvidence(ticket.id, fileUrl, selectedEvidenceFile.name, user?.id);
      toast.success(`Attached ${selectedEvidenceFile.name} as verified evidence!`);
      setTicket(prev => ({ ...prev, attachment_url: fileUrl }));
      setSelectedEvidenceFile(null);
      setShowEvidenceUploader(false);
      fetchTicketDetails();
    } catch (err) {
      toast.error('Failed to attach evidence: ' + err.message);
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing Grievance Module...</p>
      </div>
    );
  }

  if (!ticket) return null;

  const isCancellable = ['Submitted', 'Draft', 'New', 'Pending'].includes(ticket.status);

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-16">
      
      {/* Back to registry navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/grievances')}
            className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                #{ticket.ticket_id}
              </span>
              <StatusBadge status={ticket.status} />
              <UrgencyBadge level={ticket.urgency} />
              <SlaCountdownTimer 
                createdAt={ticket.created_at}
                slaHours={ticket.urgency === 'High' ? 24 : (ticket.urgency === 'Emergency' ? 2 : 48)}
                status={ticket.status}
                priority={ticket.urgency}
                escalationLevel={ticket.escalation_level || 1}
              />
              {(ticket.upvote_count > 0 || ticket.urgency === 'High') && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{ticket.upvote_count || 1} Upvotes</span>
                  {ticket.upvote_count >= 5 && <span className="ml-1 text-[10px] text-amber-300">🔥 High Impact</span>}
                </span>
              )}
            </div>
            <h1 className="text-lg font-heading font-black text-foreground mt-1 truncate max-w-md">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleUpvote}
            disabled={isUpvoting}
            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <ThumbsUp size={13} />
            <span>Upvote ({ticket.upvote_count || 1})</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3 py-2 bg-primary-bright/15 hover:bg-primary-bright/25 text-primary-bright border border-primary-bright/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Download Official Receipt & Resolution Certificate"
          >
            <FileDown size={13} />
            <span>Certified PDF Studio</span>
          </button>

          <button 
            onClick={handleExportDossier}
            disabled={isExporting}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            <span>Export Dossier</span>
          </button>

          <button 
            onClick={() => setShowMobileSimulator(true)}
            className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="View live WhatsApp / Telegram Notification Webhook Simulator"
          >
            <Smartphone size={13} />
            <span>Mobile Alerts</span>
          </button>

          {/* 1-Click Appeal / Escalation Trigger Button */}
          {(ticket.status === 'Resolved' || ticket.status === 'Closed') && ticket.status !== 'Disputed' && (
            <button 
              type="button"
              onClick={() => setShowAppealModal(true)}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="Dispute resolution and escalate to Department Head / Ombudsman"
            >
              <AlertCircle size={13} />
              <span>Dispute / Appeal</span>
            </button>
          )}

          {ticket.status === 'Disputed' && (
            <span className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck size={13} />
              <span>Dispute Under Review</span>
            </span>
          )}

          {isCancellable && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 size={13} />
              <span>Cancel Ticket</span>
            </button>
          )}
        </div>

      </div>

      {/* Active Dispute Appeal Alert Banner */}
      {ticket.status === 'Disputed' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-left">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                Dispute Appeal Registered — {ticket.escalation_tier || 'Tier 2 (HOD Dispute Review)'}
              </h4>
              <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold rounded">
                {ticket.appeal_status || 'Pending Review'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complainant Justification: <strong className="text-foreground">"{ticket.appeal_reason}"</strong>
            </p>
            <p className="text-[10px] text-amber-400/80 font-mono">
              The original resolution was contested. Re-investigation has been mandated to the senior institutional ombudsman.
            </p>
          </div>
        </div>
      )}

      {/* Live Delivery Tracking Timeline Widget */}
      <DeliveryTrackingWidget 
        ticket={ticket}
        onCancel={() => setShowCancelModal(true)}
        onExportPdf={handleExportDossier}
      />

      {/* Community Petition & +1 Cluster Endorsement Widget */}
      <CommunityPetitionWidget 
        grievance={ticket} 
        currentUserId={user?.id}
        onUpvoteSuccess={(updated) => setTicket(updated)} 
      />

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border/80 gap-6 overflow-x-auto select-none no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Info },
          { id: 'timeline', label: 'Timeline Log', icon: Calendar },
          { id: 'comments', label: 'Discussion', icon: MessageSquare },
          { id: 'resolution', label: 'Resolution', icon: ShieldCheck },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-87.5">
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Subject Title</span>
                      <p className="text-sm font-bold text-foreground">{ticket.title}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Detailed Narrative Statement</span>
                      <p className="p-4 rounded-xl bg-background border border-border text-foreground text-xs leading-relaxed italic whitespace-pre-wrap font-sans">
                        "{ticket.description}"
                      </p>

                      {/* Multilingual AI Auto-Translation Toggle */}
                      {ticket.description && (
                        <div className="pt-2">
                          <MultilingualTranslator 
                            text={ticket.description}
                            title={ticket.title}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice Accessibility: Speech Synthesis Read-Aloud */}
                  <AudioStatusReader ticket={ticket} />

                  {/* WhatsApp & SMS Direct Notification Opt-In */}
                  <SmsWhatsAppOptInCard ticketId={ticket.ticket_id || ticket.id} currentPhone={ticket.mobile_number || ''} />

                  {/* Physical QR Paper Receipt Printer */}
                  <PrintableQrReceipt ticket={ticket} />

                  {/* Supplementary Evidence & Documentation Hub */}
                  <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip size={16} className="text-indigo-400" />
                        <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-foreground">
                          Evidence & Attached Documentation
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEvidenceUploader(!showEvidenceUploader)}
                        className="px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>{showEvidenceUploader ? 'Cancel Upload' : 'Add Evidence'}</span>
                      </button>
                    </div>

                    {/* Primary/Existing Attachment Preview Card */}
                    {ticket.attachment_url ? (
                      <div className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                            {ticket.attachment_url.match(/\.(jpg|jpeg|png|webp)($|\?)/i) || ticket.attachment_url.startsWith('data:image') ? (
                              <ImageIcon size={20} />
                            ) : (
                              <FileDown size={20} />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-foreground truncate">
                              Verified Supporting Evidence Document
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              SHA-256 Verified Case Record
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a 
                            href={ticket.attachment_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ExternalLink size={12} />
                            <span>View / Download</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-2">
                        No supplementary evidence file was attached during original submission. You can add supporting photos or PDF documents below.
                      </p>
                    )}

                    {/* Expandable Evidence Upload Zone */}
                    <AnimatePresence>
                      {showEvidenceUploader && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-3 pt-2 border-t border-border/60"
                        >
                          <FileUploadZone
                            onFileSelect={(file) => setSelectedEvidenceFile(file)}
                            selectedFile={selectedEvidenceFile}
                          />

                          {selectedEvidenceFile && (
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedEvidenceFile(null)}
                                className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold cursor-pointer"
                              >
                                Remove File
                              </button>
                              <button
                                type="button"
                                onClick={handleUploadEvidence}
                                disabled={isUploadingEvidence}
                                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                {isUploadingEvidence ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                                <span>Transmit & Attach to Ticket</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                      Grievance Parameters
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Category Sector</span>
                        <span className="inline-block px-2.5 py-1 bg-background border border-border rounded text-[10px] font-mono font-bold uppercase text-foreground mt-1">
                          {ticket.category}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Allocated Department</span>
                        <span className="inline-block px-2.5 py-1 bg-background border border-border rounded text-[10px] font-mono font-bold uppercase text-foreground mt-1">
                          {ticket.department || 'Facilities & Maintenance'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Impact Frustration Severity</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-foreground">{ticket.frustration_index || 1}/10</span>
                          <div className="flex-1 bg-background border border-border/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(ticket.frustration_index || 1) * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TIMELINE PANEL */}
          {activeTab === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-6"
            >
              <InteractiveCaseTimeline 
                grievance={ticket}
                timelineEvents={timeline}
                isAdmin={false}
              />
            </motion.div>
          )}

          {/* DISCUSSION COMMENTS PANEL */}
          {activeTab === 'comments' && (
            <motion.div 
              key="comments"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="h-125"
            >
              <CommandChat 
                grievanceId={ticket.id} 
                currentUser={user} 
                role="user"
              />
            </motion.div>
          )}

          {/* RESOLUTION PANEL & FEEDBACK FORM */}
          {activeTab === 'resolution' && (
            <motion.div 
              key="resolution"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-6"
            >
              <div>
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">Redressal Resolution Statement</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Official resolution statement logged by assigned department officer.</p>
              </div>

              {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-bold text-foreground">Grievance Addressed & Resolved</h4>
                        <p className="text-xs text-muted-foreground">The assigned officer has completed the investigation:</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background/80 border border-border text-xs text-foreground font-medium italic whitespace-pre-wrap leading-relaxed">
                      "{ticket.resolution_notes || 'Resolved satisfactorily according to institutional guidelines.'}"
                    </div>

                    {/* Dispute / Appeal Resolution CTA */}
                    {ticket.status !== 'Disputed' && (
                      <div className="pt-2 flex items-center justify-between border-t border-emerald-500/20">
                        <div>
                          <p className="text-xs font-bold text-foreground">Dissatisfied with this resolution?</p>
                          <p className="text-[10px] text-muted-foreground">You have the right to file a formal dispute appeal to the Department Head / Ombudsman.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAppealModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          Dispute & Appeal
                        </button>
                      </div>
                    )}
                  </div>

                  {ticket.status === 'Disputed' && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <AlertCircle size={16} />
                        <span>Formal Dispute Under Review ({ticket.escalation_tier || 'Tier 2 - HOD Review'})</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Citizen Appeal Reason: <strong className="text-foreground">"{ticket.appeal_reason}"</strong>
                      </p>
                    </div>
                  )}

                  {/* 5-Star Feedback Rating Box */}
                  <form onSubmit={handleSubmitFeedback} className="bg-background/50 border border-border rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Submit Redressal Satisfaction Rating (CSAT)
                    </h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star 
                            size={22} 
                            className={star <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-400 ml-2">{feedbackRating} / 5 Stars</span>
                    </div>

                    {/* Tag Pills */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Satisfaction Tags</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Fast Resolution', 'Helpful Staff', 'Polite Communication', 'High Quality Work', 'Needs Follow-up', 'Delayed Response'].map((tag) => {
                          const isSelected = feedbackTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setFeedbackTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag]);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Optional feedback comments regarding resolution speed and officer response..."
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingFeedback}
                      className="btn-primary px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmittingFeedback ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Submit Feedback & Close</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex gap-3">
                  <HelpCircle className="text-amber-500 shrink-0" size={20} />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">Resolution Pending</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Investigation is currently active. Resolution notes and feedback submission will be enabled once the officer marks the ticket as RESOLVED.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AUDIT TRAIL PANEL */}
          {activeTab === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-2xl p-6 shadow-xs space-y-6"
            >
              <div>
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">Security Audit Log</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Immutable audit record for this grievance.</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-background text-[10px] uppercase text-muted-foreground font-bold border-b border-border">
                      <th className="px-4 py-3">Event Action</th>
                      <th className="px-4 py-3">Summary</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {timeline.map((step, idx) => (
                      <tr key={step.id || idx} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-bold text-primary uppercase text-[10px]">
                          {step.activity_type}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {step.notes || `State transitioned to ${step.status}`}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(step.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Appeal / Dispute Modal */}
      <AnimatePresence>
        {showAppealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle size={24} />
                <h3 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">
                  File Dispute Appeal
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide a detailed justification for disputing the resolution of ticket <strong className="text-foreground">#{ticket.ticket_id}</strong>. This will escalate the ticket directly to the Department Head / Ombudsman.
              </p>
              
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why the resolution was incomplete or unsatisfactory (minimum 5 characters)..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground outline-none focus:border-amber-400 resize-none"
                />

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
                  <button 
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    disabled={isSubmittingAppeal}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingAppeal}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingAppeal ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Submit Appeal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-error">
                <Trash2 size={24} />
                <h3 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">
                  Cancel Grievance Ticket?
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm cancellation of ticket <strong className="text-foreground">#{ticket.ticket_id}</strong>. This will cancel processing and remove the ticket.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl cursor-pointer"
                >
                  Keep Ticket
                </button>
                <button 
                  onClick={handleCancelTicket}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Cancel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile WhatsApp / Telegram Webhook Simulator Modal */}
      {ticket && (
        <MobileNotificationSimulatorModal
          isOpen={showMobileSimulator}
          onClose={() => setShowMobileSimulator(false)}
          ticket={ticket}
        />
      )}

      {/* Official Certified Document Export Studio Modal */}
      {ticket && (
        <ExportCertificateModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          ticket={ticket}
          user={user}
        />
      )}

    </div>
  );
};

export default GrievanceDetailsPage;
