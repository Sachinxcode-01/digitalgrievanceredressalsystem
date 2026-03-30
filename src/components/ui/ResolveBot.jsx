import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Volume2 } from 'lucide-react';

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
      utterance.pitch = 0.9;
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { text: data.reply || "I couldn't process that.", isBot: true }]);
    } catch (error) {
       setMessages(prev => [...prev, { text: "Connection to AI Core lost. Please submit a manual ticket.", isBot: true }]);
    } finally {
      setIsTyping(false);
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] z-50 cursor-pointer overflow-hidden group"
          >
            {/* Glowing orb effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity" />
            <MessageCircle className="text-white relative z-10" size={24} />
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-primary animate-pulse" />
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
            className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-[350px] h-[500px] z-50 glass-card flex flex-col overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center border border-primary/30 relative">
                  <Bot size={20} className="text-primary" />
                  <div className="absolute top-0 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-background shadow-[0_0_5px_#22c55e]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-['Outfit']">Ralph Logic Model</h3>
                  <p className="text-[10px] text-primary uppercase tracking-wider font-bold">Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-background/50">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-3 ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center ${msg.isBot ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'}`}>
                    {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className="relative group/msg">
                    <div className={`p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-primary/10 border border-primary/20 text-slate-200 rounded-tl-sm' : 'bg-white/10 border border-white/10 text-white rounded-tr-sm'}`}>
                      {msg.text}
                    </div>
                    {msg.isBot && (
                      <button 
                        onClick={() => speakText(msg.text)}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-white/10 text-primary border border-white/5"
                        title="Read aloud"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-1 rounded-tl-sm items-center">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your issue..."
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-500"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-2 p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-center text-[9px] text-slate-500 mt-2 tracking-wide uppercase">AI can make mistakes. Verify important info.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResolveBot;
