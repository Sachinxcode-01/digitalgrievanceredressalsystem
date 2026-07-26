import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Volume2 } from 'lucide-react';
import { getAuthHeaders } from '../../services/grievanceService';

export const ResolveBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI Resolution Assistant. Describe your issue and I might be able to solve it right now without you needing to file a ticket!", isBot: true }
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

      // Insert placeholder message for streaming content
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
              } catch (err) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }

      // Finalize the streaming message state
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.isStreaming) {
          const updatedLast = { ...last };
          delete updatedLast.isStreaming;
          next[next.length - 1] = updatedLast;
        }
        return next;
      });

    } catch (error) {
      console.error("ResolveBot stream error:", error);
      setIsTyping(false);
      setMessages(prev => {
        const next = prev.filter(m => !(m.isStreaming && !m.text));
        return [...next, { text: "Connection to AI Core lost. Please submit a manual ticket.", isBot: true }];
      });
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg z-50 cursor-pointer overflow-hidden group border border-primary/20"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary opacity-90 group-hover:opacity-100 transition-opacity" />
            <MessageCircle className="text-white relative z-10" size={22} />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-[340px] h-[480px] z-50 glass-card flex flex-col overflow-hidden shadow-xl border border-border/60 bg-surface/95"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-background/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex flex-shrink-0 items-center justify-center border border-primary/20 relative">
                  <Bot size={18} className="text-primary" />
                  <div className="absolute top-0 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-surface shadow-[0_0_4px_#22c55e]" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading font-extrabold text-foreground text-xs leading-none">AI Assistant</h3>
                  <p className="text-[8px] text-primary uppercase tracking-widest font-black mt-1">ResolveBot v2.0</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors border border-transparent hover:border-border/30"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-background/30">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-2.5 text-left ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex flex-shrink-0 items-center justify-center border ${msg.isBot ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-muted border-border/50 text-muted-foreground'}`}>
                    {msg.isBot ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="relative group/msg max-w-[75%]">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.isBot ? 'bg-primary/5 border border-primary/10 text-foreground rounded-tl-sm' : 'bg-primary text-white border border-transparent rounded-tr-sm shadow-sm'}`}>
                      {msg.text}
                    </div>
                    {msg.isBot && (
                      <button 
                        onClick={() => speakText(msg.text)}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-background hover:bg-muted opacity-0 group-hover/msg:opacity-100 transition-opacity text-primary border border-border/50"
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
                  <div className="w-7 h-7 rounded-lg bg-primary/5 border border-primary/10 text-primary flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 flex gap-1 rounded-tl-sm items-center">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-background/50">
              <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-background border border-border/80 rounded-xl py-2.5 pl-3 pr-10 text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-1.5 p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
              <p className="text-center text-[8px] text-muted-foreground mt-2 tracking-wider uppercase">Official Redressal Assistant Node</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResolveBot;
