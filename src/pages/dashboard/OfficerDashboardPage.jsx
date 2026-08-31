import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Ticket, Clock, AlertTriangle, TrendingUp, Search, 
  X, CheckCircle2, Download, Shield, ShieldAlert, Zap, Sparkles, 
  Activity, ChevronRight, ChevronLeft, FileDown, Loader2,
  RefreshCw, UserCheck, Layers, FileText, Check, ArrowRight,
  MessageSquare, Send, Bot, AlertCircle, Phone, Mail, Building,
  Filter, Play, CheckSquare, CornerDownRight, ThumbsUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import SlaRiskBadge from '../../components/ui/SlaRiskBadge';
import { DeliveryTrackingWidget } from '../../components/grievances/DeliveryTrackingWidget';
import { CommandChat } from '../../components/ai/CommandChat';
import { webPushService } from '../../services/webPushService';

import AnimatedPage from '../../components/ui/AnimatedPage';
import CounterCard from '../../components/ui/CounterCard';
import BentoStatCard from '../../components/ui/BentoStatCard';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export const OfficerDashboardPage = ({ sessionUser, userProfile, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeQueueTab, setActiveQueueTab] = useState('assigned'); // 'assigned', 'department', 'all'
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [aiGeneratingResolution, setAiGeneratingResolution] = useState(false);

  // Escalate Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  const officerId = sessionUser?.id;
  const officerEmail = sessionUser?.email;
  const officerDept = sessionUser?.department || userProfile?.department || '';

  const fetchOfficerTickets = useCallback(async () => {
    setLoading(true);
    try {
      const isDemo = sessionUser?.id?.startsWith('demo-');
      let data = [];
      if (isDemo) {
        data = await grievanceService.getAll();
      } else {
        const res = await apiClient.get('/grievances');
        data = res.data || [];
      }

      if (Array.isArray(data)) {
        setTickets(data);
        if (!selectedTicket && data.length > 0) {
          // Select first assigned ticket, or first ticket
          const myAssigned = data.find(t => t.assigned_to === officerId || t.assigned_to === officerEmail);
          setSelectedTicket(myAssigned || data[0]);
        } else if (selectedTicket) {
          // Keep current selected ticket updated with fresh data
          const updated = data.find(t => t.id === selectedTicket.id || t.ticket_id === selectedTicket.ticket_id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch officer tickets:', err);
      toast.error('Failed to load assigned workload.');
    } finally {
      setLoading(false);
    }
  }, [sessionUser, officerId, officerEmail, selectedTicket]);

  // Realtime Connection Hook
  useRealtimeConnection(() => {
    fetchOfficerTickets();
  });

  useEffect(() => {
    fetchOfficerTickets();

    // Supabase Realtime channel subscription
    const channel = supabase
      .channel('officer-workstation-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        () => {
          fetchOfficerTickets();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_comments' },
        (payload) => {
          if (selectedTicket && payload.new.grievance_id === selectedTicket.id) {
            toast('New comment received on this ticket', { icon: '💬' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOfficerTickets, selectedTicket]);

  // Status transition handler (1-click action buttons)
  const handleQuickStatusUpdate = async (ticketId, nextStatus, notes = '') => {
    try {
      await grievanceService.updateStatus(ticketId, nextStatus, notes);
      toast.success(`Status updated to "${nextStatus}"`);

      // Trigger Web Push & Simulated SMS Alert
      webPushService.triggerMilestoneAlert({
        ticketId: selectedTicket?.ticket_id || ticketId,
        status: nextStatus,
        title: selectedTicket?.title || 'Campus Grievance',
        officerName: sessionUser?.fullName || 'Assigned Officer',
        department: selectedTicket?.department || officerDept,
        smsPhone: selectedTicket?.mobile_number || '+1 (555) 019-2834'
      });

      fetchOfficerTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status.');
    }
  };

  // Submit Resolution Handler
  const handleConfirmResolution = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      return toast.error('Please provide resolution notes describing the redressal action taken.');
    }

    setIsSubmittingResolution(true);
    try {
      await grievanceService.updateStatus(selectedTicket.id, 'Resolved', resolutionNotes.trim());
      toast.success('Grievance marked as Resolved and citizen notified!');

      // Trigger Resolution Web Push & SMS Alert
      webPushService.triggerMilestoneAlert({
        ticketId: selectedTicket?.ticket_id || selectedTicket.id,
        status: 'Resolved',
        title: selectedTicket?.title,
        officerName: sessionUser?.fullName || 'Assigned Officer',
        department: selectedTicket?.department || officerDept,
        smsPhone: selectedTicket?.mobile_number || '+1 (555) 019-2834'
      });

      setShowResolveModal(false);
      setResolutionNotes('');
      fetchOfficerTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to resolve grievance.');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  // Submit Escalation Handler
  const handleConfirmEscalation = async (e) => {
    e.preventDefault();
    if (!escalationReason.trim()) {
      return toast.error('Please specify the reason for escalation.');
    }

    setIsSubmittingEscalation(true);
    try {
      await grievanceService.escalate(selectedTicket.id, escalationReason.trim());
      toast.success('Grievance escalated to Administrative Clearance!');

      // Trigger Escalation Milestone Alert
      webPushService.triggerMilestoneAlert({
        ticketId: selectedTicket?.ticket_id || selectedTicket.id,
        status: 'Escalated',
        title: selectedTicket?.title,
        officerName: sessionUser?.fullName || 'Assigned Officer',
        department: selectedTicket?.department || officerDept,
        smsPhone: selectedTicket?.mobile_number || '+1 (555) 019-2834'
      });

      setShowEscalateModal(false);
      setEscalationReason('');
      fetchOfficerTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to escalate grievance.');
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // Generate AI Resolution Draft
  const handleGenerateAiResolution = async () => {
    if (!selectedTicket) return;
    setAiGeneratingResolution(true);
    try {
      const res = await apiClient.post('/ai/suggest', {
        title: selectedTicket.title,
        description: selectedTicket.description,
        category: selectedTicket.department || selectedTicket.category
      });
      if (res.data?.suggestion || res.data?.suggestedResponse) {
        setResolutionNotes(res.data.suggestion || res.data.suggestedResponse);
        toast.success('AI Resolution template generated!');
      } else {
        setResolutionNotes(`Issue investigated and resolved by ${officerDept || 'Department'} Officer. Corrective measures have been implemented.`);
      }
    } catch (err) {
      setResolutionNotes(`Issue regarding "${selectedTicket.title}" has been investigated and resolved in accordance with institutional policy.`);
    } finally {
      setAiGeneratingResolution(false);
    }
  };

  // Filter tickets for queues
  const myAssignedTickets = tickets.filter(t => 
    t.assigned_to === officerId || t.assigned_to === officerEmail || (t.officer_email && t.officer_email === officerEmail)
  );

  const deptTickets = tickets.filter(t => 
    officerDept && (t.department || '').toLowerCase() === officerDept.toLowerCase()
  );

  const activeQueue = activeQueueTab === 'assigned' 
    ? myAssignedTickets 
    : activeQueueTab === 'department' 
      ? deptTickets 
      : tickets;

  const filteredTickets = activeQueue.filter(t => {
    const matchesSearch = !searchQuery || 
      t.ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'All' || t.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Officer KPI Metrics
  const totalAssigned = myAssignedTickets.length;
  const activeInTransit = myAssignedTickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const pendingCitizen = myAssignedTickets.filter(t => t.status === 'Pending User Response').length;
  const resolvedCount = myAssignedTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const resolutionRate = totalAssigned > 0 ? Math.round((resolvedCount / totalAssigned) * 100) : 100;
  
  const slaCriticalCount = myAssignedTickets.filter(t => {
    if (!t.sla_due_at || ['Resolved', 'Closed'].includes(t.status)) return false;
    const diff = new Date(t.sla_due_at) - new Date();
    return diff > 0 && diff < 24 * 3600000;
  }).length;

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        
        {/* Top Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface/80 backdrop-blur-xl border border-border/80 p-6 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-heading font-black text-foreground">
                    Officer Dispatch & Redressal Workstation
                  </h1>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ON DUTY
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assigned Officer: <span className="font-semibold text-foreground">{sessionUser?.fullName || sessionUser?.email}</span> 
                  {officerDept && <> • Department: <span className="text-indigo-400 font-semibold">{officerDept}</span></>}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatedButton 
              variant="outline" 
              size="sm" 
              onClick={fetchOfficerTickets}
              leftIcon={RefreshCw}
              isLoading={loading}
            >
              Sync Workload
            </AnimatedButton>
          </div>
        </div>

        {/* Officer KPI Stats Bar with Reactive Mouse Glows */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <BentoStatCard
            title="Active Workload"
            value={activeInTransit}
            subtitle="Under active investigation"
            icon={Clock}
            accentColor="indigo"
            beacon={activeInTransit > 0}
          />
          <BentoStatCard
            title="SLA Critical (<24h)"
            value={slaCriticalCount}
            subtitle="Impending breach deadline"
            icon={AlertTriangle}
            accentColor="rose"
            beacon={slaCriticalCount > 0}
          />
          <BentoStatCard
            title="Citizen Discussions"
            value={pendingCitizen}
            subtitle="Awaiting reply / input"
            icon={MessageSquare}
            accentColor="amber"
          />
          <BentoStatCard
            title="Redressal Rate"
            value={`${resolutionRate}%`}
            subtitle={`${resolvedCount} resolved cases`}
            icon={CheckCircle2}
            accentColor="emerald"
            trend={{ value: `${resolvedCount} closed`, isPositive: true }}
          />
        </div>

        {/* Main Workstation: Split Screen Delivery View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Assigned Queue (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassPanel className="p-4 rounded-3xl space-y-4">
              
              {/* Queue Tab Selector */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-1.5 bg-background/60 p-1 rounded-xl border border-border/50">
                  <button
                    onClick={() => setActiveQueueTab('assigned')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeQueueTab === 'assigned' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    My Queue ({myAssignedTickets.length})
                  </button>
                  <button
                    onClick={() => setActiveQueueTab('department')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeQueueTab === 'department' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Dept Pool ({deptTickets.length})
                  </button>
                </div>
                
                <span className="text-[10px] font-mono text-muted-foreground font-bold">
                  {filteredTickets.length} Tickets
                </span>
              </div>

              {/* Search & Filter Inputs */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticket #, title, citizen..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background/80 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-background/80 border border-border/60 text-foreground focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Pending User Response">Pending Citizen</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-background/80 border border-border/60 text-foreground focus:outline-none"
                  >
                    <option value="All">All Urgency</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Ticket Cards List */}
              <div className="space-y-2.5 max-h-155 overflow-y-auto pr-1">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <LoadingSkeleton key={i} className="h-24 rounded-2xl" />
                  ))
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-border/60 rounded-2xl">
                    <CheckSquare size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-bold text-foreground">Queue Clean</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      No tickets matching the selected filters.
                    </p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const isSlaBreached = t.sla_due_at && new Date(t.sla_due_at) < new Date() && !['Resolved', 'Closed'].includes(t.status);

                    return (
                      <motion.div
                        key={t.id || t.ticket_id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-md shadow-primary/10 ring-1 ring-primary/30'
                            : 'bg-surface/60 hover:bg-surface/90 border-border/70'
                        }`}
                      >
                        {/* SLA Breach warning ribbon */}
                        {isSlaBreached && (
                          <div className="absolute top-0 right-0 px-2 py-0.5 bg-error text-white font-mono text-[8px] font-black rounded-bl-lg uppercase tracking-wider">
                            SLA Overdue
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-[10px] font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                            #{t.ticket_id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={t.status} />
                            <UrgencyBadge level={t.urgency} />
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {t.title}
                        </h4>

                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {t.description}
                        </p>

                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-2 border-t border-border/40 font-mono">
                          <span>Citizen: {t.full_name || t.user_name || 'Anonymous'}</span>
                          <span>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

            </GlassPanel>
          </div>

          {/* Right Column: Selected Delivery Workstation & Action Station (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedTicket ? (
              <div className="space-y-6">
                
                {/* 1. Real-time Delivery Tracker Widget (Role Mode: Officer) */}
                <DeliveryTrackingWidget
                  ticket={selectedTicket}
                  onExportPdf={() => {
                    toast.success('Exporting official redressal dossier...');
                    window.open(`/grievances/${selectedTicket.ticket_id || selectedTicket.id}`, '_blank');
                  }}
                />

                {/* 2. Interactive Officer Action Toolbar */}
                <GlassPanel className="p-5 rounded-3xl border border-primary/20 bg-surface/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-primary animate-pulse" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                        Officer Delivery Action Station
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Ticket #{selectedTicket.ticket_id}
                    </span>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Accept / Start Working */}
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTicket.id, 'In Progress', 'Officer commenced active investigation.')}
                      disabled={selectedTicket.status === 'In Progress' || selectedTicket.status === 'Resolved'}
                      className="px-3 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Play size={14} />
                      <span>Start Working</span>
                    </button>

                    {/* Request Info from Citizen */}
                    <button
                      onClick={() => handleQuickStatusUpdate(selectedTicket.id, 'Pending User Response', 'Officer requested additional verification details from citizen.')}
                      disabled={selectedTicket.status === 'Pending User Response' || selectedTicket.status === 'Resolved'}
                      className="px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Request Info</span>
                    </button>

                    {/* Escalate Case */}
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      disabled={selectedTicket.status === 'Escalated' || selectedTicket.status === 'Resolved'}
                      className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <AlertTriangle size={14} />
                      <span>Escalate</span>
                    </button>

                    {/* Resolve & Deliver Redressal */}
                    <button
                      onClick={() => setShowResolveModal(true)}
                      disabled={selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                      className="px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-emerald-500/10"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Resolved</span>
                    </button>
                  </div>

                  {/* 1-Click Quick Clarification Prompts to Citizen */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block text-left">
                      💬 1-Click Citizen Clarification Prompts
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '📍 Ask Room / Lab #', note: 'Officer note: Please provide your specific room number or classroom location so our maintenance crew can inspect immediately.' },
                        { label: '📷 Request Photo / Doc', note: 'Officer note: Please upload a photo of the physical issue or attach the relevant fee invoice / document.' },
                        { label: '📞 Request Callback Time', note: 'Officer note: Please reply with your preferred time window for an on-site technician visit or telephone callback.' },
                        { label: '💳 Ask Transaction ID', note: 'Officer note: Please share the payment transaction reference number or bank UTR ID for accounting verification.' }
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickStatusUpdate(selectedTicket.id, 'Pending User Response', prompt.note)}
                          disabled={selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                          className="px-2.5 py-1 rounded-lg bg-surface/90 hover:bg-cyan-500/15 border border-border/80 hover:border-cyan-500/40 text-[11px] font-medium text-foreground transition-all cursor-pointer disabled:opacity-40"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassPanel>

                {/* 3. Citizen Dossier & Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface/60 border border-border/70 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Citizen Contact</p>
                    <p className="text-xs font-bold text-foreground">{selectedTicket.full_name || selectedTicket.user_name || 'Registered Citizen'}</p>
                    <p className="text-xs font-mono text-muted-foreground">{selectedTicket.email || 'Email on file'}</p>
                    <p className="text-[10px] text-indigo-400 font-bold">{selectedTicket.department || 'General'}</p>
                  </div>

                  <div className="bg-surface/60 border border-border/70 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">SLA Target & Urgency</p>
                    <div className="flex items-center gap-2">
                      <UrgencyBadge level={selectedTicket.urgency} />
                      <SlaRiskBadge ticket={selectedTicket} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Due: {selectedTicket.sla_due_at ? new Date(selectedTicket.sla_due_at).toLocaleString() : 'Standard 72h'}
                    </p>
                  </div>
                </div>

                {/* 4. Realtime Citizen-Officer Communication Stream */}
                <div className="h-105">
                  <CommandChat
                    grievanceId={selectedTicket.id}
                    currentUser={sessionUser}
                    role="officer"
                  />
                </div>

              </div>
            ) : (
              <div className="bg-surface/40 border border-dashed border-border/80 rounded-3xl p-16 text-center space-y-3">
                <Ticket size={40} className="mx-auto text-muted-foreground/30 animate-bounce" />
                <h3 className="text-base font-bold text-foreground">Select a Grievance from the Queue</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click any ticket in your active delivery queue on the left to view its live progress pipeline, contact citizen, and execute status transitions.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RESOLVE GRIEVANCE MODAL */}
        <AnimatePresence>
          {showResolveModal && selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-surface border border-border/80 rounded-3xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={18} />
                    <h3 className="text-sm font-bold text-foreground">Deliver Redressal & Resolve Case</h3>
                  </div>
                  <button onClick={() => setShowResolveModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-muted-foreground">
                    Ticket: <span className="font-bold text-foreground">#{selectedTicket.ticket_id} — {selectedTicket.title}</span>
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Resolution Redressal Summary (Citizen Visible)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAiResolution}
                      disabled={aiGeneratingResolution}
                      className="text-[10px] font-bold text-primary hover:text-primary-bright flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={11} />
                      <span>{aiGeneratingResolution ? 'Drafting...' : 'AI Suggest Notes'}</span>
                    </button>
                  </div>

                  {/* 1-Click Canned Resolution Templates */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                      ⚡ 1-Click Canned Resolution Templates
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🔧 On-Site Repair Done', text: 'On-site technical inspection completed. Faulty hardware/fixtures were replaced and verified operational.' },
                        { label: '📶 Network Restored', text: 'IT infrastructure switches and access points were reconfigured. Latency and signal levels are now verified normal.' },
                        { label: '📑 Records Verified', text: 'Official verification completed with Academic Controller Office. Records updated in university portal.' },
                        { label: '💳 Fee Balance Adjusted', text: 'Finance accounts team audited payment invoice and credit balance was adjusted in student fee ledger.' },
                        { label: '🧹 Premises Sanitized', text: 'Housekeeping and facilities supervisor inspected premises and executed complete sanitization.' }
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setResolutionNotes(tmpl.text);
                            toast.success(`Template applied: ${tmpl.label}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-background border border-border hover:border-emerald-500/50 hover:bg-emerald-500/10 text-[11px] font-medium text-foreground transition-all cursor-pointer"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe specific corrective actions taken to resolve the grievance..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                  >
                    Cancel
                  </button>
                  <AnimatedButton
                    variant="glow"
                    size="sm"
                    onClick={handleConfirmResolution}
                    isLoading={isSubmittingResolution}
                    rightIcon={CheckCircle2}
                  >
                    Confirm Resolution
                  </AnimatedButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ESCALATE MODAL */}
        <AnimatePresence>
          {showEscalateModal && selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-surface border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle size={18} />
                    <h3 className="text-sm font-bold text-foreground">Escalate to Senior Administration</h3>
                  </div>
                  <button onClick={() => setShowEscalateModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-muted-foreground">
                    Ticket: <span className="font-bold text-foreground">#{selectedTicket.ticket_id}</span>
                  </p>
                  
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Reason for Escalation
                  </label>
                  <textarea
                    rows={3}
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Detail the bottleneck, policy issue, or departmental boundary requiring administrative clearance..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEscalation}
                    disabled={isSubmittingEscalation}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEscalation ? 'Escalating...' : 'Submit Escalation'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AnimatedPage>
  );
};

export default OfficerDashboardPage;
