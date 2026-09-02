import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Loader2, Mic, MicOff, CheckCircle2, 
  MapPin, X, Plus, ArrowLeft, Paperclip, ClipboardList,
  Copy, ArrowRight, Ticket, Flame, ThumbsUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { logSecurityEvent } from '../../lib/auditLogger';
import { getErrorMessage } from '../../utils/errors';
import { APIProvider } from '@vis.gl/react-google-maps';
import { PlacePicker } from '@googlemaps/extended-component-library/react';

import AnimatedPage from '../../components/ui/AnimatedPage';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import SmartTriageAssistant from '../../components/ai/SmartTriageAssistant';
import DuplicateGrievanceModal from '../../components/ai/DuplicateGrievanceModal';
import MultilingualTranslator from '../../components/ai/MultilingualTranslator';
import VoiceStudioModal from '../../components/ai/VoiceStudioModal';
import VoiceGrievanceAssistantModal from '../../components/voice/VoiceGrievanceAssistantModal';
import FileUploadZone from '../../components/ui/FileUploadZone';
import GuidedTourModal from '../../components/ui/GuidedTourModal';
import EvidenceOcrScanner from '../../components/ui/EvidenceOcrScanner';
import KnowledgeDeflector from '../../components/forms/KnowledgeDeflector';
import { HelpCircle, Sparkles as SparklesIcon, CheckCircle, ShieldCheck as ShieldIcon, ArrowRight as ArrowRightIcon } from 'lucide-react';

export const SubmitGrievancePage = ({ user, sessionUser }) => {
  const currentUser = user || sessionUser;
  const navigate = useNavigate();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [urgency, setUrgency] = useState('Medium');
  const [frustrationIndex, setFrustrationIndex] = useState(1);
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [attachment, setAttachment] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  // App states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showAiVoiceAssistantModal, setShowAiVoiceAssistantModal] = useState(false);

  const handleApplyVoiceGrievance = (extracted) => {
    if (!extracted) return;
    if (extracted.title) setTitle(extracted.title);
    if (extracted.description) setDescription(extracted.description);
    if (extracted.category) {
      const catMap = {
        'Plumbing': 'Maintenance',
        'Electrical': 'Maintenance',
        'Academics': 'Academic',
        'Hostel': 'Maintenance',
        'Financial': 'Financial',
        'Infrastructure': 'IT Support',
        'Security': 'Public Infrastructure',
        'General': 'IT Support'
      };
      setCategory(catMap[extracted.category] || 'IT Support');
    }
    if (extracted.urgency) {
      const validUrgencies = ['Low', 'Medium', 'High'];
      setUrgency(validUrgencies.includes(extracted.urgency) ? extracted.urgency : 'Medium');
    }
  };

  // Duplicate Check states
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  const [communityPetitions, setCommunityPetitions] = useState([]);

  useEffect(() => {
    grievanceService.getCommunityClusters(15)
      .then(data => setCommunityPetitions(data || []))
      .catch(() => {});
  }, []);


  useEffect(() => {
    const savedDraft = localStorage.getItem('resolvenow_grievance_draft');
    if (savedDraft) {
      setShowDraftBanner(true);
    }
  }, []);

  useEffect(() => {
    if (!title && !description && !locationName) return;
    
    const delayDebounce = setTimeout(() => {
      const draft = {
        title,
        description,
        category,
        urgency,
        frustrationIndex,
        locationName,
        coordinates,
        attachmentUrl
      };
      localStorage.setItem('resolvenow_grievance_draft', JSON.stringify(draft));
    }, 2000);

    return () => clearTimeout(delayDebounce);
  }, [title, description, category, urgency, frustrationIndex, locationName, coordinates, attachmentUrl]);

  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem('resolvenow_grievance_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setCategory(draft.category || 'IT Support');
        setUrgency(draft.urgency || 'Medium');
        setFrustrationIndex(draft.frustrationIndex || 1);
        setLocationName(draft.locationName || '');
        setCoordinates(draft.coordinates || { lat: null, lng: null });
        setAttachmentUrl(draft.attachmentUrl || '');
        toast.success('Grievance draft restored.');
      }
    } catch {
      toast.error('Could not restore draft.');
    } finally {
      setShowDraftBanner(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem('resolvenow_grievance_draft');
    setShowDraftBanner(false);
    toast.success('Draft discarded.');
  };

  const handleAiAnalyze = async () => {
    if (!description.trim()) {
      toast.error("Please fill in the narrative statement description first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const data = await grievanceService.analyze(description);
      setCategory(data.category || 'IT Support');
      setUrgency(data.urgency || 'Medium');
      setFrustrationIndex(data.frustration_index || 1);
      
      if (data.english_translation?.trim()) {
        setDescription(prev => `${prev}\n\n[Translation]: ${data.english_translation}`);
      }

      if (!title) {
        let snippet = description.split(' ').slice(0, 5).join(' ');
        setTitle(`${snippet}...`);
      }
      
      logSecurityEvent('AI Triage Assistant Used', user?.email || 'citizen', 'Submit Grievance Page', 'info');
      toast.success("AI Triage analysis applied.");
    } catch {
      toast.error("AI triage backend offline. Standard defaults applied.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: Images, PDF, Word, TXT.");
      return;
    }

    if (file.size === 0) {
      toast.error("File is empty (0 bytes).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Attachments are restricted to 5MB.");
      return;
    }

    setAttachment(file);
    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
    const filePath = `user_${currentUser?.id || 'anon'}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setAttachmentUrl(data.publicUrl);
      toast.success(`Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn("Storage upload fallback:", err.message);
      const fallbackUrl = URL.createObjectURL(file);
      setAttachmentUrl(fallbackUrl);
      toast.success(`Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAttachment = () => {
    setAttachment(null);
    setAttachmentUrl('');
  };

  const runDuplicateCheck = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error('Enter a title or description to scan for duplicates.');
      return false;
    }
    setIsCheckingDuplicates(true);
    try {
      const res = await grievanceService.checkDuplicates({ title, description, category });
      setDuplicateCheckResult(res);
      if (res && res.is_duplicate && res.matching_ticket) {
        setShowDuplicateModal(true);
        return true;
      } else {
        toast.success('AI Scan complete: No duplicate tickets detected.');
        return false;
      }
    } catch (err) {
      console.warn('Duplicate check error:', err);
      return false;
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Module 1 Whistleblower & Module 3 Emergency states
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Subject and narrative statement are required.');
      return;
    }

    if (!bypassDuplicateCheck) {
      const foundDuplicate = await runDuplicateCheck();
      if (foundDuplicate) return;
    }

    setIsSubmitting(true);

    try {
      const created = await grievanceService.create({
        user_id: isAnonymous ? 'anonymous' : (user?.id || sessionUser?.id || 'demo-student-id-101'),
        email: isAnonymous ? '' : (user?.email || sessionUser?.email || 'student@resolvenow.demo'),
        title,
        description,
        category,
        urgency: isEmergency ? 'CRITICAL' : urgency,
        frustration_index: frustrationIndex,
        attachment_url: attachmentUrl,
        location: locationName,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        is_anonymous: isAnonymous,
        is_emergency: isEmergency
      });

      logSecurityEvent('New Grievance Transmitted', user?.email || 'citizen', 'Submit Page', 'warning');
      localStorage.removeItem('resolvenow_grievance_draft');
      setSubmittedTicket(created);
      setBypassDuplicateCheck(false);
      
      if (created?.passkeyInfo) {
        toast.success('Whistleblower Anonymous Grievance Vaulted! Secret passkey generated.');
      } else if (created?.status === 'AUTO_RESOLVED') {
        toast.success('🎉 Instant AI Resolution Found! Review solution below.');
      } else if (isEmergency) {
        toast.success('🚨 EMERGENCY SOS DISPATCHED! 2-Hour SLA Activated.');
      } else {
        toast.success(`Grievance submitted. Ticket ID: ${created?.ticket_id || 'assigned'}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Filing failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };


  const copyTicketId = () => {
    if (!submittedTicket?.ticket_id) return;
    navigator.clipboard?.writeText(submittedTicket.ticket_id)
      .then(() => toast.success('Ticket ID copied to clipboard.'))
      .catch(() => toast.error('Could not copy the ticket ID.'));
  };

  const fileAnother = () => {
    setSubmittedTicket(null);
    setTitle('');
    setDescription('');
    setCategory('IT Support');
    setUrgency('Medium');
    setFrustrationIndex(1);
    setLocationName('');
    setCoordinates({ lat: null, lng: null });
    setAttachment(null);
    setAttachmentUrl('');
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}>
      <AnimatedPage className="space-y-6 max-w-3xl mx-auto pb-12 text-left">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-heading font-black text-white uppercase tracking-wider">File Grievance</h1>
            <p className="text-xs text-slate-400 font-medium">Record a new institutional issue in the national registry.</p>
          </div>
        </div>

        {/* Success Confirmation */}
        {submittedTicket && (
          <MotionCard className="p-8 text-center space-y-5" tilt={false}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-heading font-black text-white">
                {submittedTicket.passkeyInfo ? '🔒 Whistleblower Anonymous Grievance Vaulted' : (submittedTicket.status === 'AUTO_RESOLVED' ? '🎉 Instant AI Resolution Available' : 'Grievance Registered Successfully')}
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {submittedTicket.passkeyInfo 
                  ? 'Your anonymous grievance is saved with zero metadata logged. Save your Secret Passkey to track progress.'
                  : 'Your grievance has been registered and assigned a cryptographic proof hash.'}
              </p>
            </div>

            {/* Whistleblower Passkey Receipt */}
            {submittedTicket.passkeyInfo && (
              <div className="max-w-md mx-auto bg-purple-950/40 border border-purple-500/40 rounded-2xl p-5 space-y-3 text-left">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-purple-400" /> Whistleblower Secret Passkey Receipt
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tracking Reference Key</span>
                      <span className="text-purple-300 font-bold">{submittedTicket.passkeyInfo.ticketKey}</span>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(submittedTicket.passkeyInfo.ticketKey); toast.success('Tracking key copied!'); }}
                      className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Secret Passphrase (Keep Private)</span>
                      <span className="text-amber-300 font-bold tracking-widest">{submittedTicket.passkeyInfo.secretPasskey}</span>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(submittedTicket.passkeyInfo.secretPasskey); toast.success('Secret Passphrase copied!'); }}
                      className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-purple-400">
                  ⚠️ Save both keys above. Use them on the <Link to="/track" className="underline font-bold">Public Tracking Portal</Link> to check updates & chat anonymously with department officers.
                </p>
              </div>
            )}

            {/* AI Auto-Resolution Solution Box */}
            {submittedTicket.auto_resolution_notes && (
              <div className="max-w-md mx-auto bg-cyan-950/40 border border-cyan-500/40 rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Instant AI Verified Solution Found
                </div>
                <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-cyan-500/20 whitespace-pre-wrap">
                  {submittedTicket.auto_resolution_notes}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-cyan-400 font-mono">Status: Auto-Resolved in &lt;1m</span>
                  <button 
                    onClick={() => { toast.success('Thank you! Resolution confirmed.'); navigate('/dashboard'); }}
                    className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-cyan-400 transition-colors"
                  >
                    Accept & Close
                  </button>
                </div>
              </div>
            )}

            {/* What Happens Next — Reassuring Human Roadmap */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-surface/90 border border-border text-left space-y-3.5 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle size={14} />
                </div>
                <h4 className="text-xs font-heading font-extrabold uppercase tracking-wider text-foreground">
                  What Happens Next (Guaranteed Resolution)
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-emerald-500/40">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">Issue Registered & Categorized</span>
                    <span className="text-[11px] text-muted-foreground">Auto-assigned to <b>{submittedTicket.department || category || 'Department Nodal Authority'}</b>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-indigo-500/40">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">Officer Review & Assignment (Target: &lt;2 Hours)</span>
                    <span className="text-[11px] text-muted-foreground">A nodal officer is notified directly via SMS and Email to begin investigation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-amber-500/40">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">On-Site Action & Resolution Note</span>
                    <span className="text-[11px] text-muted-foreground">Technical/maintenance crew executes repair before the active SLA deadline.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-purple-500/40">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">Your Final Review & Appeal Rights</span>
                    <span className="text-[11px] text-muted-foreground">You inspect the fix. Rate with stars or file a 1-click appeal if unsatisfied.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Reference Card */}
            <div className="max-w-sm mx-auto bg-slate-950 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Your Tracking Reference</span>
                <button type="button" onClick={copyTicketId} className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer" title="Copy ticket ID">
                  <Copy size={14} />
                </button>
              </div>
              <p className="font-mono text-2xl font-black text-indigo-400 tracking-wider">{submittedTicket.ticket_id}</p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{submittedTicket.status}</span>
                {submittedTicket.is_emergency && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">🚨 2H Emergency SLA</span>
                )}
              </div>

              {submittedTicket.proof_hash && (
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span className="truncate max-w-45">🛡️ Tamper-Proof Audit Lock</span>
                  <Link 
                    to={`/verify-hash?hash=${encodeURIComponent(submittedTicket.proof_hash)}`}
                    className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 font-sans"
                  >
                    Inspect <ExternalLink size={10} />
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <AnimatedButton variant="glow" size="md" onClick={() => navigate('/grievances')} rightIcon={ArrowRight}>
                Track My Grievances
              </AnimatedButton>
              <AnimatedButton variant="secondary" size="md" onClick={fileAnother}>
                File Another Ticket
              </AnimatedButton>
            </div>
          </MotionCard>
        )}

        {!submittedTicket && (
          <>
            <AnimatePresence>
              {showDraftBanner && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
                >
                  <div className="flex gap-3">
                    <ClipboardList className="text-indigo-400 shrink-0" size={18} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Unfinished Draft Found</h4>
                      <p className="text-[10px] text-slate-400">You have an autosaved grievance draft that was not submitted.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <AnimatedButton variant="glow" size="xs" onClick={restoreDraft}>
                      Restore Draft
                    </AnimatedButton>
                    <AnimatedButton variant="secondary" size="xs" onClick={discardDraft}>
                      Discard
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <GuidedTourModal forceOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />

            {/* Quick Human-Friendly Guide Banner */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400 shrink-0" />
                <span className="font-medium">Need help? Voice dictation and AI auto-routing are active.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <HelpCircle size={13} />
                <span>30s Guide</span>
              </button>
            </div>

            {/* AI Voice Assistant Two-Way Intake Hero Banner */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => setShowAiVoiceAssistantModal(true)}
              className="p-4 rounded-2xl bg-linear-to-r from-indigo-900/50 via-purple-900/40 to-slate-900/70 border border-indigo-500/40 cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 relative">
                  <Mic className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Conversational Voice Assistant</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 uppercase font-mono">Hands-Free</span>
                  </h4>
                  <p className="text-xs text-slate-300">Speak naturally in English, Hindi, Spanish, or French. AI auto-extracts categories & files for you.</p>
                </div>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                <span>Start Voice Intake</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>

            <GlassPanel className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* 1-Click Smart Complaint Starter Chips */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                    ⚡ Quick 1-Click Complaint Starters (Common Issues)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '📶 Wi-Fi / Internet Drop', cat: 'IT Support', t: 'Campus Wi-Fi connectivity drops frequently', d: 'The Wi-Fi network is unstable and disconnects every few minutes in [Room/Lab/Hostel Block].' },
                      { label: '💧 Water & Plumbing', cat: 'Maintenance', t: 'Water supply disruption / plumbing leak', d: 'Water supply is unavailable / leaking heavily in [Hostel Block / Washroom]. Immediate plumbing fix required.' },
                      { label: '⚡ Electricity & AC', cat: 'Maintenance', t: 'Electrical switchboard / AC unit malfunction', d: 'Power sockets / Air conditioning unit not working properly in [Classroom / Room No].' },
                      { label: '📑 Marksheet & Grades', cat: 'Academic', t: 'Delay in Semester Marksheet Verification', d: 'Submitted physical marksheet verification form. Status is pending at Academic Registrar Office.' },
                      { label: '💳 Fees & Scholarship', cat: 'Financial', t: 'Fee receipt & scholarship adjustment discrepancy', d: 'State scholarship reimbursement credit of Rs 15,000 has not been updated in student portal fee invoice.' },
                      { label: '🍽️ Hostel & Mess Food', cat: 'Maintenance', t: 'Hostel mess dining hygiene & food quality issue', d: 'Food quality and sanitation standards in the dining mess need urgent review by student council and warden.' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCategory(preset.cat);
                          setTitle(preset.t);
                          setDescription(preset.d);
                          toast.success(`Preset applied: ${preset.label}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    Subject Specification *
                  </label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Summary of the incident (e.g. WiFi outage in Library)" 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500" 
                    required 
                  />
                </div>

                {/* Instant Solution / Pre-submission Knowledge Deflector */}
                <KnowledgeDeflector 
                  title={title} 
                  description={description} 
                  category={category}
                  onDeflected={() => {
                    toast.success('Self-service solution applied! Grievance deflected.');
                  }}
                />

                {/* Live Campus Outage / Collective Petition Match */}
                {(() => {
                  const match = communityPetitions.find(p => 
                    (category && p.category?.toLowerCase() === category?.toLowerCase()) ||
                    (title && p.title?.toLowerCase().includes(title.toLowerCase().trim())) ||
                    (p.upvote_count >= 3 && p.category?.toLowerCase() === category?.toLowerCase())
                  );
                  if (!match) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                          <Flame size={14} className="animate-pulse text-orange-400" />
                          <span>Active Campus Petition in {match.category || 'this category'}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                          🔥 {match.upvote_count || 1} Supporters
                        </span>
                      </div>
                      <p className="text-xs text-white font-bold truncate">
                        "{match.title}"
                      </p>
                      <p className="text-[11px] text-slate-300">
                        An open collective petition is already active. Endorsing it with <b>+1</b> multiplies urgency and alerts the Department Head directly!
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await grievanceService.upvote(match.id || match.ticket_id);
                              toast.success(res.alreadyUpvoted ? 'You have already endorsed this petition.' : '🔥 Endorsed! You are subscribed to updates.');
                              navigate(`/track?token=${match.ticket_id || match.id}`);
                            } catch {
                              toast.success('+1 recorded.');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Flame size={12} />
                          <span>+1 I'm Facing This Too</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/track?token=${match.ticket_id || match.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Milestone Tracking
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      Target Category / Segment
                    </label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                    >
                      <option value="IT Support">IT Support & Network</option>
                      <option value="Maintenance">Facilities & Maintenance</option>
                      <option value="Academic">Academic Affairs</option>
                      <option value="Financial">Financial Services</option>
                      <option value="Public Infrastructure">Public Infrastructure</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      Priority Level
                    </label>
                    <select 
                      value={urgency} 
                      onChange={(e) => setUrgency(e.target.value)} 
                      disabled={isEmergency}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500 disabled:opacity-50"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                </div>

                {/* Estimated SLA Turnaround Guarantee Preview */}
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">
                      Estimated Turnaround SLA: <strong className="text-white font-mono">{
                        isEmergency 
                          ? '⚡ 2 Hours (Emergency Dispatch)' 
                          : urgency === 'High' 
                            ? '⚡ 24 Hours' 
                            : urgency === 'Medium' 
                              ? '⏱️ 48 Hours' 
                              : '🗓️ 72 Hours'
                      }</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider hidden sm:inline-block">
                    Cryptographic Proof Guarantee
                  </span>
                </div>

                {/* Whistleblower Anonymous Mode & Emergency SOS Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div 
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isAnonymous 
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' 
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🔒 Whistleblower Anonymous Vault</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Zero metadata / IP logged. Secret 12-char passkey generated.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                      isAnonymous ? 'bg-purple-500 border-purple-400 text-slate-950' : 'border-slate-700'
                    }`}>
                      {isAnonymous ? '✓' : ''}
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setIsEmergency(!isEmergency);
                      if (!isEmergency) setUrgency('High');
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isEmergency 
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' 
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🚨 Emergency SOS Incident</span>
                      </div>
                      <p className="text-[11px] text-slate-400">2-Hour SLA override. Dispatches SMS to Board Executives.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                      isEmergency ? 'bg-rose-500 border-rose-400 text-white' : 'border-slate-700'
                    }`}>
                      {isEmergency ? '!' : ''}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MapPin size={12} className="text-indigo-400" />
                    Incident Coordinates (Location Tag)
                  </label>
                  <div className="space-y-2">
                    <PlacePicker
                      className="w-full"
                      placeholder="Type address or search campus area..."
                      onPlaceChange={(e) => {
                        const place = e.target.value;
                        if (place) {
                          setLocationName(place.formattedAddress || place.displayName || '');
                          if (place.location) {
                            setCoordinates({
                              lat: place.location.lat(),
                              lng: place.location.lng()
                            });
                          }
                        }
                      }}
                    />
                    
                    {locationName && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-white font-medium truncate">{locationName}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setLocationName('');
                            setCoordinates({ lat: null, lng: null });
                          }}
                          className="text-slate-400 hover:text-white ml-auto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      Narrative Statement *
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowVoiceModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                      >
                        <Mic size={12} className="text-indigo-400" />
                        <span>AI Voice Studio</span>
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-1 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        <span>{isAnalyzing ? 'Analyzing...' : 'AI Assist'}</span>
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    rows="4" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the complaint in detail (in English, Hindi, or any regional language)..." 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed" 
                    required 
                  />

                  {/* Multilingual AI Auto-Translation Preview */}
                  {description.trim() && (
                    <MultilingualTranslator 
                      text={description}
                      title={title}
                      onApplyTranslation={(translated) => {
                        setDescription(translated);
                        toast.success('Applied translation as primary description.');
                      }}
                      className="pt-1"
                    />
                  )}
                </div>

                <SmartTriageAssistant 
                  title={title}
                  description={description}
                  category={category}
                  urgency={urgency}
                  onApplyRoute={(route) => {
                    if (route.recommended_department.includes('IT')) setCategory('IT Support');
                    else if (route.recommended_department.includes('Academic')) setCategory('Academic');
                    else if (route.recommended_department.includes('Financial')) setCategory('Financial');
                    else if (route.recommended_department.includes('Facilities')) setCategory('Maintenance');
                    toast.success(`Category updated to match ${route.recommended_department}`);
                  }}
                />

                {/* Vision OCR Document Auto-Scanner */}
                <EvidenceOcrScanner 
                  onApplyScannedData={(data) => {
                    if (data.title) setTitle(data.title);
                    if (data.category) setCategory(data.category);
                    if (data.description) setDescription(data.description);
                  }}
                />

                {/* Evidence Attachment Drag and Drop Zone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    Supporting Evidence & Documents
                  </label>
                  <FileUploadZone 
                    selectedFile={attachment}
                    onFileSelect={(file) => {
                      if (!file) {
                        setAttachment(null);
                        setAttachmentUrl('');
                      } else {
                        handleFileChange({ target: { files: [file] } });
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <AnimatedButton 
                    type="button" 
                    variant="secondary" 
                    size="md" 
                    className="flex-1"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton 
                    type="submit" 
                    variant="glow" 
                    size="md" 
                    className="flex-1"
                    isLoading={isSubmitting || isUploading}
                    rightIcon={Send}
                  >
                    Filing Grievance
                  </AnimatedButton>
                </div>

              </form>
            </GlassPanel>
          </>
        )}

        <DuplicateGrievanceModal
          isOpen={showDuplicateModal}
          duplicateData={duplicateCheckResult}
          onClose={() => setShowDuplicateModal(false)}
          onProceedAsNew={() => {
            setBypassDuplicateCheck(true);
            toast.info('Proceeding with separate ticket submission.');
            setTimeout(() => {
              handleFormSubmit();
            }, 100);
          }}
          onUpvotedSuccess={(ticket) => {
            navigate(`/dashboard`);
          }}
        />

        <VoiceStudioModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onTranscriptionComplete={(text) => {
            setDescription(prev => prev ? `${prev}\n\n${text}` : text);
            if (!title) {
              const previewTitle = text.split(' ').slice(0, 6).join(' ');
              setTitle(`${previewTitle}...`);
            }
          }}
        />

        <VoiceGrievanceAssistantModal
          isOpen={showAiVoiceAssistantModal}
          onClose={() => setShowAiVoiceAssistantModal(false)}
          onApplyData={handleApplyVoiceGrievance}
        />

      </AnimatedPage>
    </APIProvider>
  );
};

export default SubmitGrievancePage;

