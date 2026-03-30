import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { RainbowButton } from '../components/ui/RainbowButton';
import { Plus, Clock, CheckCircle2, AlertCircle, Filter, X, Send, Ticket, Sparkles, Loader2, MailCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { grievanceService } from '../api/grievanceService';
import StatusBadge from '../components/ui/StatusBadge';
import UrgencyBadge from '../components/ui/UrgencyBadge';
import TimelineStep from '../components/ui/TimelineStep';

export const UserDashboard = ({ sessionUser, userProfile }) => {
  const [showModal, setShowModal] = useState(false);
  const searchParams = new URL(window.location.href).searchParams;

  useEffect(() => {
    if (searchParams.get('tab') === 'grievances') {
      const el = document.getElementById('grievances-table');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [window.location.search]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New grievance states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [urgency, setUrgency] = useState('Medium');
  const [frustrationIndex, setFrustrationIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Comments logic
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  // AI Assist logic
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAiAnalyze = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description first so the AI can analyze it!");
      return;
    }
    setIsAnalyzing(true);
    
    try {
      const data = await grievanceService.analyze(description);
      setCategory(data.category);
      setUrgency(data.urgency);
      setFrustrationIndex(data.frustration_index || 1);
      
      // Handle Multilingual Translation if returned
      if (data.english_translation && data.english_translation.trim() !== "") {
        setDescription((prev) => `${prev}\n\n--- English Translation (AI) ---\n${data.english_translation}`);
      }

      // Auto-generate title if blank
      if (!title) {
        let snippet = description.split(' ').slice(0, 4).join(' ');
        setTitle(`${snippet}... Request`);
      }
      
      toast.success("AI auto-filled details and translated if necessary!");
    } catch {
      toast.error("Failed to reach AI backend. Using fallback.");
      // Fallback
      setCategory('IT Support');
      setUrgency('Medium');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large. Max 5MB.");
        return;
      }
      setAttachment(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
    const filePath = `user_${sessionUser.id}/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      toast.error(`File upload failed: ${err.message}`);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('user-grievances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
            
            // If the selected ticket was updated, update it in the view too
            setSelectedTicket((currentSelected) => {
              if (currentSelected && currentSelected.id === payload.new.id) {
                return payload.new;
              }
              return currentSelected;
            });
          } else if (payload.eventType === 'DELETE') {
            setTickets((prev) => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const commentChannel = supabase
      .channel('ticket-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_comments' },
        (payload) => {
          if (selectedTicket && payload.new.grievance_id === selectedTicket.id) {
             fetchComments(selectedTicket.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(commentChannel);
    };
  }, [selectedTicket]);

  const fetchComments = async (ticketId) => {
    const { data } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        profiles (full_name, role)
      `)
      .eq('grievance_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    
    setIsSendingComment(true);
    
    const { error } = await supabase
      .from('ticket_comments')
      .insert([
        { 
          grievance_id: selectedTicket.id,
          user_id: sessionUser.id,
          message: newComment
        }
      ]);

    if (!error) {
      setNewComment('');
      fetchComments(selectedTicket.id);
    }
    setIsSendingComment(false);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // For demo users, fall back to getAll since their IDs aren't in DB
      const isDemoUser = sessionUser?.id?.startsWith('demo-');
      const data = isDemoUser 
        ? await grievanceService.getAll()
        : await grievanceService.getByUser(sessionUser.id);
      setTickets(data);
    } catch {
      toast.error('Could not load tickets');
    } finally {
      setLoading(false);
    }
  };

  // derived activity feed
  const activityFeed = [
    ...tickets.map(t => ({ 
      id: t.id, 
      type: 'TICKET', 
      title: 'New Grievance', 
      desc: t.title, 
      date: new Date(t.created_at),
      status: t.status 
    })),
    ...comments.map(c => ({ 
      id: c.id, 
      type: 'COMMENT', 
      title: c.profiles?.role === 'admin' ? 'Admin Response' : 'New Comment', 
      desc: c.message, 
      date: new Date(c.created_at) 
    }))
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  const handleCreateGrievance = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      let fileUrl = null;
      if (attachment) {
        fileUrl = await uploadFile(attachment);
      }

      await grievanceService.create({ 
        ticket_id: ticketId,
        user_id: sessionUser.id,
        email: sessionUser.email || sessionUser.user_metadata?.email,
        title, 
        description, 
        category, 
        urgency,
        frustration_index: frustrationIndex,
        attachment_url: fileUrl
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchTickets();
      toast.success('Your grievance has been submitted successfully.');
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: 'Grievance Transmitted',
          message: `Ticket ${ticketId} has been securely logged. Status: Pending.`,
          type: 'success'
        }
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Tickets', value: tickets.length, icon: <Filter size={20} />, color: 'bg-primary' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'In-Progress').length, icon: <Clock size={20} />, color: 'bg-warning' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length, icon: <CheckCircle2 size={20} />, color: 'bg-success' },
  ];

  const notificationsEnabled = userProfile?.notifications_enabled !== false;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-['Outfit']">Dashboard Overview</h2>
          <p className="text-slate-400">Manage and track your reported grievances.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)} 
          className="btn-premium"
        >
          <Plus size={20} />
          Report New Grievance
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-8 flex items-center justify-between"
          >
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h3 className="text-4xl font-black text-white">{stat.value}</h3>
            </div>
            <div className={`p-5 rounded-[24px] bg-white/[0.03] border border-white/[0.05] ${stat.color.replace('bg-', 'text-')} shadow-inner`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {!notificationsEnabled && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-1 rounded-2xl bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 animate-rainbow-anim bg-[length:200%_auto]"
        >
          <div className="bg-slate-900 rounded-[15px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <MailCheck size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Enable Email Notifications</h4>
                <p className="text-slate-400 text-sm">Don't miss out! Get instant updates on your grievance resolution status.</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                if (sessionUser?.id?.startsWith('demo-')) {
                   toast.success('Email notifications enabled! (Demo)');
                   return;
                }
                const { error } = await supabase.from('profiles').update({ notifications_enabled: true }).eq('id', sessionUser.id);
                if (!error) {
                  toast.success('Email notifications enabled!');
                  window.location.reload(); // Refresh to update state, or use a prop-based refresh
                }
              }}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              Enable Now
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card overflow-hidden" id="grievances-table">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg">My Grievances</h3>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center text-slate-500">Loading your tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-20 text-center text-slate-500">No grievances found. Create one to get started.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-semibold">Ticket ID</th>
                      <th className="px-6 py-4 font-semibold">Subject</th>
                      <th className="px-6 py-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.map((ticket, idx) => (
                      <tr key={idx} onClick={() => handleSelectTicket(ticket)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                        <td className="px-6 py-5 font-mono text-xs text-primary font-bold">{ticket.ticket_id}</td>
                        <td className="px-6 py-5 font-medium text-slate-200">{ticket.title}</td>
                        <td className="px-6 py-5 text-right">
                          <StatusBadge status={ticket.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-secondary" />
              Recent Activity
            </h3>
            <div className="space-y-6">
              {activityFeed.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No recent activity.</p>
              ) : (
                activityFeed.map((item, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== activityFeed.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-white/5" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      item.type === 'TICKET' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                    }`}>
                      {item.type === 'TICKET' ? <Ticket size={12} /> : <CheckCircle2 size={12} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.desc}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatDistanceToNow(item.date, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <h4 className="text-sm font-bold text-white mb-2">Need faster resolution?</h4>
            <p className="text-xs text-slate-400 mb-4">Our AI assistant can help triage your grievance to the right department immediately.</p>
            <RainbowButton onClick={() => setShowModal(true)} className="w-full !py-2.5 !rounded-xl !bg-primary/20 hover:!bg-primary/40 border border-primary/30 text-[10px]">
              <Plus size={14} /> Quick Submit Grievance
            </RainbowButton>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card w-full max-w-xl p-8 relative">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 font-['Outfit']">
                <div className="p-2 bg-primary/20 rounded-lg text-primary"><Ticket size={24} /></div>
                New Grievance
              </h2>
              <form className="space-y-6" onSubmit={handleCreateGrievance}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input w-full bg-[#1a1f2e] border-white/10">
                      <option>IT Support</option>
                      <option>Maintenance</option>
                      <option>Academic</option>
                      <option>Financial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Urgency</label>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="glass-input w-full bg-[#1a1f2e] border-white/10">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Subject</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className="glass-input w-full" required />
                </div>
                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Detailed Description</label>
                    <button 
                      type="button" 
                      onClick={handleAiAnalyze}
                      disabled={isAnalyzing}
                      className="btn-primary !py-1.5 !px-3 !text-[10px] !rounded-full shadow-lg transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {isAnalyzing ? 'AI Analyzing...' : 'AI Auto-Fill'}
                    </button>
                  </div>
                  <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your problem... (Click AI Auto-Fill to automatically set category and urgency!)" className="glass-input w-full resize-none py-3" required></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Supporting Documents (Max 5MB)</label>
                  <div className="relative group overflow-hidden rounded-xl border border-white/10 hover:border-primary/50 transition-all bg-white/5 p-4 flex items-center justify-between cursor-pointer">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                    <div className="flex items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
                      <Plus size={20} />
                      <span className="text-sm font-medium">{attachment ? attachment.name : 'Click to add an image or PDF'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                  <RainbowButton disabled={isSubmitting} type="submit" className="flex-1 !bg-primary/90 hover:!bg-primary">
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    <Send size={18} />
                  </RainbowButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-2xl overflow-hidden relative">
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
              >
                <X size={24} />
              </button>
              <div className="p-8 border-b border-white/10 flex justify-between items-start pt-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold font-['Outfit'] text-white">{selectedTicket.ticket_id}</h2>
                    <StatusBadge status={selectedTicket.status} />
                    <UrgencyBadge level={selectedTicket.urgency} />
                  </div>
                  <p className="text-slate-400 text-lg">{selectedTicket.title}</p>
                </div>
              </div>

              <div className="p-8 space-y-6 text-left max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Category</h4>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg text-sm text-slate-300 font-medium border border-white/10">{selectedTicket.category}</span>
                </div>
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Description</h4>
                  <p className="text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">{selectedTicket.description}</p>
                </div>

                {selectedTicket.attachment_url && (
                  <div className="pt-2">
                    <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2 text-primary">Supporting Evidence</h4>
                    <a 
                      href={selectedTicket.attachment_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group w-fit text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      <Plus size={14} className="rotate-45" /> View Uploaded Document
                    </a>
                  </div>
                )}

                {/* Tracking Progress Timeline */}
                <div className="py-6">
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-4">Resolution Timeline</h4>
                  <div className="space-y-0 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/5" />
                    
                    <TimelineStep 
                      done={true} 
                      label="Reported" 
                      date={new Date(selectedTicket.created_at).toLocaleDateString()}
                      desc="Grievance successfully logged into the system."
                    />
                    <TimelineStep 
                      done={selectedTicket.status !== 'Pending'} 
                      active={selectedTicket.status === 'In-Progress'}
                      label="In-Progress" 
                      desc="An administrator is currently reviewing your request."
                    />
                    <TimelineStep 
                      done={selectedTicket.status === 'Resolved'} 
                      active={selectedTicket.status === 'Resolved'}
                      label="Resolved" 
                      desc="The issue has been addressed and the ticket is closed."
                    />
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Ticket size={16} className="text-primary" />
                    Ticket Updates & Responses
                  </h4>
                  
                  <div className="space-y-4 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">No updates or comments yet.</p>
                    ) : (
                      comments.map((comment, i) => (
                        <div key={i} className={`p-4 rounded-xl text-sm ${comment.profiles?.role === 'admin' ? 'bg-primary/10 border border-primary/20 ml-8' : 'bg-white/5 border border-white/10 mr-8'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${comment.profiles?.role === 'admin' ? 'text-primary' : 'text-slate-300'}`}>
                              {comment.profiles?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-200">{comment.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendComment} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message or update..." 
                      className="glass-input flex-1 text-sm py-2 px-4"
                      required
                    />
                    <button type="submit" disabled={isSendingComment} className="btn-primary px-3 py-2 !rounded-xl">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Shared UI components imported from src/components/ui/

