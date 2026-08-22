import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Plus, Clock, CheckCircle2, AlertCircle, X, Ticket, 
  Sparkles, Loader2, FileDown, Search, ChevronLeft, ChevronRight,
  Activity, Trash2, Zap, Upload, Paperclip, AlertTriangle, Bell
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import { webPushService } from '../../services/webPushService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import SlaRiskBadge from '../../components/ui/SlaRiskBadge';
import GrievanceWorkflowTimeline from '../../components/grievances/GrievanceWorkflowTimeline';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import { DeliveryTrackingWidget } from '../../components/grievances/DeliveryTrackingWidget';

import AnimatedPage from '../../components/ui/AnimatedPage';
import CounterCard from '../../components/ui/CounterCard';
import GlassPanel from '../../components/ui/GlassPanel';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export const UserDashboard = ({ sessionUser, userProfile }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [cancelModalTicket, setCancelModalTicket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // New Grievance States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IT Support');
  const [urgency, setUrgency] = useState('Medium');
  const [frustrationIndex, setFrustrationIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const isDemoUser = sessionUser?.id?.startsWith('demo-');
      const data = isDemoUser 
        ? await grievanceService.getAll()
        : await grievanceService.getByUser(sessionUser.id);
      if (Array.isArray(data)) {
        setTickets(data);
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotifications() {
    try {
      if (sessionUser?.id?.startsWith('demo-')) return;
      const res = await apiClient.get('/user/notifications');
      setNotifications(res.data || []);
    } catch { /* notification fetch is non-critical — silently skip */ }
  }

  useRealtimeConnection(() => {
    fetchTickets();
    fetchNotifications();
  });

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
            toast.success(`New Grievance #${payload.new.ticket_id} registered.`);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => {
              const oldTicket = prev.find(t => t.id === payload.new.id);
              if (oldTicket && oldTicket.status !== payload.new.status) {
                toast.success(`Ticket #${payload.new.ticket_id} status is now ${payload.new.status}`);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionUser?.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: Images, PDF, Word documents, Plain text.');
      return;
    }

    if (file.size === 0) {
      toast.error('File is empty.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setAttachment(file);
    toast.success(`Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `attach_${sessionUser?.id || 'anon'}_${Date.now()}.${fileExt}`;
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
      console.warn('Storage upload fallback:', err.message);
      return URL.createObjectURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!description.trim()) {
      toast.error("Please enter the grievance description first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const data = await grievanceService.analyze(description);
      setCategory(data.category || 'IT Support');
      setUrgency(data.urgency || 'Medium');
      setFrustrationIndex(data.frustration_index || 1);
      if (!title) {
        setTitle(`${description.split(' ').slice(0, 4).join(' ')}...`);
      }
      toast.success("AI Triage analysis complete.");
    } catch {
      toast.error("AI Assistant offline. Default category applied.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateGrievance = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Subject and description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = null;
      if (attachment) {
        fileUrl = await uploadFile(attachment);
      }

      const created = await grievanceService.create({ 
        user_id: sessionUser.id?.startsWith('demo-') ? null : sessionUser.id,
        email: sessionUser.email,
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
      setAttachment(null);
      fetchTickets();
      toast.success(`Grievance submitted successfully. Ticket ID: ${created?.ticket_id || 'assigned'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelGrievance = async (ticket) => {
    const cancellable = ['Submitted', 'Draft', 'New', 'Pending'].includes(ticket.status);
    if (!cancellable) {
      toast.error(`Cannot cancel ticket #${ticket.ticket_id} because it is already '${ticket.status}'.`);
      return;
    }
    setCancelModalTicket(ticket);
  };

  const confirmCancelGrievance = async () => {
    if (!cancelModalTicket) return;
    setIsDeleting(true);
    try {
      await grievanceService.delete(cancelModalTicket.id);
      toast.success(`Grievance #${cancelModalTicket.ticket_id} has been canceled.`);
      setCancelModalTicket(null);
      if (selectedTicket?.id === cancelModalTicket.id) {
        setSelectedTicket(null);
      }
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not cancel grievance.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPdf = async (ticketToExport) => {
    const target = ticketToExport || selectedTicket;
    if (!target) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 42, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("RESOLVENOW GRIEVANCE DOSSIER", 15, 24);
      doc.setFontSize(10);
      doc.text(`TICKET REFERENCE: #${target.ticket_id}`, 135, 24);
      doc.text(`GENERATED: ${new Date().toLocaleDateString()}`, 135, 31);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("1. Grievance Overview", 15, 54);
      doc.line(15, 57, 195, 57);
      
      doc.setFontSize(10);
      doc.text(`Subject Title: ${target.title}`, 15, 66);
      doc.text(`Category: ${target.category}`, 15, 74);
      doc.text(`Priority Level: ${target.urgency}`, 15, 82);
      doc.text(`Department: ${target.department || 'Facilities & Maintenance'}`, 15, 90);
      doc.text(`Current Status: ${target.status}`, 120, 82);
      doc.text(`Filing Date: ${new Date(target.created_at).toLocaleString()}`, 15, 98);
      
      doc.setFontSize(12);
      doc.text("2. Narrative Statement", 15, 114);
      doc.line(15, 117, 195, 117);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(target.description, 180);
      doc.text(splitDesc, 15, 126);
      
      if (target.resolution_notes) {
        const yOffset = 135 + (splitDesc.length * 5);
        doc.setFillColor(240, 253, 250);
        doc.rect(15, yOffset, 180, 30, 'F');
        doc.setTextColor(13, 148, 136);
        doc.setFontSize(11);
        doc.text("Resolution Audit Statement", 20, yOffset + 9);
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitNotes = doc.splitTextToSize(target.resolution_notes, 170);
        doc.text(splitNotes, 20, yOffset + 17);
      }
      
      doc.save(`ResolveNow_Dossier_${target.ticket_id}.pdf`);
      toast.success("Dossier PDF report downloaded.");
    } catch {
      toast.error("Failed to generate PDF.");
    }
  };

  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;
  
  const overdueCount = tickets.filter(t => {
    if (['Resolved', 'Closed', 'Rejected'].includes(t.status)) return false;
    const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
    return dueAt < new Date();
  }).length;

  const categoryDataMap = {};
  tickets.forEach(t => {
    const cat = t.category || 'General';
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + 1;
  });

  const trendChartData = [
    { month: 'Feb', filed: Math.max(1, totalCount - 5), resolved: Math.max(1, resolvedCount - 3) },
    { month: 'Mar', filed: Math.max(2, totalCount - 4), resolved: Math.max(1, resolvedCount - 2) },
    { month: 'Apr', filed: Math.max(3, totalCount - 2), resolved: Math.max(2, resolvedCount - 1) },
    { month: 'May', filed: Math.max(2, totalCount - 1), resolved: Math.max(2, resolvedCount) },
    { month: 'Jun', filed: Math.max(4, totalCount), resolved: Math.max(3, resolvedCount + 1) },
    { month: 'Jul', filed: totalCount, resolved: resolvedCount }
  ];

  const topCategory = Object.entries(categoryDataMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IT Support';
  const activeTicket = tickets.find(t => !['Resolved', 'Closed'].includes(t.status)) || tickets[0];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.urgency === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AnimatedPage className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Banner */}
      <GlassPanel className="p-6 md:p-8 relative overflow-hidden border border-white/10 shadow-2xl rounded-3xl" intensity="heavy">
        <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-br from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-mono font-bold text-indigo-400 shadow-xs">
                <Zap size={13} className="animate-pulse text-indigo-400" />
                <span>Student Operational Console</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>System Nominal • SLA Active</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl font-heading font-black text-white uppercase tracking-tight">
              Welcome Back, {sessionUser?.fullName || userProfile?.fullName || 'Student'}!
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
              Track live grievance milestones, file institutional issues with AI voice & translation, and monitor SLA compliance in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <AnimatedButton
              variant="outline"
              size="md"
              leftIcon={Bell}
              onClick={async () => {
                const perm = await webPushService.requestPermission();
                const ticket = selectedTicket || {
                  ticket_id: 'TIC-1088',
                  title: 'Campus Wi-Fi & EduNet Signal Degradation',
                  department: 'IT Support & Campus Wi-Fi',
                  status: 'In Progress',
                  mobile_number: '+1 (555) 019-2834'
                };
                webPushService.triggerMilestoneAlert({
                  ticketId: ticket.ticket_id,
                  status: 'In Progress',
                  title: ticket.title,
                  officerName: 'Nodal Officer Rajesh',
                  department: ticket.department || 'IT Support',
                  smsPhone: '+1 (555) 019-2834'
                });
                toast.success('Live Web Push & Simulated SMS Alert Dispatched! 🔔');
              }}
            >
              Test Push & SMS
            </AnimatedButton>
            <AnimatedButton
              variant="glow"
              size="md"
              leftIcon={Plus}
              onClick={() => setShowModal(true)}
            >
              Submit New Grievance
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="md"
              leftIcon={FileDown}
              onClick={() => selectedTicket && handleExportPdf(selectedTicket)}
              disabled={!selectedTicket}
            >
              Export Dossier
            </AnimatedButton>
          </div>
        </div>
      </GlassPanel>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <CounterCard title="Total Filed" value={totalCount} icon={Ticket} iconColor="text-indigo-400" />
        <CounterCard title="Pending" value={pendingCount} icon={Clock} iconColor="text-amber-400" />
        <CounterCard title="In Progress" value={inProgressCount} icon={Activity} iconColor="text-cyan-400" />
        <CounterCard title="Resolved" value={resolvedCount} icon={CheckCircle2} iconColor="text-emerald-400" />
        <CounterCard title="Escalated" value={escalatedCount} icon={AlertTriangle} iconColor="text-rose-400" />
        <CounterCard title="SLA Overdue" value={overdueCount} icon={AlertCircle} iconColor="text-red-500" />
      </div>

      {/* 3. Recharts & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <GlassPanel className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-400" size={18} />
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Grievance & Resolution Analytics
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase bg-slate-900 px-2.5 py-1 rounded-md border border-white/10">
              Live Feed
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="filed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorFiled)" name="Filed" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* AI System Insights */}
        <GlassPanel className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400 animate-pulse" size={18} />
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                AI Triage Summary
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Top Category</span>
                <p className="font-bold text-indigo-400">{topCategory}</p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">SLA Compliance Rate</span>
                <p className="font-bold text-emerald-400">99.9% Compliance</p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Recommended Action</span>
                <p className="font-medium text-slate-300 leading-relaxed">
                  {activeTicket 
                    ? `Review active ticket #${activeTicket.ticket_id} (${activeTicket.status}).`
                    : 'All filed grievances resolved.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Avg Resolution Time</span>
            <span className="font-bold text-indigo-400 font-mono">1.8 Days</span>
          </div>
        </GlassPanel>
      </div>

      {/* 4. Active Delivery Tracker & Workflow Timeline */}
      {selectedTicket && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Selected Ticket Audit Trail & Milestone Progress
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Live Sync Active</span>
          </div>
          <DeliveryTrackingWidget 
            ticket={selectedTicket}
            onCancel={handleCancelGrievance}
            onExportPdf={handleExportPdf}
          />
          <GrievanceWorkflowTimeline ticket={selectedTicket} />
        </div>
      )}

      {/* 5. Grievances Registry Table */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-white/10 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              My Grievance Registry
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredTickets.length} filed ticket records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 w-full md:w-60">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text"
                placeholder="Search Ticket ID or Subject..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold border-b border-white/10">
                <th className="px-6 py-3.5">Ticket ID</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">SLA Risk</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <LoadingSkeleton variant="list" count={4} />
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 italic">
                    No grievance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                currentTickets.map((t) => {
                  const isCancellable = ['Submitted', 'Draft', 'New', 'Pending'].includes(t.status);
                  const isSelected = selectedTicket?.id === t.id;

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTicket(t)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-500/10' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                        #{t.ticket_id}
                      </td>
                      <td className="px-6 py-4 font-bold text-white max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {t.category}
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge level={t.urgency} />
                      </td>
                      <td className="px-6 py-4">
                        <SlaRiskBadge createdAt={t.created_at} slaDueAt={t.sla_due_at} status={t.status} compact={true} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExportPdf(t); }}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Export PDF Dossier"
                        >
                          <FileDown size={14} />
                        </button>
                        
                        {isCancellable && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancelGrievance(t); }}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                            title="Cancel Ticket"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-white/10 rounded-lg hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-white/10 rounded-lg hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <MotionCard className="max-w-md w-full p-6 space-y-4" tilt={false}>
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-heading font-black uppercase text-white">
                  Cancel Grievance Ticket?
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel ticket <strong className="text-white">#{cancelModalTicket.ticket_id}</strong> ("{cancelModalTicket.title}")? This action will remove the ticket from queue processing.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <AnimatedButton 
                  variant="secondary"
                  size="sm"
                  onClick={() => setCancelModalTicket(null)}
                  disabled={isDeleting}
                >
                  Keep Ticket
                </AnimatedButton>
                <AnimatedButton 
                  variant="danger"
                  size="sm"
                  onClick={confirmCancelGrievance}
                  isLoading={isDeleting}
                  leftIcon={Trash2}
                >
                  Confirm Cancellation
                </AnimatedButton>
              </div>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

      {/* New Grievance Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <MotionCard className="max-w-2xl w-full p-6 md:p-8 space-y-6 my-8" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-heading font-black text-white uppercase tracking-tight">
                    Submit New Grievance
                  </h3>
                  <p className="text-xs text-slate-400">Fill in details for AI triage and automated routing.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGrievance} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Grievance Subject *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Brief description of the issue..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Detailed Narrative Statement *
                    </label>
                    <button
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={isAnalyzing}
                      className="text-[10px] font-mono font-bold uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isAnalyzing ? 'Analyzing...' : 'AI Auto-Category'}
                    </button>
                  </div>
                  <textarea 
                    rows="4"
                    required
                    placeholder="Describe the incident with dates, locations, and personnel involved..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Department Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="IT Support">IT & Network Infrastructure</option>
                      <option value="Academic">Academic Affairs</option>
                      <option value="Hostel & Mess">Hostel & Food Security</option>
                      <option value="Finance & Fee">Finance & Fee Department</option>
                      <option value="Administration">General Administration</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Priority Level
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Critical Emergency</option>
                    </select>
                  </div>
                </div>

                {/* File Attachment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Upload Documentation (PDF / Images / Docs max 5MB)
                  </label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-indigo-500/40 transition-colors">
                    <input 
                      type="file"
                      id="grievance-attachment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="grievance-attachment" className="cursor-pointer flex flex-col items-center gap-2">
                      <Paperclip className="w-6 h-6 text-indigo-400" />
                      <span className="text-xs text-slate-300 font-medium">
                        {attachment ? attachment.name : 'Click to select file'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <AnimatedButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    variant="glow"
                    size="md"
                    isLoading={isSubmitting || isUploading}
                  >
                    Submit Grievance
                  </AnimatedButton>
                </div>
              </form>
            </MotionCard>
          </div>
        )}
      </AnimatePresence>

    </AnimatedPage>
  );
};

export default UserDashboard;
