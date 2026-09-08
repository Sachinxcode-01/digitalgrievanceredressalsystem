import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, UploadCloud, X, Sparkles, RefreshCw, Check, AlertCircle, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

export const VoiceStudioModal = ({ isOpen, onClose, onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [extractedEntities, setExtractedEntities] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const VOICE_LANGUAGES = [
    { code: 'en-US', label: 'English (US / India)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)' },
    { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)' },
    { code: 'bn-IN', label: 'Bengali (বাংলা)' },
    { code: 'mr-IN', label: 'Marathi (मराठी)' },
    { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
    { code: 'es-ES', label: 'Spanish (Español)' },
    { code: 'fr-FR', label: 'French (Français)' }
  ];

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Browser speech recognition not available. Please use Chrome/Edge or upload an audio file.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingDuration(0);
      toast.success('Microphone active. Speak your grievance clearly...');
    };

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' ';
      }
      setLiveTranscript(current.trim());
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      setIsRecording(false);
      if (e.error !== 'no-speech') {
        toast.error(`Microphone alert: ${e.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav') && !file.name.endsWith('.m4a') && !file.name.endsWith('.webm')) {
      toast.error('Please select a valid audio file (MP3, WAV, M4A, WebM).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file size exceeds 10MB limit.');
      return;
    }

    setAudioFile(file);
    setIsTranscribingFile(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        const res = await grievanceService.transcribeVoice(base64Data, file.type || 'audio/webm', selectedLang);
        if (res && res.transcript) {
          setLiveTranscript(res.transcript);
          if (res.title_suggestion || res.category_suggestion) {
            setExtractedEntities({
              title: res.title_suggestion || '',
              category: res.category_suggestion || 'IT Support',
              urgency: res.urgency_suggestion || 'Medium',
              description: res.transcript
            });
          }
          toast.success('Audio file transcribed and analyzed!');
        }
        setIsTranscribingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Audio transcription failed: ' + err.message);
      setIsTranscribingFile(false);
    }
  };

  const handleApplyFullGrievance = () => {
    if (!liveTranscript.trim()) {
      toast.error('No speech audio captured.');
      return;
    }
    const payload = extractedEntities ? {
      ...extractedEntities,
      description: liveTranscript.trim()
    } : {
      title: liveTranscript.split(' ').slice(0, 6).join(' ') + '...',
      description: liveTranscript.trim(),
      category: 'IT Support',
      urgency: 'Medium'
    };
    onTranscriptionComplete(payload);
    toast.success('Grievance form populated from voice analysis!');
    onClose();
  };

  const handleConfirmTranscript = () => {
    if (!liveTranscript.trim()) {
      toast.error('No transcribed voice text to apply.');
      return;
    }

    onTranscriptionComplete(liveTranscript.trim());
    toast.success('Voice dictation applied to grievance description.');
    onClose();
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-black text-white uppercase tracking-tight">
                AI Voice-to-Text Studio
              </h3>
              <p className="text-xs text-slate-400">Speak or upload an audio note in your preferred language.</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Spoken Language Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            Select Spoken Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="w-full bg-slate-950 border border-white/10 text-white text-xs font-mono font-bold rounded-xl px-4 py-2.5 outline-none cursor-pointer focus:border-indigo-500"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Live Recording Area */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 text-center space-y-4 relative overflow-hidden">
          {/* Waveform Pulse Animation */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 h-12">
              {[40, 70, 90, 60, 100, 50, 80, 65, 95, 45, 85].map((h, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: [`${h * 0.2}%`, `${h}%`, `${h * 0.4}%`] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.08 }}
                  className="w-1.5 rounded-full bg-linear-to-t from-indigo-500 via-cyan-400 to-rose-400"
                />
              ))}
            </div>
          )}

          {!isRecording && (
            <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Volume2 size={24} />
            </div>
          )}

          <div className="space-y-1">
            <span className="font-mono text-2xl font-black text-white">
              {isRecording ? formatTimer(recordingDuration) : '00:00'}
            </span>
            <p className="text-xs text-slate-400 font-medium">
              {isRecording ? 'Listening and transcribing live...' : 'Press microphone to begin recording'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-extrabold uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105 cursor-pointer"
              >
                <Mic size={16} /> Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-heading font-extrabold uppercase tracking-wider shadow-xl shadow-rose-600/30 animate-pulse transition-all cursor-pointer"
              >
                <MicOff size={16} /> Stop Recording
              </button>
            )}
          </div>
        </div>

        {/* Audio File Upload Alternative */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <UploadCloud size={16} className="text-indigo-400" />
            <span>Or upload audio file:</span>
          </div>

          <label className="cursor-pointer">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-white/10 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5">
              {isTranscribingFile ? <RefreshCw size={12} className="animate-spin" /> : null}
              {isTranscribingFile ? 'Transcribing...' : 'Upload Audio'}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioFileUpload}
              disabled={isTranscribingFile || isRecording}
            />
          </label>
        </div>

        {/* Live Transcript Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span>Captured Transcription</span>
            {liveTranscript && <span className="text-emerald-400 font-bold">Ready to apply</span>}
          </div>
          <textarea
            rows={3}
            value={liveTranscript}
            onChange={(e) => setLiveTranscript(e.target.value)}
            placeholder="Live speech transcript will appear here in real-time..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 resize-none font-sans"
          />
        </div>

        {/* AI Extracted Grievance Summary Card */}
        {extractedEntities && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2"
          >
            <div className="flex items-center gap-1.5 text-indigo-300 text-[11px] font-mono font-bold">
              <Sparkles size={13} className="text-indigo-400" />
              <span>AI Extracted Grievance Package</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Suggested Title</span>
                <span className="text-white font-semibold truncate block">{extractedEntities.title || 'Voice Grievance'}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Category</span>
                  <span className="text-emerald-400 font-bold">{extractedEntities.category || 'IT Support'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Urgency</span>
                  <span className="text-amber-400 font-bold">{extractedEntities.urgency || 'Medium'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleConfirmTranscript}
              disabled={!liveTranscript.trim()}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer"
              title="Only copy transcribed words into the description box"
            >
              <Check size={14} className="inline mr-1" /> Insert Text Only
            </button>

            <button
              type="button"
              onClick={handleApplyFullGrievance}
              disabled={!liveTranscript.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 disabled:opacity-40 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              title="Populate Title, Category, Urgency, and Narrative together"
            >
              <Sparkles size={14} /> Apply Full Grievance
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VoiceStudioModal;
