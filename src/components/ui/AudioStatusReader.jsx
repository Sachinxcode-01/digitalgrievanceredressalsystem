import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Languages, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const AudioStatusReader = ({ ticket }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'hi'

  useEffect(() => {
    // Stop speech synthesis if component unmounts
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!ticket) return null;

  const constructSpokenText = (lang) => {
    const ticketId = ticket.ticket_id || 'Reference Number Pending';
    const title = ticket.title || 'Grievance ticket';
    const status = ticket.status || 'Under Review';
    const dept = ticket.department || 'Department Nodal Authority';
    const notes = ticket.resolution_notes || 'Officer is currently investigating the on-site issue.';

    if (lang === 'hi') {
      return `शिकायत संख्या ${ticketId} की वर्तमान स्थिति है: ${status}। संबंधित विभाग है: ${dept}। विषय: ${title}। अद्यतन टिप्पणी: ${notes}। धन्यवाद।`;
    }

    return `Grievance ticket reference ${ticketId}. The current status is: ${status}. Assigned department is: ${dept}. Subject: ${title}. Latest update from nodal officer: ${notes}. Thank you for tracking with ResolveNow.`;
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Voice playback is not supported on this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    const textToSpeak = constructSpokenText(language);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95; // Slightly calmer speaking rate
    utterance.pitch = 1.0;
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    toast.success(language === 'hi' ? 'ऑडियो स्थिति प्लेबैक शुरू हुआ' : 'Playing audio status read-aloud 🔊');
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-surface/90 border border-border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
          isPlaying 
            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 animate-pulse' 
            : 'bg-background text-muted-foreground border-border'
        }`}>
          <Volume2 size={18} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-heading font-black text-foreground">
              🔊 Listen to Status (Voice Accessibility)
            </span>
            <span className="text-[9px] font-mono uppercase bg-indigo-500/15 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/30">
              Audio
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Listen to the latest officer remarks and resolution notes read aloud.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Language selector */}
        <button
          type="button"
          onClick={() => {
            const nextLang = language === 'en' ? 'hi' : 'en';
            setLanguage(nextLang);
            if (isPlaying) handleStop();
            toast.success(`Audio language: ${nextLang === 'hi' ? 'हिंदी (Hindi)' : 'English'}`);
          }}
          className="px-2.5 py-1.5 rounded-xl bg-background border border-border hover:border-indigo-500/40 text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
          title="Toggle Language"
        >
          <Languages size={13} />
          <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
        </button>

        {/* Play/Pause Button */}
        {!isPlaying ? (
          <button
            type="button"
            onClick={handleSpeak}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
          >
            <Play size={13} className="fill-current" />
            <span>Play Audio</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePause}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Pause size={13} className="fill-current" />
              <span>Pause</span>
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-xl bg-background border border-border hover:bg-rose-500/20 text-rose-400 text-xs cursor-pointer transition-colors"
              title="Stop audio"
            >
              <VolumeX size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioStatusReader;
