import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Plus, Clock, CheckCircle2, AlertCircle, X, Send, Ticket, 
  Sparkles, Loader2, MailCheck, ArrowRight, TrendingUp, Mic, MicOff, 
  MessageSquare, FileDown, ShieldCheck, MapPin, Search, Calendar, Bell, ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import TimelineStep from '../../components/ui/TimelineStep';
import { logSecurityEvent } from '../../lib/auditLogger';
import { APIProvider } from '@vis.gl/react-google-maps';
import { PlacePicker } from '@googlemaps/extended-component-library/react';
import { CommandChat } from '../../components/ai/CommandChat';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { staggerContainer } from '../../lib/motion';

const SLACountdown = ({ ticket }) => {
  const isTerminal = !ticket || ticket.status === 'Resolved' || ticket.status === 'Closed' || ticket.status === 'Rejected';

  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (isTerminal) {
      return;
    }

    const calculateTime = () => {
      const dueAt = ticket.sla_due_at ? new Date(ticket.sla_due_at) : null;
      if (!dueAt) {
        const urgency = ticket.urgency || 'Medium';
        const hours = urgency === 'High' ? 24 : urgency === 'Medium' ? 72 : 120;
        const created = new Date(ticket.created_at);
        const deadline = new Date(created.getTime() + hours * 60 * 60 * 1000);
        return deadline - new Date();
      }
      return dueAt - new Date();
    };

    const updateClock = () => {
      const diff = calculateTime();
      if (diff <= 0) {
        setTimeLeft('SLA Overdue');
        setIsBreached(true);
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hrs}h ${mins}m ${secs}s remaining`);
        setIsBreached(false);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.status, isTerminal]);

  const displayTime = isTerminal ? (ticket?.status || 'Closed') : timeLeft;
  const displayBreached = isTerminal ? false : isBreached;

  return (
    <span className={`px-2 py-0.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider ${
      displayBreached 
        ? 'text-error border-error/20 bg-error/5 animate-pulse' 
        : 'text-success border-success/20 bg-success/5'
    }`}>
      {displayTime}
    </span>
  );
};

export const UserDashboard = ({ sessionUser, userProfile }) => {
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const getProfileCompletion = () => {
    let fields = [
      sessionUser?.fullName || userProfile?.fullName,
      sessionUser?.email || userProfile?.email,
      userProfile?.mobile_number || sessionUser?.mobile_number,
      userProfile?.department || sessionUser?.department,
      userProfile?.institution || sessionUser?.institution,
      userProfile?.profile_picture || sessionUser?.profile_picture
    ];
    let filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  async function fetchNotifications() {
    try {
      const isDemoUser = sessionUser?.id?.startsWith('demo-');
      if (isDemoUser) return;
      const res = await apiClient.get('/user/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to retrieve unread alerts:', err.message);
    }
  }

  const { connectionState, isSystemHealthy } = useRealtimeConnection(() => {
    fetchTickets();
    fetchNotifications();
  });

  // Check URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setShowModal(true);
    }
    const tabParam = params.get('tab');
    if (tabParam === 'grievances') {
      setStatusFilter('All');
    }
  }, [window.location.search]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // New grievance states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [urgency, setUrgency] = useState('Medium');
  const [frustrationIndex, setFrustrationIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Location states
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [showMap, setShowMap] = useState(false);
  
  // Comments logic
  const [comments, setComments] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
      toast.success("Voice input captured!");
    };

    recognition.start();
  };

  const handleExportDossier = async () => {
    if (!selectedTicket) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFillColor(37, 99, 235); // Clean blue
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("GRIEVANCE DOSSIER", 20, 25);
      doc.setFontSize(10);
      doc.text(`TICKET: #${selectedTicket.ticket_id}`, 150, 25);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("Grievance Parameters", 20, 55);
      doc.line(20, 58, 190, 58);
      
      doc.setFontSize(10);
      doc.text(`Subject: ${selectedTicket.title}`, 20, 68);
      doc.text(`Category: ${selectedTicket.category}`, 20, 76);
      doc.text(`Urgency: ${selectedTicket.urgency}`, 20, 84);
      doc.text(`Status: ${selectedTicket.status}`, 140, 84);
      doc.text(`Filing Date: ${new Date(selectedTicket.created_at).toLocaleString()}`, 20, 92);
      
      doc.setFontSize(12);
      doc.text("Narrative Statement", 20, 110);
      doc.line(20, 113, 190, 113);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(selectedTicket.description, 170);
      doc.text(splitDesc, 20, 123);
      
      doc.setFillColor(248, 250, 252);
      const yOffset = 130 + (splitDesc.length * 5);
      doc.rect(20, yOffset, 170, 25, 'F');
      doc.setTextColor(37, 99, 235);
      doc.text(`Frustration Severity: ${selectedTicket.frustration_index || 1}/10`, 25, yOffset + 10);
      doc.text(`Resolution Target: ${selectedTicket.urgency === 'High' ? '24 hours' : '72 hours'}`, 25, yOffset + 18);
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("This document is a formal record generated via the ResolveNow v2.0 portal.", 105, 290, null, null, "center");
      
      doc.save(`Dossier_${selectedTicket.ticket_id}.pdf`);
      toast.success("Dossier PDF exported.");
      logSecurityEvent('Grievance Dossier Exported', sessionUser.email, 'User Dashboard', 'info');
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const getSLAStatus = (ticket) => {
    if (!ticket || ticket.status === 'Resolved') return null;
    const urgency = ticket.urgency || 'Medium';
    const hours = urgency === 'High' ? 24 : urgency === 'Medium' ? 72 : 120;
    const created = new Date(ticket.created_at);
    const deadline = new Date(created.getTime() + hours * 60 * 60 * 1000);
    const remaining = deadline - new Date();
    
    if (remaining < 0) return { label: 'SLA OVERDUE', color: 'text-error border-error/10 bg-error/5' };
    const remHours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
    return { label: `SLA: ${remHours}h remaining`, color: 'text-success border-success/10 bg-success/5' };
  };

  const handleAiAnalyze = async () => {
    if (!description.trim()) {
      toast.error("Please enter description content first.");
      return;
    }
    setIsAnalyzing(true);
    
    try {
      const data = await grievanceService.analyze(description);
      setCategory(data.category);
      setUrgency(data.urgency);
      setFrustrationIndex(data.frustration_index || 1);
      
      if (data.english_translation?.trim()) {
        setDescription(prev => `${prev}\n\n[Translation]: ${data.english_translation}`);
      }

      if (!title) {
        let snippet = description.split(' ').slice(0, 4).join(' ');
        setTitle(`${snippet}... Request`);
      }
      
      logSecurityEvent('AI Triage Assistant Used', sessionUser.email, 'User Dashboard', 'info');
      toast.success("AI Triage analyzed successfully.");
    } catch {
      toast.error("AI backend offline. Fallback categories applied.");
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
        toast.error("File size exceeds 5MB limit.");
        return;
      }
      setAttachment(file);
      toast.success(`Attached: ${file.name}`);
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

  async function fetchTickets() {
    setLoading(true);
    try {
      const isDemoUser = sessionUser?.id?.startsWith('demo-');
      const data = isDemoUser 
        ? await grievanceService.getAll()
        : await grievanceService.getByUser(sessionUser.id);
      setTickets(data || []);
    } catch {
      toast.error('Could not retrieve tickets registry.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
    fetchNotifications();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(sessionUser?.id);

    const channel = supabase
      .channel('user-grievances')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'grievances',
          ...(isUuid ? { filter: `user_id=eq.${sessionUser.id}` } : {})
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => {
              const oldTicket = prev.find(t => t.id === payload.new.id);
              if (oldTicket && oldTicket.status !== payload.new.status) {
                 toast.success(`Ticket ${payload.new.ticket_id} updated: ${payload.new.status}`);
              }
              return prev.map(t => t.id === payload.new.id ? payload.new : t);
            });
            setSelectedTicket((curr) => curr && curr.id === payload.new.id ? payload.new : curr);
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
          setSelectedTicket(curr => {
             if (curr && payload.new.grievance_id === curr.id) {
               fetchComments(curr.id);
             }
             return curr;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(commentChannel);
    };
  }, [sessionUser?.id]);

  const fetchComments = async (ticketId) => {
    const { data } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        users (
          role,
          user_profiles (full_name)
        )
      `)
      .eq('grievance_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const formatted = data.map(comment => ({
        ...comment,
        profiles: {
          full_name: comment.users?.user_profiles?.full_name || 'System User',
          role: comment.users?.role || 'student'
        }
      }));
      setComments(formatted);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setFeedbackRating(0);
    setFeedbackComments('');
    fetchComments(ticket.id);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedTicket || feedbackRating === 0) return;
    setIsSubmittingFeedback(true);
    try {
      await apiClient.post(`/grievances/${selectedTicket.id}/feedback`, {
        rating: feedbackRating,
        feedback_comments: feedbackComments
      });
      toast.success('Thank you! Your feedback has been registered and the ticket is now closed.');
      setFeedbackRating(0);
      setFeedbackComments('');
      fetchTickets();
      setSelectedTicket(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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
        user_id: sessionUser.id?.startsWith('demo-') ? null : sessionUser.id,
        email: sessionUser.email || sessionUser.user_metadata?.email,
        title, 
        description, 
        category, 
        urgency,
        frustration_index: frustrationIndex,
        attachment_url: fileUrl,
        location: locationName,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      });
      
      logSecurityEvent('New Grievance Transmitted', sessionUser.email || 'user', 'User Node', 'warning');

      setShowModal(false);
      setTitle('');
      setDescription('');
      setAttachment(null);
      setLocationName('');
      setCoordinates({ lat: null, lng: null });
      fetchTickets();
      toast.success('Your grievance has been submitted successfully.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats KPIs
  const totalGrievances = tickets.length;
  const pendingGrievances = tickets.filter(t => t.status === 'Pending' || t.status === 'New' || t.status === 'Assigned').length;
  const progressGrievances = tickets.filter(t => t.status === 'In-Progress').length;
  const resolvedGrievances = tickets.filter(t => t.status === 'Resolved').length;
  const closedGrievances = tickets.filter(t => t.status === 'Closed').length;
  const rejectedGrievances = tickets.filter(t => t.status === 'Rejected').length;

  const stats = [
    { label: 'Total', value: totalGrievances, icon: Ticket, tone: 'primary' },
    { label: 'Open', value: pendingGrievances, icon: Clock, tone: 'accent' },
    { label: 'In Progress', value: progressGrievances, icon: TrendingUp, tone: 'warning' },
    { label: 'Resolved', value: resolvedGrievances, icon: CheckCircle2, tone: 'success' },
    { label: 'Closed', value: closedGrievances, icon: ShieldCheck, tone: 'neutral' },
    { label: 'Rejected', value: rejectedGrievances, icon: X, tone: 'error' },
  ];

  // Filters & Search logic
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const notificationsEnabled = userProfile?.notifications_enabled !== false;

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-12">
      {/* Connectivity Alert */}
      {!isSystemHealthy && (
        <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-error font-medium">
          <AlertCircle size={16} />
          <span>Database connection degraded. Live sync updates paused.</span>
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-surface border border-border/80 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative">
        <div className="space-y-1 flex-1">
          <h1 className="text-xl font-heading font-black text-foreground">
            Welcome back, {sessionUser?.fullName || 'User'}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Here is a summary of your grievance submissions. You have <span className="font-bold text-primary-bright">{pendingGrievances} pending</span> issues awaiting administrative triage.
          </p>
          <div className="mt-4 pt-3 border-t border-border/40 w-full max-w-md">
            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
              <span>Profile Completion</span>
              <span className="text-primary-bright">{getProfileCompletion()}%</span>
            </div>
            <div className="h-1.5 w-full bg-background border border-border rounded-full overflow-hidden">
              <div className="h-full bg-primary-bright transition-all duration-500" style={{ width: `${getProfileCompletion()}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-background border border-border hover:border-primary-bright/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer relative"
              type="button"
            >
              <Bell size={16} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 space-y-3 text-left"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">In-App Notifications</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic text-center py-4">No unread notifications.</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={async () => {
                              try {
                                await apiClient.put(`/user/notifications/${notif.id}/read`);
                                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${notif.is_read ? 'bg-background/20 border-border/40 opacity-60' : 'bg-primary-bright/[0.02] border-primary-bright/10 hover:bg-primary-bright/[0.04]'}`}
                          >
                            <p className="text-[10px] font-bold text-foreground leading-snug">{notif.title}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
                            <span className="text-[8px] text-muted-foreground/60 font-mono mt-1 block">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-premium flex items-center gap-2 h-10 px-4"
          >
            <Plus size={14} />
            <span>New Grievance</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </motion.div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Recent Grievances table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border/80 rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Grievance Registry
              </h2>
              
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative bg-background border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-2 w-full sm:w-44">
                  <Search size={14} className="text-muted-foreground/60" />
                  <input 
                    type="text" 
                    placeholder="Search ID/title..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
                  />
                </div>

                {/* Filter */}
                <select 
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In-Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-background text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                    <th className="px-6 py-3.5">Ticket ID</th>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        <td className="px-6 py-4"><div className="skeleton h-3 w-20" /></td>
                        <td className="px-6 py-4"><div className="skeleton h-3 w-40" /></td>
                        <td className="px-6 py-4"><div className="skeleton h-3 w-24" /></td>
                        <td className="px-6 py-4"><div className="skeleton h-5 w-16 rounded-full" /></td>
                        <td className="px-6 py-4"><div className="skeleton h-3 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : currentTickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-0">
                        <EmptyState
                          icon={Ticket}
                          title={searchTerm || statusFilter !== 'All' ? 'No matching grievances' : 'No grievances yet'}
                          message={
                            searchTerm || statusFilter !== 'All'
                              ? 'No submissions match your current search or filter. Try clearing them to see everything.'
                              : 'When you file a grievance it will appear here with live status tracking and SLA countdowns.'
                          }
                          action={
                            <button onClick={() => setShowModal(true)} className="btn-premium px-4 py-2">
                              <Plus size={14} /> File a grievance
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    currentTickets.map((ticket) => (
                      <tr 
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`hover:bg-muted/40 transition-colors cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-primary-bright/[0.02]' : ''}`}
                      >
                        <td className="px-6 py-3.5 font-mono font-bold text-primary-bright">
                          {ticket.ticket_id}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-foreground truncate max-w-[200px]">
                          {ticket.title}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-3.5 text-right text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border/60 bg-background/50 flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick Actions & Notifications */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <button 
                onClick={() => setShowModal(true)}
                className="p-3 border border-border hover:border-primary-bright/20 hover:bg-primary-bright/[0.02] rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer"
              >
                New Grievance
              </button>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
                className="p-3 border border-border hover:border-warning/20 hover:bg-warning/[0.02] rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer"
              >
                Track Status
              </button>
              <button 
                onClick={() => setStatusFilter('Resolved')}
                className="p-3 border border-border hover:border-success/20 hover:bg-success/[0.02] rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer"
              >
                View History
              </button>
              <a 
                href="/profile"
                className="p-3 border border-border hover:border-primary-bright/20 hover:bg-primary-bright/[0.02] rounded-lg text-xs font-semibold text-foreground transition-all cursor-pointer block"
              >
                My Profile
              </a>
            </div>
          </div>

          {/* Recent Notifications Banner */}
          {!notificationsEnabled && (
            <div className="bg-primary-bright/[0.03] border border-primary-bright/10 rounded-xl p-4 space-y-3">
              <div className="flex gap-2">
                <Bell size={16} className="text-primary-bright shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">Alert notifications disabled</h4>
                  <p className="text-[10px] text-muted-foreground">Receive instant alerts regarding ticket updates.</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (sessionUser?.id?.startsWith('demo-')) {
                     toast.success('Alerts enabled! (Simulation)');
                     return;
                  }
                  try {
                    await apiClient.put('/user/profile', {
                      notificationPreferences: { email: true, sms: true }
                    });
                    toast.success('Alert system initialized!');
                    window.location.reload();
                  } catch (err) {
                    toast.error('Failed to initialize alerts: ' + err.message);
                  }
                }}
                className="w-full btn-premium py-2"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Simple Notifications List */}
          <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar size={14} />
              Recent Updates
            </h3>
            
            <div className="space-y-4 divide-y divide-border/30">
              {tickets.slice(0, 3).map((t, i) => (
                <div key={t.id} className={`pt-3 first:pt-0 text-left ${i !== 0 ? 'border-t border-border/30' : ''}`}>
                  <p className="text-xs font-semibold text-foreground line-clamp-1">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Ticket <span className="font-mono text-primary-bright font-bold">{t.ticket_id}</span> status is <span className="font-bold uppercase">{t.status}</span>.
                  </p>
                  <span className="text-[9px] text-muted-foreground/60 font-mono mt-1 block">
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">No updates available.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- Detailed Side Inspection Drawer --- */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-full sm:w-[500px] h-full bg-surface border-l border-border/60 shadow-2xl flex flex-col z-10 text-left"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary-bright px-2 py-0.5 bg-primary-bright/5 rounded border border-primary-bright/10">
                    {selectedTicket.ticket_id}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                  <UrgencyBadge level={selectedTicket.urgency} />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportDossier}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-[10px] font-bold text-foreground uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
                    <span>Dossier</span>
                  </button>
                  <button 
                    onClick={() => setSelectedTicket(null)} 
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Title & Filed time */}
                <div className="space-y-2">
                  <h2 className="text-lg font-heading font-black text-foreground tracking-tight leading-snug">
                    {selectedTicket.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> Filed {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                    </span>
                    <SLACountdown ticket={selectedTicket} />
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Narrative Statement */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Narrative Statement</span>
                  <p className="p-4 rounded-lg bg-background border border-border text-foreground text-xs leading-relaxed italic whitespace-pre-wrap">
                    "{selectedTicket.description}"
                  </p>
                </div>

                {/* Evidence Attachment */}
                {selectedTicket.attachment_url && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Evidence Documents</span>
                    <a 
                      href={selectedTicket.attachment_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary-bright/20 transition-all bg-background"
                    >
                      <div className="p-2 bg-muted border border-border rounded-lg text-primary-bright">
                        <FileDown size={14} />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-foreground">Open Attachment Link</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Verified Document File</p>
                      </div>
                    </a>
                  </div>
                )}

                {/* Location metadata */}
                {selectedTicket.location && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Location Coords</span>
                    <div className="p-3 bg-background border border-border rounded-lg flex items-center gap-2 text-xs text-foreground font-medium">
                      <MapPin size={12} className="text-primary-bright shrink-0" />
                      <span className="truncate">{selectedTicket.location}</span>
                    </div>
                  </div>
                )}

                {/* AI assessment */}
                <div className="p-4 rounded-lg border border-primary-bright/10 bg-primary-bright/[0.01] space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-bright block">AI Assessments</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Urgency Index</span>
                        <span className="text-primary-bright">{selectedTicket.urgency}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${selectedTicket.urgency === 'High' ? 'w-full bg-error' : selectedTicket.urgency === 'Medium' ? 'w-2/3 bg-warning' : 'w-1/3 bg-success'}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Frustration Index</span>
                        <span className="text-primary-bright">{(selectedTicket.frustration_index || 1)}/10</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-bright"
                          style={{ width: `${(selectedTicket.frustration_index || 1) * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone tracking */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Milestone Tracker</span>
                  <div className="space-y-4 relative pl-1">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                    
                    <TimelineStep 
                      done={true} 
                      label="Registry Ingest" 
                      date={new Date(selectedTicket.created_at).toLocaleDateString()}
                      desc="Logged in ResolveNow database stores."
                    />
                    <TimelineStep 
                      done={selectedTicket.status !== 'Pending'} 
                      active={selectedTicket.status === 'In-Progress'}
                      label="Authority Review" 
                      desc="Assigned to department coordinator."
                    />
                    <TimelineStep 
                      done={selectedTicket.status === 'Resolved'} 
                      active={selectedTicket.status === 'Resolved'}
                      label="Redressal Complete" 
                      desc="Grievance closed with official statement."
                    />
                  </div>
                </div>

                {selectedTicket.status === 'Resolved' && (
                  <>
                    <div className="h-px bg-border/50" />
                    <div className="p-4 rounded-lg border border-success/20 bg-success/[0.01] space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-success block">Share Your Redressal Feedback</span>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        This ticket is marked as Resolved. Please let us know if you are satisfied with the redressal quality. Submitting this feedback will close the ticket.
                      </p>
                      {/* Star Selector */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1 transition-colors cursor-pointer ${
                              feedbackRating >= star ? 'text-warning' : 'text-muted-foreground/30 hover:text-warning/60'
                            }`}
                          >
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      {/* Comments Box */}
                      <div className="space-y-1">
                        <textarea
                          rows="2"
                          value={feedbackComments}
                          onChange={(e) => setFeedbackComments(e.target.value)}
                          placeholder="Write a brief comment about your redressal experience (optional)..."
                          className="glass-input w-full text-xs resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isSubmittingFeedback || feedbackRating === 0}
                        onClick={handleSubmitFeedback}
                        className="w-full btn-premium py-2 text-xs font-semibold"
                      >
                        {isSubmittingFeedback ? 'Submitting Feedback...' : 'Submit & Close Ticket'}
                      </button>
                    </div>
                  </>
                )}

                <div className="h-px bg-border/50" />

                {/* Correspondence log */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    Official Correspondence
                  </span>
                  <div className="h-[320px] rounded-lg border border-border bg-background overflow-hidden">
                    <CommandChat 
                      grievanceId={selectedTicket.id} 
                      currentUser={sessionUser} 
                      role="user"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Registration Modal Dialog --- */}
      <AnimatePresence>
        {showModal && (
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.98, opacity: 0, y: 10 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.98, opacity: 0, y: 10 }} 
                className="w-full max-w-lg p-0 relative max-h-[90vh] overflow-hidden flex flex-col shadow-2xl bg-surface border border-border/80 rounded-xl"
              >
                {/* Header */}
                <div className="p-4 border-b border-border/50 bg-background flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-primary-bright"><Send size={14} /></span>
                    <h2 className="text-sm font-heading font-black text-foreground uppercase tracking-wider">File New Grievance</h2>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg"><X size={16} /></button>
                </div>

                {/* Form Body */}
                <form className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-left" onSubmit={handleCreateGrievance}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Department</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input w-full bg-background border border-border text-foreground py-2 px-3 text-xs rounded-lg">
                        <option>IT Support</option>
                        <option>Maintenance</option>
                        <option>Academic</option>
                        <option>Financial</option>
                        <option>Public Infrastructure</option>
                        <option>Eco-Sustainability</option>
                        <option>Social Welfare</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Priority Assessment</label>
                      <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="glass-input w-full bg-background border border-border text-foreground py-2 px-3 text-xs rounded-lg">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject Specification</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summary of the incident" className="glass-input w-full" required />
                  </div>
                  
                  {/* Location picker */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                        <MapPin size={12} className="text-primary-bright" />
                        Incident Coordinates (Google Maps)
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        className="text-[9px] font-bold uppercase tracking-wider text-primary-bright"
                      >
                        {showMap ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <PlacePicker
                        className="glass-input w-full"
                        placeholder="Specify location address..."
                        onPlaceChange={(e) => {
                          const place = e.target.value;
                          if (place) {
                            setLocationName(place.formattedAddress || place.displayName || '');
                            if (place.location) {
                              setCoordinates({
                                lat: place.location.lat(),
                                lng: place.location.lng()
                              });
                            }
                          }
                        }}
                      />
                      
                      {locationName && (
                        <div className="p-2.5 rounded-lg bg-success/5 border border-success/20 flex items-center gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-success shrink-0" />
                          <span className="text-foreground font-medium truncate">{locationName}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setLocationName('');
                              setCoordinates({ lat: null, lng: null });
                            }}
                            className="text-muted-foreground hover:text-foreground ml-auto"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Narrative input */}
                  <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official statement description</label>
                      <div className="flex gap-1.5">
                        <button 
                          type="button" 
                          onClick={startVoiceInput}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider transition-colors ${isListening ? 'bg-error/10 text-error border-error/20 animate-pulse' : 'bg-background hover:bg-muted text-muted-foreground border-border'}`}
                        >
                          {isListening ? <MicOff size={10} /> : <Mic size={10} />}
                          <span>{isListening ? 'Listening' : 'Dictate'}</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAiAnalyze}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1 px-2 py-0.5 border border-primary-bright/20 bg-primary-bright/5 hover:bg-primary-bright/10 text-primary-bright text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          <span>{isAnalyzing ? 'Triage...' : 'AI Assist'}</span>
                        </button>
                      </div>
                    </div>
                    <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide complete details for review..." className="glass-input w-full resize-none" required></textarea>
                  </div>

                  {/* Attachment upload */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Attachment (Max 5MB)</label>
                    <div className="relative group overflow-hidden rounded-lg border border-border hover:border-primary-bright/20 transition-all bg-background/50 p-2.5 flex items-center justify-between cursor-pointer">
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                        <Plus size={14} />
                        <span className="text-xs font-semibold">{attachment ? attachment.name : 'Upload supporting documents'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Footer Actions */}
                  <div className="flex items-center gap-3 pt-2 shrink-0">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-ghost py-2 flex-1">Cancel</button>
                    <button disabled={isSubmitting} type="submit" className="btn-premium py-2 flex-1">
                      <span>{isSubmitting ? 'Submitting...' : 'Filing Request'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </APIProvider>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
