import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User, Shield, CheckCheck, Loader2, Paperclip, 
  Copy, Check, MessageSquare, Sparkles, ChevronDown 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const QUICK_TEMPLATES = [
  "We have logged this update and assigned a field technician to investigate.",
  "Please provide additional photo evidence or location reference to proceed.",
  "Investigation in progress. Expected resolution time is within standard SLA.",
  "Escalated to the Departmental Ombudsman for expedited executive sign-off."
];

export const CommandChat = ({ grievanceId, currentUser, role = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        users (
          role,
          user_profiles (full_name)
        )
      `)
      .eq('grievance_id', grievanceId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const formatted = data.map(comment => ({
        ...comment,
        profiles: {
          full_name: comment.users?.user_profiles?.full_name || 'System User',
          role: comment.users?.role || 'student'
        }
      }));
      setMessages(formatted);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchMessages();
    }, 0);
    
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
          const { data: fullMsg } = await supabase
            .from('ticket_comments')
            .select(`
              *,
              users (
                role,
                user_profiles (full_name)
              )
            `)
            .eq('id', payload.new.id)
            .limit(1)
            .maybeSingle();
          
          if (fullMsg) {
            const formatted = {
              ...fullMsg,
              profiles: {
                full_name: fullMsg.users?.user_profiles?.full_name || 'System User',
                role: fullMsg.users?.role || 'student'
              }
            };
            setMessages(prev => [...prev, formatted]);
            scrollToBottom();
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const currentUserId = currentUser?.id;
        const typing = Object.values(state)
          .flat()
          .filter(u => u.isTyping && u.userId !== currentUserId)
          .map(u => u.userName);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser?.id) {
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
  }, [grievanceId, currentUser?.id]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    if (!currentUser?.id) {
      toast.error("Please sign in to send messages.");
      return;
    }

    setIsSending(true);
    const { error } = await supabase
      .from('ticket_comments')
      .insert([
        { 
          grievance_id: grievanceId,
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_internal: (role === 'admin' || role === 'officer' || role === 'super admin') ? isInternal : false
        }
      ]);

    if (error) {
      toast.error("Failed to transmit message.");
    } else {
      setNewMessage('');
      setIsInternal(false);
      setShowTemplates(false);
      stopTyping();
    }
    setIsSending(false);
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Message copied to clipboard", { duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
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
    if (channelRef.current && currentUser?.id) {
      await channelRef.current.track({
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.user_metadata?.full_name || currentUser.email || 'User',
        isTyping: typingStatus
      });
    }
  };

  const isStaff = role === 'admin' || role === 'officer' || role === 'super admin';

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
      {/* Chat Header */}
      <div className="p-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Secure Command Stream</h4>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle Quick Response Templates"
            >
              <Sparkles size={11} />
              <span>Templates</span>
              <ChevronDown size={10} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </button>
          )}
          <span className="text-[10px] font-mono text-indigo-400/80 uppercase">Encrypted</span>
          <Shield size={12} className="text-indigo-400/80" />
        </div>
      </div>

      {/* Canned Templates Drawer for Staff */}
      <AnimatePresence>
        {showTemplates && isStaff && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-950/90 border-b border-indigo-500/20 p-2.5 space-y-1.5"
          >
            <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
              1-Click Response Templates:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNewMessage(tmpl);
                    setShowTemplates(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/60 border border-white/10 hover:border-indigo-400/40 text-left text-[11px] text-slate-300 hover:text-white transition-all line-clamp-1"
                >
                  &bull; {tmpl}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare size={32} className="mb-2 opacity-30 text-indigo-400" />
            <p className="text-xs font-mono font-bold uppercase tracking-wider">No transmission logged yet</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Transmissions sent here are synchronized directly across the security command node in real-time.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            const msgIsAdmin = msg.profiles?.role === 'admin' || msg.profiles?.role === 'officer' || msg.profiles?.role === 'super admin';

            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id}
                className={`flex gap-3 group/bubble ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                  msgIsAdmin ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  {msgIsAdmin ? <Shield size={16} /> : <User size={16} />}
                </div>
                
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {msg.profiles?.full_name || 'System User'}
                    </span>
                    {msg.is_internal && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                        Internal Note
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-500">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="relative group/msg inline-block text-left">
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe 
                        ? msg.is_internal
                          ? 'bg-amber-600/80 border border-amber-500/40 text-white rounded-tr-xs'
                          : 'bg-indigo-600 border border-indigo-400/30 text-white rounded-tr-xs' 
                        : msg.is_internal
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-200 rounded-tl-xs'
                          : msgIsAdmin 
                            ? 'bg-indigo-950/40 border border-indigo-500/25 text-slate-200 rounded-tl-xs'
                            : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-xs'
                    }`}>
                      {msg.message}
                    </div>

                    <button
                      onClick={() => handleCopyMessage(msg.message, msg.id)}
                      className={`absolute top-2 p-1 rounded bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white opacity-0 group-hover/msg:opacity-100 transition-opacity ${isMe ? '-left-6' : '-right-6'}`}
                      title="Copy text"
                    >
                      {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    </button>
                  </div>
                  
                  {isMe && (
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <CheckCheck size={12} className="text-indigo-400" />
                      <span className="text-[8px] text-indigo-400/70 uppercase font-black tracking-tighter">Transmitted</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
               <Loader2 size={14} className="text-indigo-400 animate-spin" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest animate-pulse">
              {typingUsers.join(', ')} is typing...
            </p>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-black/40 border-t border-white/10">
        {isStaff && (
          <div className="flex items-center gap-2 mb-2 px-1 text-left">
            <input
              type="checkbox"
              id="isInternalNote"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-white/10 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="isInternalNote" className="text-[10px] text-amber-400 font-bold uppercase tracking-wider cursor-pointer select-none flex items-center gap-1 font-mono">
              <Shield size={10} /> Internal Officer Note (Hidden from Citizen)
            </label>
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <button 
            type="button"
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={onType}
              placeholder={isInternal ? "Write internal officer intelligence note..." : "Transmit update to command bridge..."}
              className="w-full bg-slate-900/90 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Send message"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
        <p className="text-center text-[8px] text-slate-500 mt-2 tracking-[0.25em] uppercase font-mono">
          Zero-Trust Cryptographic Stream Active &bull; End-to-End Encrypted
        </p>
      </div>
    </div>
  );
};

export default CommandChat;
