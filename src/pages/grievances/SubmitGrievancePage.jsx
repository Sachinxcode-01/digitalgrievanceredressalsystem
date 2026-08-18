import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Loader2, Mic, MicOff, CheckCircle2, 
  MapPin, X, Plus, ArrowLeft, Paperclip, ClipboardList,
  Copy, ArrowRight, Ticket
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

export const SubmitGrievancePage = ({ user, sessionUser }) => {
  const currentUser = user || sessionUser;
  const navigate = useNavigate();
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
  const [isListening, setIsListening] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Duplicate Check states
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);


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

  const [voiceLang, setVoiceLang] = useState('en-US');

  const startVoiceInput = (lang = voiceLang) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice dictation is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success(`Voice recording active (${lang === 'hi-IN' ? 'Hindi' : 'English'}). Speak now...`);
    };

    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (e) => {
      setIsListening(false);
      toast.error(`Voice recognition alert: ${e.error}`);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev ? `${prev}\n${transcript}` : transcript);
      toast.success("Voice narrative captured!");
    };
    recognition.start();
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
        user_id: user?.id || sessionUser?.id || 'demo-student-id-101',
        email: user?.email || sessionUser?.email || 'student@resolvenow.demo',
        title,
        description,
        category,
        urgency,
        frustration_index: frustrationIndex,
        attachment_url: attachmentUrl,
        location: locationName,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      });

      logSecurityEvent('New Grievance Transmitted', user?.email || 'citizen', 'Submit Page', 'warning');
      localStorage.removeItem('resolvenow_grievance_draft');
      setSubmittedTicket(created);
      setBypassDuplicateCheck(false);
      toast.success(`Grievance submitted. Ticket ID: ${created?.ticket_id || 'assigned'}`);
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
              <h2 className="text-xl font-heading font-black text-white">Grievance Submitted</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your grievance has been registered and routed to the department authority. Save your ticket reference.
              </p>
            </div>

            <div className="max-w-sm mx-auto bg-slate-950 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Ticket Reference</span>
                <button type="button" onClick={copyTicketId} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Copy ticket ID">
                  <Copy size={14} />
                </button>
              </div>
              <p className="font-mono text-2xl font-black text-indigo-400 tracking-wider">{submittedTicket.ticket_id}</p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{submittedTicket.status}</span>
              </div>
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

            <GlassPanel className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleFormSubmit} className="space-y-5">
                
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
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
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

                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                      Narrative Statement *
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={voiceLang}
                        onChange={(e) => setVoiceLang(e.target.value)}
                        className="bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-mono font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="hi-IN">Hindi (हिंदी)</option>
                      </select>

                      <button 
                        type="button" 
                        onClick={() => startVoiceInput(voiceLang)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isListening 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse shadow-lg shadow-rose-500/20' 
                            : 'bg-slate-900 text-slate-300 border-white/10 hover:text-white hover:border-indigo-500/40'
                        }`}
                      >
                        {isListening ? <MicOff size={11} className="text-rose-400" /> : <Mic size={11} className="text-indigo-400" />}
                        <span>{isListening ? 'Recording...' : 'Dictate'}</span>
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3 py-1 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-indigo-500/20 rounded-lg cursor-pointer disabled:opacity-50"
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
                    placeholder="Describe the complaint in detail..." 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 resize-none" 
                    required 
                  />
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

                {/* Attachment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    Evidence Attachment (Max 5MB)
                  </label>
                  
                  {attachmentUrl ? (
                    <div className="p-3 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Paperclip size={14} className="text-indigo-400 shrink-0" />
                        <span className="text-white font-medium truncate">{attachment?.name || 'File Attached'}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleClearAttachment}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-dashed border-white/10 hover:border-indigo-500/40 bg-slate-950/60 p-4 flex flex-col items-center justify-center cursor-pointer text-center">
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white">
                        <Plus size={20} />
                        <span className="text-xs font-semibold">Upload supporting document, PDF, or screenshot</span>
                        <span className="text-[9px] text-slate-500 font-mono">Max file size 5MB</span>
                      </div>
                    </div>
                  )}
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

      </AnimatedPage>
    </APIProvider>
  );
};

export default SubmitGrievancePage;

