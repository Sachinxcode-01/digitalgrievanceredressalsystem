import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, X, Send, Sparkles, MessageSquare, ShieldCheck, 
  HelpCircle, ArrowRight, CornerDownLeft, ThumbsUp, 
  Clock, Lock, RefreshCw, Volume2, UserCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

const KNOWLEDGE_BASE_FAQS = [
  {
    q: 'How long does resolution take (SLA)?',
    a: 'Every complaint has a strict Service Level Agreement (SLA). Emergency cases take under 2 hours, IT Wi-Fi issues typically 24 hours, and standard campus repairs 48 hours. If delayed, cases escalate to the Department Head.'
  },
  {
    q: 'Can I file complaints anonymously?',
    a: 'Yes! Select the "Whistleblower Anonymous" toggle on the submission page. No personal name, email, or IP address is logged. You receive a cryptographic Secret Passkey to track progress privately.'
  },
  {
    q: 'What if an officer closes my issue without fixing it?',
    a: 'You hold the final word! You can click "Appeal & Dispute" within 7 days. This automatically transfers the ticket to Tier 2 (Department Head) or Tier 3 (Institutional Ombudsman) for direct investigation.'
  },
  {
    q: 'How do I track my ticket without logging in?',
    a: 'Visit the Public Tracking Portal at /track and enter your Ticket Reference ID (e.g. TKT-2026-XXXX) to view live milestones, officer remarks, and SLA countdowns.'
  }
];

export const AiOmbudsmanWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Hello! I am your AI Ombudsman Assistant. How can I help you today? You can ask about campus policies, SLA timelines, appeal rights, or click any quick question below.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Check knowledge base matching
    const matchedFaq = KNOWLEDGE_BASE_FAQS.find((faq) =>
      textToSend.toLowerCase().includes(faq.q.toLowerCase().slice(0, 15)) ||
      faq.q.toLowerCase().includes(textToSend.toLowerCase())
    );

    setTimeout(async () => {
      let botResponse = '';
      let isActionable = false;

      if (matchedFaq) {
        botResponse = matchedFaq.a;
      } else {
        try {
          // Attempt backend AI triage / knowledge lookup
          const res = await apiClient.post('/ai/smart-route', {
            title: textToSend,
            description: textToSend,
            category: 'General',
            urgency: 'Medium'
          });

          if (res.data?.suggested_action) {
            botResponse = `Based on institutional policy: ${res.data.suggested_action} Assigned unit: ${res.data.recommended_department || 'General Redressal'} with expected SLA of ${res.data.predicted_sla_hours || 48} hours.`;
            isActionable = true;
          } else {
            botResponse = `I understand your question regarding "${textToSend}". Our institutional grievance framework ensures all issues are resolved within 24-48 hours with cryptographic audit protection. Would you like to file a ticket for this?`;
            isActionable = true;
          }
        } catch (err) {
          botResponse = `Thank you for asking. Our digital grievance portal provides 24/7 AI-assisted triage, strict SLA deadline tracking, and dispute appeals. You can file a formal complaint or check active cases anytime.`;
          isActionable = true;
        }
      }

      const botMsg = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionable: isActionable,
        suggestedText: textToSend
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.success('Reading answer aloud 🔊');
    }
  };

  return (
    <>
      {/* Floating Trigger Avatar (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-2xl shadow-indigo-500/30 border border-white/20 cursor-pointer overflow-hidden group"
          title="AI Ombudsman Assistant"
        >
          {/* Pulsing ring indicator */}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" />

          <Bot size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-heading font-extrabold tracking-tight hidden sm:inline">
            AI Ombudsman
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-mono uppercase">
            Help
          </span>
        </motion.button>
      </div>

      {/* Interactive Chat Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-full max-w-sm sm:max-w-md bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left font-sans"
            style={{ maxHeight: 'calc(100vh - 120px)', height: '540px' }}
          >
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-heading font-black text-white">
                      AI Ombudsman Assistant
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Instant Policy & Redressal Answers
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                        : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Actionable Button if user described an issue */}
                    {msg.actionable && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/submit');
                          }}
                          className="px-3 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-400/30 text-[11px] font-bold text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles size={11} />
                          <span>File Complaint for This</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1 text-[9px] font-mono text-slate-500">
                    <span>{msg.time}</span>
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Read answer aloud"
                      >
                        <Volume2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
                  <Sparkles size={13} className="animate-spin text-indigo-400" />
                  <span>AI Ombudsman is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Questions Chips */}
            <div className="p-2.5 bg-slate-950/80 border-t border-white/5 space-y-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block px-1">
                Frequently Asked
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {KNOWLEDGE_BASE_FAQS.map((faq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(faq.q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-[10px] font-semibold text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    {faq.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-slate-950 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a question or explain an issue..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isTyping}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-md shadow-indigo-600/30"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiOmbudsmanWidget;
