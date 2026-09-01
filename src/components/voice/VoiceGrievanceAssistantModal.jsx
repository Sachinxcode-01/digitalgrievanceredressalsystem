import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Globe
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'es-ES', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français (French)', flag: '🇫🇷' }
];

export default function VoiceGrievanceAssistantModal({ isOpen, onClose, onApplyData }) {
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Voice Assistant. Speak naturally to describe your issue, and I will draft your grievance ticket.'
    }
  ]);
  const [extractedGrievance, setExtractedGrievance] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      if (synthRef.current) synthRef.current.cancel();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };
      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Greet user via TTS on open
    if (isTtsEnabled) {
      speakResponse('Hello! Please speak your grievance or issue.');
    }

    return () => {
      stopListening();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isOpen, selectedLang]);

  const speakResponse = (text) => {
    if (!isTtsEnabled || !synthRef.current || !text) return;
    synthRef.current.cancel(); // Stop ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Pick suitable voice if available
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome or Edge, or type your message.');
      return;
    }
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || transcript).trim();
    if (!text) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setTranscript('');
    setIsProcessing(true);
    stopListening();

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/v1/ai/voice-assistant/converse',
        {
          message: text,
          history: newMessages.slice(-5),
          language: selectedLang
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const data = res.data;
      if (data.spokenResponse) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.spokenResponse }]);
        speakResponse(data.spokenResponse);
      }

      if (data.extractedData) {
        setExtractedGrievance(data.extractedData);
      }
    } catch (err) {
      console.error('Voice conversation error:', err);
      const fallbackMsg = "I've noted down your issue. You can review the details below.";
      setMessages(prev => [...prev, { role: 'assistant', text: fallbackMsg }]);
      speakResponse(fallbackMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!extractedGrievance) {
      toast.error('No grievance details to apply yet.');
      return;
    }

    onApplyData(extractedGrievance);
    toast.success('Grievance form pre-filled from Voice Assistant!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Voice Grievance Assistant</h3>
                <p className="text-xs text-slate-400">Two-way speech intake & instant entity structuring</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TTS Mute Button */}
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`p-2 rounded-lg border transition ${
                  isTtsEnabled 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={isTtsEnabled ? 'Voice output enabled' : 'Voice output muted'}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversation Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-55 max-h-90">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {isProcessing && (
              <div className="flex items-center space-x-2 text-indigo-400 text-xs animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Assistant is thinking & structuring your grievance...</span>
              </div>
            )}
          </div>

          {/* Extracted Structured Card */}
          {extractedGrievance && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mb-3 p-4 rounded-xl bg-slate-800/80 border border-indigo-500/40 text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Structured Grievance Draft Ready
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  {extractedGrievance.department}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500">Category:</span> <span className="font-medium text-white">{extractedGrievance.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">Urgency:</span> <span className={`font-semibold ${
                    extractedGrievance.urgency === 'Critical' ? 'text-red-400' :
                    extractedGrievance.urgency === 'High' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{extractedGrievance.urgency}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Title:</span> <span className="font-medium text-white">{extractedGrievance.title}</span>
              </div>

              <button
                onClick={handleApply}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>Apply to Grievance Form & Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Voice Input Controls */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col items-center space-y-3">
            {/* Live Waveform Pulse when Recording */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-20 h-20 rounded-full bg-rose-500/20 animate-ping" />
                  <span className="absolute w-16 h-16 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 p-5 rounded-full shadow-lg transition-transform transform active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/40 shadow-rose-600/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/30 shadow-indigo-600/30'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center font-medium">
              {isListening 
                ? '🎙️ Listening... Speak your grievance clearly.' 
                : 'Click the microphone to start speaking your issue.'}
            </p>

            {/* Transcript Preview & Manual Text Input Fallback */}
            <div className="w-full flex items-center gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(transcript)}
                placeholder="Or type what happened here..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendMessage(transcript)}
                disabled={!transcript.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
