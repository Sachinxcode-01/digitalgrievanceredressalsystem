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

  // Auto-save draft check on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('resolvenow_grievance_draft');
    if (savedDraft) {
      setShowDraftBanner(true);
    }
  }, []);

  // Periodic Auto-Save
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
    } catch (err) {
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

  // AI Assistant Analysis
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
    } catch (err) {
      toast.error("AI triage backend offline. Standard defaults applied.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dictation Speech to Text
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice dictation is not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
      toast.success("Voice inputs appended.");
    };
    recognition.start();
  };

  // File Upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      toast.success(`Attached successfully: ${file.name}`);
    } catch (err) {
      toast.error(`File upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearAttachment = () => {
    setAttachment(null);
    setAttachmentUrl('');
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Subject and narrative statement are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // The ticket reference is generated by the server (collision-safe) and returned
      // in the response — we never generate it on the client.
      const created = await grievanceService.create({
        user_id: user?.id?.startsWith('demo-') ? null : user?.id,
        email: user?.email,
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

      // Clean up draft
      localStorage.removeItem('resolvenow_grievance_draft');

      setSubmittedTicket(created);
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
      <div className="space-y-6 max-w-3xl mx-auto pb-12 text-left">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-all"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-heading font-black text-foreground uppercase tracking-wider">File Grievance</h1>
            <p className="text-xs text-muted-foreground font-medium">Record a new institutional issue in the national registry.</p>
          </div>
        </div>

        {/* Success Confirmation */}
        {submittedTicket && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-heading font-black text-foreground">Grievance Submitted</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your grievance has been registered and routed to the right department. Save your ticket reference to track progress.
              </p>
            </div>

            <div className="max-w-sm mx-auto bg-background border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ticket Reference</span>
                <button type="button" onClick={copyTicketId} className="text-muted-foreground hover:text-primary-bright transition-colors" title="Copy ticket ID">
                  <Copy size={14} />
                </button>
              </div>
              <p className="font-mono text-xl font-black text-primary-bright tracking-tight">{submittedTicket.ticket_id}</p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded-full bg-primary-bright/10 text-primary-bright border border-primary-bright/20">{submittedTicket.status}</span>
                {submittedTicket.department && (
                  <span className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">{submittedTicket.department}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button type="button" onClick={() => navigate('/grievances')} className="btn-premium px-5 py-2.5 w-full sm:w-auto">
                <span>Track My Grievances</span>
                <ArrowRight size={14} />
              </button>
              <button type="button" onClick={fileAnother} className="btn-ghost px-5 py-2.5 w-full sm:w-auto">
                File Another
              </button>
            </div>
          </motion.div>
        )}

        {/* Draft Restore Alert */}
        {!submittedTicket && (
        <>
        <AnimatePresence>
          {showDraftBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary-bright/5 border border-primary-bright/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex gap-3">
                <ClipboardList className="text-primary-bright shrink-0" size={18} />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">Unfinished Draft Found</h4>
                  <p className="text-[10px] text-muted-foreground">You have an autosaved grievance draft that was not submitted.</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={restoreDraft} className="px-3 py-1.5 bg-primary-bright text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">Restore</button>
                <button onClick={discardDraft} className="px-3 py-1.5 bg-background border border-border text-muted-foreground hover:text-foreground text-[10px] font-bold rounded-lg uppercase tracking-wider">Discard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Subject Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Specification</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Summary of the incident (e.g. WiFi outage in Library)" 
                className="glass-input w-full" 
                required 
              />
            </div>

            {/* Category / Department & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Category / Segment</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="glass-input w-full bg-background border border-border text-foreground py-2.5 px-3 text-xs rounded-lg cursor-pointer"
                >
                  <option>IT Support</option>
                  <option>Maintenance</option>
                  <option>Academic</option>
                  <option>Financial</option>
                  <option>Public Infrastructure</option>
                  <option>Eco-Sustainability</option>
                  <option>Social Welfare</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Priority Level</label>
                <select 
                  value={urgency} 
                  onChange={(e) => setUrgency(e.target.value)} 
                  className="glass-input w-full bg-background border border-border text-foreground py-2.5 px-3 text-xs rounded-lg cursor-pointer"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            {/* Incident Location Tagging */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <MapPin size={12} className="text-primary-bright" />
                Incident Coordinates (Location Tag)
              </label>
              <div className="space-y-2">
                <PlacePicker
                  className="glass-input w-full"
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
                  <div className="p-2.5 rounded-lg bg-success/5 border border-success/20 flex items-center gap-2 text-xs">
                    <CheckCircle2 size={12} className="text-success shrink-0" />
                    <span className="text-foreground font-medium truncate">{locationName}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setLocationName('');
                        setCoordinates({ lat: null, lng: null });
                      }}
                      className="text-muted-foreground hover:text-foreground ml-auto p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Narrative statement description */}
            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Narrative Statement</label>
                
                <div className="flex gap-1.5">
                  <button 
                    type="button" 
                    onClick={startVoiceInput}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      isListening 
                        ? 'bg-error/10 text-error border-error/20 animate-pulse' 
                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {isListening ? <MicOff size={10} /> : <Mic size={10} />}
                    <span>{isListening ? 'Listening' : 'Dictate'}</span>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={handleAiAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1 px-2.5 py-1 border border-primary-bright/20 bg-primary-bright/5 hover:bg-primary-bright/10 text-primary-bright text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    <span>{isAnalyzing ? 'Analyzing...' : 'AI Assist'}</span>
                  </button>
                </div>
              </div>
              
              <textarea 
                rows="4" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the complaint in detail. Use AI Assist to audit spelling, automatically categorize, and evaluate urgency priorities." 
                className="glass-input w-full resize-none py-3" 
                required 
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Evidence Attachment (Max 5MB)</label>
              
              {attachmentUrl ? (
                <div className="p-3 bg-background border border-border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Paperclip size={14} className="text-primary-bright shrink-0" />
                    <span className="text-foreground font-semibold truncate max-w-xs">{attachment?.name || 'File Attached'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleClearAttachment}
                    className="text-muted-foreground hover:text-error transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative group overflow-hidden rounded-lg border border-border hover:border-primary-bright/20 transition-all bg-background/50 p-4 flex flex-col items-center justify-center cursor-pointer text-center">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    <Plus size={20} className="text-muted-foreground/60" />
                    <span className="text-xs font-semibold">Upload supporting document, PDF, or screenshot</span>
                    <span className="text-[9px] text-muted-foreground/50">Only images and document streams under 5MB permitted.</span>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-primary-bright" />
                      <span className="text-xs font-bold text-foreground">Uploading Attachment...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-border/40">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="btn-ghost py-2.5 flex-1"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting || isUploading} 
                type="submit" 
                className="btn-premium py-2.5 flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Filing Grievance</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
        </>
        )}

      </div>
    </APIProvider>
  );
};

export default SubmitGrievancePage;
