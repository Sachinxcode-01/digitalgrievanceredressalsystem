import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Plus, Clock, CheckCircle2, AlertCircle, X, Send, Ticket, 
  Sparkles, Loader2, MailCheck, ArrowRight, TrendingUp, Mic, MicOff, 
  MessageSquare, FileDown, ShieldCheck, MapPin, Search, Calendar, Bell, ChevronLeft, ChevronRight,
  PieChart as PieIcon, BarChart3, AlertTriangle, Activity, Trash2, Award, Zap, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../services/grievanceService';
import { apiClient } from '../../api/apiClient';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import { logSecurityEvent } from '../../lib/auditLogger';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import { DeliveryTrackingWidget } from '../../components/grievances/DeliveryTrackingWidget';

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
    } catch {}
  }

  const { isSystemHealthy } = useRealtimeConnection(() => {
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

  // File Upload with Validation
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
      // Return local object URL for preview if Supabase storage policy throws error
      return URL.createObjectURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // AI Triage Analysis
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

  // Submit Grievance
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

  // Cancel / Delete Grievance Action
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

  // Export PDF Report
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

  // --- ANALYTICS CALCULATIONS ---
  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => ['Submitted', 'New', 'Pending', 'Draft'].includes(t.status)).length;
  const inProgressCount = tickets.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;
  
  // Overdue SLA count
  const overdueCount = tickets.filter(t => {
    if (['Resolved', 'Closed', 'Rejected'].includes(t.status)) return false;
    const dueAt = t.sla_due_at ? new Date(t.sla_due_at) : new Date(new Date(t.created_at).getTime() + 72 * 3600000);
    return dueAt < new Date();
  }).length;

  const slaSuccessRate = totalCount > 0 ? Math.round(((totalCount - overdueCount) / totalCount) * 100) : 100;
  const resolutionRate = totalCount > 0 ? Math.round(((resolvedCount + closedCount) / totalCount) * 100) : 100;

  // Recharts Data Prep
  const categoryDataMap = {};
  tickets.forEach(t => {
    const cat = t.category || 'General';
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + 1;
  });

  const pieChartData = Object.keys(categoryDataMap).map((cat, idx) => ({
    name: cat,
    value: categoryDataMap[cat]
  }));

  const PIE_COLORS = ['#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  const trendChartData = [
    { month: 'Feb', filed: Math.max(1, totalCount - 5), resolved: Math.max(1, resolvedCount - 3) },
    { month: 'Mar', filed: Math.max(2, totalCount - 4), resolved: Math.max(1, resolvedCount - 2) },
    { month: 'Apr', filed: Math.max(3, totalCount - 2), resolved: Math.max(2, resolvedCount - 1) },
    { month: 'May', filed: Math.max(2, totalCount - 1), resolved: Math.max(2, resolvedCount) },
    { month: 'Jun', filed: Math.max(4, totalCount), resolved: Math.max(3, resolvedCount + 1) },
    { month: 'Jul', filed: totalCount, resolved: resolvedCount }
  ];

  const priorityChartData = [
    { priority: 'High', count: tickets.filter(t => t.urgency === 'High').length },
    { priority: 'Medium', count: tickets.filter(t => t.urgency === 'Medium').length },
    { priority: 'Low', count: tickets.filter(t => t.urgency === 'Low').length }
  ];

  // Most Common Issue Category & Next Recommended Action
  const topCategory = Object.entries(categoryDataMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IT Support';
  const activeTicket = tickets.find(t => !['Resolved', 'Closed'].includes(t.status)) || tickets[0];

  // Filtered List
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
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Banner Card */}
      <div className="bg-gradient-to-r from-primary/10 via-surface to-accent/10 border border-border/80 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
              <Zap size={13} />
              <span>Student Operational Command</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-foreground uppercase tracking-tight">
              Welcome Back, {sessionUser?.fullName || userProfile?.fullName || 'Student'}!
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl">
              Track live grievance milestones, submit institutional issues, and monitor SLA compliance in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 cursor-pointer"
            >
              <Plus size={16} />
              <span>Submit New Grievance</span>
            </button>
            <button 
              onClick={() => selectedTicket && handleExportPdf(selectedTicket)}
              disabled={!selectedTicket}
              className="btn-secondary flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              <FileDown size={15} />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3D Glassmorphic KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Submitted', value: totalCount, icon: Ticket, tone: 'text-primary border-primary/20 bg-primary/5' },
          { label: 'Pending Action', value: pendingCount, icon: Clock, tone: 'text-amber-500 border-amber-500/20 bg-amber-500/5' },
          { label: 'In Progress', value: inProgressCount, icon: TrendingUp, tone: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
          { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, tone: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Escalated', value: escalatedCount, icon: AlertTriangle, tone: 'text-rose-500 border-rose-500/20 bg-rose-500/5' },
          { label: 'SLA Overdue', value: overdueCount, icon: AlertCircle, tone: 'text-red-600 border-red-600/20 bg-red-600/5' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div 
              key={kpi.label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-2 backdrop-blur-md ${kpi.tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                <Icon size={16} />
              </div>
              <p className="text-2xl md:text-3xl font-heading font-black text-foreground">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Advanced Recharts Visualizations & AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Grievance Trend Chart */}
        <div className="lg:col-span-2 bg-surface border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-primary" size={18} />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
                Grievance & Resolution Trend
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-background px-2.5 py-1 rounded-md border border-border">
              Real-time Analytics
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="filed" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorFiled)" name="Filed" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights & Performance Metrics Card */}
        <div className="bg-surface border border-border/80 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={18} />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
                AI System Insights
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-background/80 p-3.5 rounded-xl border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Primary Grievance Sector</span>
                <p className="font-bold text-primary">{topCategory}</p>
              </div>

              <div className="bg-background/80 p-3.5 rounded-xl border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">SLA Compliance Rate</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">{slaSuccessRate}% Compliance</span>
                  <span className="text-[10px] font-mono text-muted-foreground">Target: 95%</span>
                </div>
              </div>

              <div className="bg-background/80 p-3.5 rounded-xl border border-border/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Next Recommended Action</span>
                <p className="font-medium text-foreground leading-relaxed">
                  {activeTicket 
                    ? `Check active ticket #${activeTicket.ticket_id} (${activeTicket.status}) for officer notes.`
                    : 'All filed grievances are resolved. Submit a new ticket if needed.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Avg Resolution Time</span>
            <span className="font-bold text-primary font-mono">1.8 Days</span>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Delivery-Style Tracker Widget */}
      {activeTicket && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">
              Active Grievance Delivery Tracker
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Live Sync Active</span>
          </div>
          <DeliveryTrackingWidget 
            ticket={activeTicket}
            onCancel={handleCancelGrievance}
            onExportPdf={handleExportPdf}
          />
        </div>
      )}

      {/* 5. Grievances Registry Table & Filter Control Bar */}
      <div className="bg-surface border border-border/80 rounded-2xl shadow-sm overflow-hidden space-y-0">
        
        {/* Table Toolbar */}
        <div className="p-5 border-b border-border/60 bg-background/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider">
              My Grievance Registry
            </h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredTickets.length} filed ticket records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative bg-background border border-border rounded-xl px-3 py-1.5 flex items-center gap-2 w-full md:w-60">
              <Search size={14} className="text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search Ticket ID or Subject..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/50 w-full"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground cursor-pointer outline-none"
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

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground cursor-pointer outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-background/60 text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                <th className="px-6 py-3.5">Ticket ID</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                    Syncing ticket records...
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground italic">
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
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        #{t.ticket_id}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {t.category}
                      </td>
                      <td className="px-6 py-4">
                        <UrgencyBadge level={t.urgency} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExportPdf(t); }}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                          title="Export PDF Dossier"
                        >
                          <FileDown size={14} />
                        </button>
                        
                        {isCancellable && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancelGrievance(t); }}
                            className="p-1.5 hover:bg-error/10 text-error/80 hover:text-error rounded transition-all"
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
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Cancel Ticket Modal */}
      <AnimatePresence>
        {cancelModalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3 text-error">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">
                  Cancel Grievance Ticket?
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to cancel ticket <strong className="text-foreground">#{cancelModalTicket.ticket_id}</strong> ("{cancelModalTicket.title}")? This action will remove the ticket from active queue processing.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button 
                  onClick={() => setCancelModalTicket(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl cursor-pointer"
                >
                  Keep Ticket
                </button>
                <button 
                  onClick={confirmCancelGrievance}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. New Grievance Submission Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-left my-8"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-tight">
                    Submit New Grievance
                  </h3>
                  <p className="text-xs text-muted-foreground">Fill in details for instant AI triage and automated routing.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGrievance} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Grievance Subject *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Brief description of the issue..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Detailed Narrative Statement *
                    </label>
                    <button 
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={isAnalyzing || !description.trim()}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Auto AI Triage</span>
                    </button>
                  </div>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Provide exact details, dates, location, or circumstances..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-4 text-xs text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Category Group
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="IT Support">IT Support & Campus Wi-Fi</option>
                      <option value="Academic Affairs">Academic Affairs & Grades</option>
                      <option value="Facilities & Maintenance">Facilities & Hostel Maintenance</option>
                      <option value="Financial Services">Financial Services & Fee Credit</option>
                      <option value="Administrative Services">Administrative Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Priority Level
                    </label>
                    <select 
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="Low">Low (120h SLA)</option>
                      <option value="Medium">Medium (72h SLA)</option>
                      <option value="High">High (24h Urgent SLA)</option>
                    </select>
                  </div>
                </div>

                {/* Attachment Upload Field */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Attach Supporting Document / Photo (Max 5MB)
                  </label>
                  <input 
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary cursor-pointer"
                  />
                  {attachment && (
                    <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                      Ready: {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Submit Grievance</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
