import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Volume2, Sparkles } from 'lucide-react';
import { getAuthHeaders } from '../../services/grievanceService';

export const ResolveBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI Resolution Assistant. Describe your grievance and I can help evaluate urgency or assist in quick resolution!", isBot: true }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const speakText = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInputMessage('');
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
        body: JSON.stringify({ message: userText })
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
                // Ignore chunk split errors
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

      // Attempt fallback to non-streaming POST /chat
      try {
        const headers = await getAuthHeaders();
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText })
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
            className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-87.5 h-125 z-50 rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/80 text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center relative">
                  <Bot size={18} className="text-indigo-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-white text-xs leading-none">ResolveBot AI</h3>
                  <p className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest font-bold mt-1">Grievance Assistant Node</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-slate-950/40">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-2.5 text-left ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex shrink-0 items-center justify-center border ${msg.isBot ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800 border-white/10 text-slate-300'}`}>
                    {msg.isBot ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="relative group/msg max-w-[78%]">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.isBot ? 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-sm' : 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white font-medium rounded-tr-sm shadow-md'}`}>
                      {msg.text}
                    </div>
                    {msg.isBot && msg.text && (
                      <button 
                        onClick={() => speakText(msg.text)}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-900 hover:bg-slate-800 opacity-0 group-hover/msg:opacity-100 transition-opacity text-indigo-400 border border-white/10"
                        title="Read aloud"
                      >
                        <Volume2 size={10} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 flex gap-1.5 rounded-tl-sm items-center">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/10 bg-slate-900/80">
              <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-1.5 p-1.5 rounded-lg text-indigo-400 hover:text-white disabled:opacity-30"
                >
                  <Send size={14} />
                </button>
              </form>
              <p className="text-center text-[8px] font-mono text-slate-500 mt-2 uppercase tracking-widest">
                ResolveNow AI Neural Chat
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResolveBot;
