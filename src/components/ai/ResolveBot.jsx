import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, User, Volume2, Sparkles, 
  ArrowRight, Search, ExternalLink, ShieldCheck, Wifi, CreditCard, 
  HelpCircle, PlusCircle, CheckCircle2, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../services/grievanceService';

const QUICK_ACTIONS = [
  { icon: Search, label: 'Track Ticket', query: 'How do I track my grievance ticket status?' },
  { icon: Wifi, label: 'Wi-Fi & EduNet', query: 'Campus Wi-Fi is not connecting or EduNet DNS issues' },
  { icon: CreditCard, label: 'Fees & Receipts', query: 'Where can I download verified fee receipts or inquire about scholarships?' },
  { icon: PlusCircle, label: 'Submit Complaint', query: 'I want to submit an urgent grievance ticket' },
];

export const ResolveBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Hi! I'm your AI Resolution Assistant. Describe your grievance, paste a ticket ID (e.g. #TKT-2026-XXXX), or pick a quick topic below!", 
      isBot: true 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const speakText = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      // Clean markdown/special characters before speech
      const cleanedText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      synthRef.current.speak(utterance);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const extractTicketId = (text) => {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/(#?TKT-\d{4}-[A-Z0-9]+)/i);
    return match ? match[1].toUpperCase() : null;
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const submitQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setMessages(prev => [...prev, { text: queryText, isBot: false }]);
    setIsTyping(true);

    try {
      const headers = await getAuthHeaders();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: queryText })
      });

      if (!response.ok) {
        throw new Error('Failed to start stream');
      }

      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let replyAccumulator = '';

      setMessages(prev => [...prev, { text: '', isBot: true, isStreaming: true }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  replyAccumulator += parsed.text;
                  setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.isStreaming) {
                      last.text = replyAccumulator;
                    }
                    return next;
                  });
                }
              } catch {
                // Ignore chunk split parsing
              }
            }
          }
        }
      }

      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.isStreaming) {
          const updatedLast = { ...last };
          delete updatedLast.isStreaming;
          if (!updatedLast.text) {
            updatedLast.text = "I'm here to assist with any campus grievances or questions. You can describe your issue in detail or submit a new grievance ticket!";
          }
          next[next.length - 1] = updatedLast;
        }
        return next;
      });

    } catch (error) {
      console.warn("ResolveBot stream fallback attempting:", error.message);
      setIsTyping(false);

      // Fallback to non-streaming POST /chat
      try {
        const headers = await getAuthHeaders();
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: queryText })
        });
        const data = await res.json();
        const fallbackReply = data.reply || "I'm your AI Resolution Assistant. How can I assist you with your campus queries or ticket submissions today?";
        setMessages(prev => {
          const next = prev.filter(m => !(m.isStreaming && !m.text));
          return [...next, { text: fallbackReply, isBot: true }];
        });
      } catch {
        setMessages(prev => {
          const next = prev.filter(m => !(m.isStreaming && !m.text));
          return [...next, { text: "I'm your AI Resolution Assistant. Describe your issue in detail or submit a grievance ticket directly from your dashboard!", isBot: true }];
        });
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    const text = inputMessage;
    setInputMessage('');
    await submitQuery(text);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 z-50 cursor-pointer overflow-hidden group border border-indigo-400/40"
            aria-label="Open ResolveBot Assistant"
          >
            <MessageCircle className="text-white relative z-10" size={22} />
            <div className="absolute inset-0 bg-indigo-500/20 blur-md group-hover:blur-lg transition-all" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-[92vw] max-w-97.5 h-130 z-50 rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/80 text-left"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 flex justify-between items-center bg-slate-900/70 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center relative shadow-xs">
                  <Bot size={17} className="text-indigo-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-950" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-white text-xs leading-none">ResolveBot AI</h3>
                  <p className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest font-bold mt-1">24/7 Redressal Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  to="/knowledge-base"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[10px] font-mono flex items-center gap-1"
                  title="Knowledge Base"
                >
                  <HelpCircle size={14} />
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close Assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Navigation Ribbon */}
            <div className="px-3 py-1.5 bg-indigo-950/30 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400 font-bold">
                <Sparkles size={11} /> Quick Links:
              </span>
              <div className="flex items-center gap-2 font-medium">
                <Link 
                  to="/submit" 
                  onClick={() => setIsOpen(false)} 
                  className="hover:text-indigo-300 text-slate-300 transition-colors flex items-center gap-0.5"
                >
                  <span>Submit</span>
                  <ArrowRight size={10} />
                </Link>
                <span>&bull;</span>
                <Link 
                  to="/public-status" 
                  onClick={() => setIsOpen(false)} 
                  className="hover:text-cyan-300 text-slate-300 transition-colors flex items-center gap-0.5"
                >
                  <span>Track</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 bg-slate-950/40">
              {messages.map((msg, idx) => {
                const ticketId = extractTicketId(msg.text);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex gap-2 text-left ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex shrink-0 items-center justify-center border ${msg.isBot ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800 border-white/10 text-slate-300'}`}>
                      {msg.isBot ? <Bot size={13} /> : <User size={13} />}
                    </div>

                    <div className="relative group/msg max-w-[80%] space-y-1.5">
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.isBot ? 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-xs shadow-xs' : 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white font-medium rounded-tr-xs shadow-md'}`}>
                        {msg.text}
                      </div>

                      {/* Detected Ticket Card Snippet */}
                      {ticketId && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
                            <span className="text-[11px] font-mono font-bold text-indigo-300 truncate">
                              {ticketId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleCopy(ticketId, `ticket-${idx}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              title="Copy Ticket ID"
                            >
                              {copiedId === `ticket-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                            <Link
                              to={`/public-status?ticketId=${ticketId.replace('#', '')}`}
                              onClick={() => setIsOpen(false)}
                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-bold transition-colors flex items-center gap-1"
                            >
                              Track
                              <ArrowRight size={10} />
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Speak Button for bot messages */}
                      {msg.isBot && msg.text && (
                        <button 
                          onClick={() => speakText(msg.text)}
                          className="absolute -right-6 top-2 p-1 rounded-md bg-slate-900 hover:bg-slate-800 opacity-0 group-hover/msg:opacity-100 transition-opacity text-indigo-400 border border-white/10"
                          title="Read aloud"
                          aria-label="Read message aloud"
                        >
                          <Volume2 size={10} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Bot size={13} />
                  </div>
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-2.5 flex gap-1.5 rounded-tl-xs items-center">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-3 pt-2 pb-1 border-t border-white/5 bg-slate-950/80">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => submitQuery(action.query)}
                      disabled={isTyping}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-indigo-900/40 border border-white/10 hover:border-indigo-400/40 text-slate-300 hover:text-white text-[10px] font-mono transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Icon size={10} className="text-indigo-400" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/10 bg-slate-900/90">
              <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question or enter ticket ID..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-1.5 p-1 rounded-lg text-indigo-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  aria-label="Send query"
                >
                  <Send size={13} />
                </button>
              </form>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mt-1.5 px-0.5">
                <span>Zero-Trust Protocol Active</span>
                <span className="text-emerald-400 font-bold">● AI Online</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResolveBot;
