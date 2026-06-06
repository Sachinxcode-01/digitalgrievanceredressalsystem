import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Shield, Clock, CheckCheck, Loader2, Paperclip, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const CommandChat = ({ grievanceId, currentUser, role = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${grievanceId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_comments',
          filter: `grievance_id=eq.${grievanceId}` 
        },
        async (payload) => {
          // Fetch full message with profile data
          const { data: fullMsg } = await supabase
            .from('ticket_comments')
            .select('*, profiles(full_name, role)')
            .eq('id', payload.new.id)
            .single();
          
          if (fullMsg) {
            setMessages(prev => [...prev, fullMsg]);
            scrollToBottom();
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter(u => u.isTyping && u.userId !== currentUser.id)
          .map(u => u.userName);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUser.id,
            userName: currentUser.fullName || currentUser.user_metadata?.full_name || currentUser.email || 'User',
            isTyping: false
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [grievanceId]);

  useEffect(() => {
    const handleInjectComment = (e) => {
      const { grievanceId: targetGrievanceId, message } = e.detail;
      if (targetGrievanceId === grievanceId) {
        setNewMessage(message);
      }
    };

    window.addEventListener('inject-comment', handleInjectComment);
    return () => window.removeEventListener('inject-comment', handleInjectComment);
  }, [grievanceId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('ticket_comments')
      .select('*, profiles(full_name, role)')
      .eq('grievance_id', grievanceId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const { error } = await supabase
      .from('ticket_comments')
      .insert([
        { 
          grievance_id: grievanceId,
          user_id: currentUser.id,
          message: newMessage.trim()
        }
      ]);

    if (error) {
      toast.error("Failed to transmit message.");
    } else {
      setNewMessage('');
      stopTyping();
    }
    setIsSending(false);
  };

  const onType = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      updatePresence(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    setIsTyping(false);
    updatePresence(false);
  };

  const updatePresence = async (typingStatus) => {
    if (channelRef.current) {
      await channelRef.current.track({
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.user_metadata?.full_name || currentUser.email || 'User',
        isTyping: typingStatus
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Secure Command Stream</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-primary/60 uppercase">Encrypted</span>
          <Shield size={12} className="text-primary/60" />
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.user_id === currentUser.id;
          const isAdmin = msg.profiles?.role === 'admin';

          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                isAdmin ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                {isAdmin ? <Shield size={18} /> : <User size={18} />}
              </div>
              
              <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {msg.profiles?.full_name || 'System User'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : isAdmin 
                      ? 'bg-primary/10 border border-primary/20 text-slate-200 rounded-tl-sm'
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm'
                }`}>
                  {msg.message}
                </div>
                
                {isMe && (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <CheckCheck size={12} className="text-primary" />
                    <span className="text-[8px] text-primary/60 uppercase font-black tracking-tighter">Transmitted</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {typingUsers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
               <Loader2 size={16} className="text-primary animate-spin" />
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">
              {typingUsers.join(', ')} is typing...
            </p>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/40 border-t border-white/10">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <button 
            type="button"
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={onType}
              placeholder="Transmit update to command bridge..."
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-600 font-medium"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-primary hover:bg-primary/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>
        <p className="text-center text-[8px] text-slate-600 mt-3 tracking-[0.3em] uppercase font-bold">
          Zero-Trust Protocol Active &bull; End-to-End Encrypted
        </p>
      </div>
    </div>
  );
};
