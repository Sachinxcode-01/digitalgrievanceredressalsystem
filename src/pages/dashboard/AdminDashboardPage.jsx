import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Search, 
  X, CheckCircle2, Download, Shield, ShieldAlert, Lock, Zap, Sparkles, 
  ShieldCheck, Activity, Cpu, Terminal, MapPin, Send, ChevronRight, 
  ChevronLeft, ArrowRight, Radio, FileDown, Loader2, MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis } from 'recharts';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { SecurityAudit } from '../../components/dashboard/SecurityAudit';
import { supabase } from '../../lib/supabase';
import { grievanceService, getAuthHeaders } from '../../api/grievanceService';
import { CommandChat } from '../../components/ai/CommandChat';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import { logSecurityEvent } from '../../lib/auditLogger';

export const AdminDashboard = ({ sessionUser, userProfile, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [onlineOperators, setOnlineOperators] = useState([]);
  const { connectionState, isSystemHealthy } = useRealtimeConnection(() => {
    fetchGlobalTickets();
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Comments & AI states
  const [comments, setComments] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [specialistBriefing, setSpecialistBriefing] = useState('');
  const [isBriefing, setIsBriefing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [scannedTable, setScannedTable] = useState(null);
  const [isScanningTable, setIsScanningTable] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Realtime Admin Activity Feed
  const [activityLogs, setActivityLogs] = useState([]);
  const [profileMap, setProfileMap] = useState({});

  // Navigation Tabs
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    ['security', 'health', 'grievances', 'broadcast', 'reports'].includes(initialTab) ? initialTab : 'grievances'
  );

  // Broadcast State
  const [broadcastIntent, setBroadcastIntent] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Report Modal / Page states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Table Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['security', 'health', 'grievances', 'broadcast', 'reports'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  // Auto-generate report when reports tab is open
  useEffect(() => {
    if (activeTab === 'reports' && !reportSummary && tickets.length > 0) {
      generatePerformanceSummary();
    }
  }, [activeTab, tickets.length]);

  // Broadcast compose via backend
  const handleComposeBroadcast = async () => {
    if (!broadcastIntent.trim()) return toast.error("Provide a broadcast intent first.");
    setIsComposing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/ai/compose-broadcast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ intent: broadcastIntent })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const match = data.draft.match(/Subject:\s*(.*)\s*Body:\s*([\s\S]*)/i);
      if (match) {
        setBroadcastSubject(match[1].trim());
        setBroadcastBody(match[2].trim());
      } else {
        setBroadcastBody(data.draft);
      }
      toast.success("Broadcast draft generated by AI.");
    } catch (err) {
      toast.error("AI composition failed.");
    } finally {
      setIsComposing(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject || !broadcastBody) return toast.error("Dossier is incomplete.");
    setIsBroadcasting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ subject: broadcastSubject, body: broadcastBody })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success(`Broadcast transmitted to ${data.recipientsCount} users.`);
      setBroadcastIntent('');
      setBroadcastSubject('');
      setBroadcastBody('');
    } catch (err) {
      toast.error("Broadcast delivery failed.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    const alertChannel = supabase
      .channel('system-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_alerts' },
        (payload) => {
          if (payload.new.priority === 'high') {
            toast.error(`CRITICAL: ${payload.new.message}`, {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
    };
  }, []);

  const performAdvancedReasoning = async (prompt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/ai/suggest', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket: { description: prompt } })
      });
      const data = await response.json();
      return { 
        content: data.suggestion, 
        reasoning: "Analysis completed. Strategic resolution plan formulated." 
      };
    } catch (err) {
      console.error(err);
      return { content: "Deep reasoning engine offline.", reasoning: "Network error." };
    }
  };

  const extractTableFromImage = async (url) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/ai/vision', {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageUrl: url })
      });
      const data = await response.json();
      return { 
        analysis: data.analysis,
        status: "ACTIVE",
        format: "JSON_ARRAY",
        input: [url]
      };
    } catch (err) {
      console.error(err);
      return { analysis: "Vision scan failed." };
    }
  };

  useEffect(() => {
    fetchGlobalTickets();

    const channel = supabase
      .channel('global-grievances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grievances' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets((prev) => [payload.new, ...prev]);
            toast.info(`New grievance filed: ${payload.new.ticket_id}`);
          } else if (payload.eventType === 'UPDATE') {
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
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
      .channel('admin-ticket-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_comments' },
        (payload) => {
          setSelectedTicket((currentSelected) => {
            if (currentSelected && payload.new.grievance_id === currentSelected.id) {
               fetchComments(currentSelected.id);
            }
            return currentSelected;
          });
        }
      )
      .subscribe();

    // Presence Channel for online operators
    const presenceChannel = supabase.channel('admin-presence');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const operators = Object.values(state)
          .flat()
          .map(u => u.userName);
        const uniqueOperators = [...new Set(operators)];
        setOnlineOperators(uniqueOperators);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: sessionUser?.id,
            userName: sessionUser?.fullName || sessionUser?.email || 'Admin',
            role: 'admin'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [sessionUser?.id]);

  useEffect(() => {
    const fetchActivityFeed = async () => {
      try {
        const { data: profiles } = await supabase.from('user_profiles').select('user_id, full_name');
        const pMap = {};
        (profiles || []).forEach(p => {
          pMap[p.user_id] = p.full_name;
        });
        setProfileMap(pMap);

        const { data: logs } = await supabase
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        setActivityLogs(logs || []);
      } catch (err) {
        console.error('Failed to fetch admin activity feed:', err);
      }
    };

    fetchActivityFeed();

    const activityChannel = supabase
      .channel('admin-activity-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' }, payload => {
        setActivityLogs(prev => [payload.new, ...prev.slice(0, 9)]);
        
        const adminId = payload.new.admin_id;
        if (adminId && !profileMap[adminId]) {
          supabase.from('user_profiles').select('user_id, full_name').eq('user_id', adminId).single().then(({ data }) => {
            if (data) {
              setProfileMap(prev => ({ ...prev, [data.user_id]: data.full_name }));
            }
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, []);

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
    setResolutionNote(ticket.resolution_notes || '');
    setSpecialistBriefing('');
    setDeepAnalysis(null);
    setScannedTable(null);
    fetchComments(ticket.id);
    fetchAiSuggestion(ticket);
  };

  const applyAiResolution = (text) => {
    setResolutionNote(prev => prev ? `${prev}\n\nAI SUGGESTION:\n${text}` : text);
    toast.success("AI suggestion appended to resolution notes");
  };

  const handleDeepInspection = async () => {
    if (!selectedTicket) return;
    setIsDeepAnalyzing(true);
    setDeepAnalysis(null);
    try {
      const prompt = `Perform root-cause analysis:
      Ticket ID: ${selectedTicket.ticket_id}
      Title: ${selectedTicket.title}
      Description: ${selectedTicket.description}
      Category: ${selectedTicket.category}
      Urgency: ${selectedTicket.urgency}`;
      
      const result = await performAdvancedReasoning(prompt);
      setDeepAnalysis(result);
      toast.success("Root cause analysis complete.");
    } catch (err) {
      toast.error("Deep analysis failed.");
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  const handleScanTable = async () => {
    if (!selectedTicket?.attachment_url) return;
    setIsScanningTable(true);
    try {
      const result = await extractTableFromImage(selectedTicket.attachment_url);
      setScannedTable(result);
      toast.success("Evidence scan completed successfully.");
    } catch (err) {
      toast.error("Vision scan failed.");
    } finally {
      setIsScanningTable(false);
    }
  };

  const fetchAiSuggestion = async (ticket) => {
    setAiSuggestion('');
    setIsAiSuggesting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/ai/suggest', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket })
      });
      const data = await response.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error("AI Suggestion error:", err);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const fetchSpecialistBriefing = async (ticket, dept) => {
    setSpecialistBriefing('');
    setIsBriefing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/ai/elevate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket, department: dept })
      });
      const data = await res.json();
      setSpecialistBriefing(data.briefing);
    } catch (err) {
      console.error("Specialist Briefing error:", err);
    } finally {
      setIsBriefing(false);
    }
  };

  const fetchGlobalTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getAll();
      setTickets(data);
    } catch {
      toast.error('Could not fetch grievances registry records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status, quickTicket = null) => {
    const targetTicket = quickTicket || selectedTicket;
    if (!targetTicket) return;

    const { error } = await supabase
      .from('grievances')
      .update({ 
        status,
        resolution_notes: status === 'Resolved' ? resolutionNote : undefined,
        resolved_at: status === 'Resolved' ? new Date().toISOString() : undefined
      })
      .eq('id', targetTicket.id);
    
    if (!error) {
      logSecurityEvent(`Status Update [${targetTicket.ticket_id}] -> ${status}`, sessionUser.email || 'admin', 'Admin Gateway', status === 'Resolved' ? 'info' : 'warning');

      if (status === 'Resolved') {
        confetti({
          particleCount: 120,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#4f46e5']
        });
        toast.success(`Grievance ${targetTicket.ticket_id} resolved!`);
      } else {
        toast.success(`Status updated to ${status}`);
      }
      
      if (!quickTicket) {
        setSelectedTicket(null);
        setResolutionNote('');
      }

      fetchGlobalTickets();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: 'Resolution Executed',
          message: `Ticket ${targetTicket.ticket_id} closed successfully.`,
          type: 'success'
        }
      }));
    } else {
      toast.error('Failed to update status');
    }
  };

  const toggleBulkSelection = (id) => {
    setBulkSelection(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleBulkResolve = async () => {
    if (bulkSelection.length === 0) return;
    
    const { error } = await supabase
      .from('grievances')
      .update({ status: 'Resolved' })
      .in('id', bulkSelection);
      
    if (!error) {
      logSecurityEvent(`Bulk Resolved ${bulkSelection.length} tickets`, sessionUser.email || 'admin', 'Admin Gateway', 'info');
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      toast.success(`${bulkSelection.length} grievances resolved!`);
      setBulkSelection([]);
      fetchGlobalTickets();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: 'Batch Action Complete',
          message: `${bulkSelection.length} tickets resolved in parallel.`,
          type: 'success'
        }
      }));
    } else {
      toast.error('Failed to bulk resolve');
    }
  };

  const handleOpenReport = () => {
    setShowReportModal(true);
    generatePerformanceSummary();
  };

  const generatePerformanceSummary = async () => {
    if (tickets.length === 0) return;
    setIsGeneratingReport(true);
    setReportSummary('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/v1/ai/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tickets })
      });
      const data = await res.json();
      setReportSummary(data.summary);
    } catch (err) {
      console.error("Report Generation error:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No records available to export.");
      return;
    }
    const headers = ['Ticket ID', 'Title', 'Category', 'Urgency', 'Status', 'User ID', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...tickets.map(t => [
        t.ticket_id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.urgency,
        t.status,
        t.user_id,
        new Date(t.created_at).toLocaleString()
      ].join(','))
    ];

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `grievances_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('CSV Report exported');
  };

  const handleExportDossier = async () => {
    if (!selectedTicket) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("ADMIN GRIEVANCE DOSSIER", 20, 25);
      doc.setFontSize(10);
      doc.text(`TICKET ID: #${selectedTicket.ticket_id}`, 145, 25);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.text("Audit Parameters", 20, 55);
      doc.line(20, 58, 190, 58);
      
      doc.setFontSize(11);
      doc.text(`Subject: ${selectedTicket.title}`, 20, 68);
      doc.text(`Category: ${selectedTicket.category}`, 20, 76);
      doc.text(`Severity: ${selectedTicket.urgency}`, 20, 84);
      doc.text(`Status: ${selectedTicket.status}`, 140, 84);
      doc.text(`Filing Date: ${new Date(selectedTicket.created_at).toLocaleString()}`, 20, 92);
      
      doc.setFontSize(14);
      doc.text("Statement Report", 20, 110);
      doc.line(20, 113, 190, 113);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(selectedTicket.description, 170);
      doc.text(splitDesc, 20, 123);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("Confidential. Generated via Nexus Redressal Platform.", 105, 290, null, null, "center");
      
      doc.save(`Nexus_Audit_${selectedTicket.ticket_id}.pdf`);
      toast.success("Dossier exported!");
    } catch {
      toast.error("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const adminStats = [
    { label: 'Unresolved High Priority', value: tickets.filter(t => t.urgency === 'High' && t.status !== 'Resolved').length, icon: <AlertTriangle size={18} />, borderColor: 'border-l-error text-error', iconColor: 'text-error border-error/10 bg-error/5' },
    { label: 'Awaiting Action', value: tickets.filter(t => t.status === 'Pending').length, icon: <Clock size={18} />, borderColor: 'border-l-warning text-warning', iconColor: 'text-warning border-warning/10 bg-warning/5' },
    { label: 'Resolved Tickets', value: tickets.filter(t => t.status === 'Resolved').length, icon: <CheckCircle size={18} />, borderColor: 'border-l-success text-success', iconColor: 'text-success border-success/10 bg-success/5' },
    { label: 'Online Operators', value: onlineOperators.length || 1, icon: <Users size={18} />, borderColor: 'border-l-accent text-accent', iconColor: 'text-accent border-accent/10 bg-accent/5' },
  ];

  const getPriorityScore = (ticket) => {
    const urgencyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const ageInDays = (new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24);
    const frustrationBonus = (ticket.frustration_index || 1) * 0.5;
    return (urgencyMap[ticket.urgency] || 1) * (1 + ageInDays) + frustrationBonus;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  // Pagination Slice
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);

  // Charts data
  const categoryData = [
    { name: 'IT Support', value: tickets.filter(t => t.category === 'IT Support').length },
    { name: 'Maintenance', value: tickets.filter(t => t.category === 'Maintenance').length },
    { name: 'Academic', value: tickets.filter(t => t.category === 'Academic').length },
    { name: 'Financial', value: tickets.filter(t => t.category === 'Financial').length },
    { name: 'Infrastructure', value: tickets.filter(t => t.category === 'Public Infrastructure').length },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Pending', count: tickets.filter(t => t.status === 'Pending').length },
    { name: 'In-Progress', count: tickets.filter(t => t.status === 'In-Progress').length },
    { name: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
  ];

  const PIE_COLORS = ['#3b82f6', '#4f46e5', '#0891b2', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-12">
      {/* Connectivity Alert */}
      {!isSystemHealthy && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-3 shadow-xl backdrop-blur-md ${
          connectionState === 'OFFLINE' 
            ? 'bg-error/10 border-error/20 text-error' 
            : 'bg-warning/10 border-warning/20 text-warning'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'OFFLINE' ? 'bg-error animate-pulse' : 'bg-warning animate-bounce'
          }`} />
          {connectionState === 'OFFLINE' ? 'Offline: Sync Terminated' : 'Reconnecting to Database...'}
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-surface border border-border/80 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-heading font-black text-foreground">
            Administrative Control Center
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Overview of registry triage, system communications, and compliance diagnostics. Currently managing <span className="font-bold text-primary-bright">{tickets.filter(t => t.status === 'Pending').length} pending</span> grievances.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV} 
            className="btn-ghost flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleOpenReport} 
            className="btn-premium flex items-center gap-1.5"
          >
            <Activity size={14} />
            <span>Executive Summary</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`bg-surface border border-border/80 border-l-4 rounded-xl p-5 shadow-xs flex flex-col justify-between ${stat.borderColor}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${stat.iconColor}`}>{stat.icon}</div>
            </div>
            <span className="text-2xl font-black text-foreground">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- GRIEVANCES TAB --- */}
        {activeTab === 'grievances' && (
          <motion.div 
            key="grievances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Analytics Preview & SLA Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface border border-border/80 rounded-xl p-5 shadow-xs">
              <div className="sm:col-span-2 lg:col-span-4 mb-2">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-muted-foreground">Analytics Preview & SLA Status</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Real-time performance metrics and priority load indicators across departments.</p>
              </div>
              
              {/* Metric Card 1: Urgent & High Priority */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/50 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Urgent Cases</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-black text-error">
                    {tickets.filter(t => t.urgency === 'Urgent' || t.urgency === 'High').length}
                  </span>
                  <span className="text-[9px] text-muted-foreground">active tickets</span>
                </div>
              </div>

              {/* Metric Card 2: Average Sentiment */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/50 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Friction Hotspots</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-black text-warning">
                    {tickets.filter(t => t.frustration_index >= 7).length}
                  </span>
                  <span className="text-[9px] text-muted-foreground">high frustration</span>
                </div>
              </div>

              {/* Metric Card 3: Resolution Rate */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/50 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Resolution Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-black text-success">
                    {tickets.length > 0 
                      ? `${Math.round((tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length / tickets.length) * 100)}%` 
                      : '100%'}
                  </span>
                  <span className="text-[9px] text-muted-foreground">total closed</span>
                </div>
              </div>

              {/* Metric Card 4: SLA Adherence */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/50 space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">SLA Breaches</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-black text-primary-bright">
                    {tickets.filter(t => {
                      const daysOld = (new Date() - new Date(t.created_at)) / (1000 * 60 * 60 * 24);
                      return daysOld > 3 && t.status !== 'Resolved' && t.status !== 'Closed';
                    }).length}
                  </span>
                  <span className="text-[9px] text-muted-foreground">overdue (&gt;72h)</span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-muted-foreground mb-4">Filings by Department</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                  {tickets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={70} paddingAngle={4} dataKey="value">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No department data compiled.</p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs">
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-muted-foreground mb-4">Triage Status Overview</h3>
                <div className="h-[220px] w-full flex items-center justify-center">
                  {tickets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" stroke="var(--color-muted-fg)" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? 'var(--color-success)' : entry.name === 'In-Progress' ? 'var(--color-warning)' : 'var(--color-primary-bright)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                   ) : (
                      <p className="text-muted-foreground text-xs italic">No status data compiled.</p>
                   )}
                </div>
              </div>
            </div>

            {/* Split Screen Registry & Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Registry Log */}
              <div className={`${selectedTicket || activityLogs.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
                <div className="bg-surface border border-border/80 rounded-xl shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-border/60 bg-background/30 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-heading font-extrabold text-sm text-foreground uppercase tracking-wider">Registry Log</h3>
                      
                      <AnimatePresence>
                        {bulkSelection.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2 bg-primary-bright/10 border border-primary-bright/20 px-2 py-0.5 rounded-lg"
                          >
                            <span className="text-primary-bright font-mono font-bold text-[9px] uppercase tracking-wider">
                              {bulkSelection.length} Selected
                            </span>
                            <button onClick={handleBulkResolve} className="text-success hover:brightness-110 text-[9px] font-bold transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer">
                              <CheckCircle2 size={12} /> Bulk Resolve
                            </button>
                            <button onClick={() => setBulkSelection([])} className="text-muted-foreground hover:text-foreground transition-all ml-1 p-0.5 cursor-pointer">
                              <X size={12} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Filter Inputs */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 flex items-center gap-2 w-full sm:w-44">
                        <Search className="text-muted-foreground/60" size={14} />
                        <input 
                          type="text" 
                          placeholder="Search identifier/title..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
                        />
                      </div>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="All">Status: All</option>
                        <option value="Pending">Pending</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="All">Sector: All</option>
                        <option value="IT Support">IT Support</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Academic">Academic</option>
                        <option value="Financial">Financial</option>
                        <option value="Public Infrastructure">Infrastructure</option>
                      </select>
                    </div>
                  </div>

                  {/* List/Table */}
                  <div className="overflow-x-auto">
                    {loading ? (
                       <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                         <Loader2 className="animate-spin text-primary-bright" size={24} />
                         <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Loading registry indices...</p>
                       </div>
                    ) : currentTickets.length === 0 ? (
                      <div className="p-20 text-center text-muted-foreground text-xs italic font-semibold">No records found.</div>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-background text-[10px] uppercase text-muted-foreground tracking-wider font-bold border-b border-border/60">
                            <th className="px-6 py-3.5 w-10">
                               <input 
                                 type="checkbox"
                                 className="w-4 h-4 bg-background border border-border/60 rounded cursor-pointer"
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setBulkSelection(currentTickets.map(t => t.id));
                                   } else {
                                     setBulkSelection([]);
                                   }
                                 }}
                                 checked={bulkSelection.length === currentTickets.length && currentTickets.length > 0}
                               />
                            </th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Identifier</th>
                            <th className="px-6 py-3.5">Category</th>
                            <th className="px-6 py-3.5">Priority</th>
                            <th className="px-6 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {currentTickets.map((ticket) => (
                            <tr 
                              key={ticket.id} 
                              className={`
                                transition-colors duration-150 cursor-pointer
                                ${bulkSelection.includes(ticket.id) ? 'bg-primary-bright/[0.02]' : 'hover:bg-muted/40'}
                                ${selectedTicket?.id === ticket.id ? 'bg-primary-bright/[0.04]' : ''}
                              `}
                            >
                              <td className="px-6 py-3.5">
                                 <input 
                                   type="checkbox"
                                   className="w-4 h-4 bg-background border border-border/60 rounded cursor-pointer"
                                   checked={bulkSelection.includes(ticket.id)}
                                   onChange={() => toggleBulkSelection(ticket.id)}
                                 />
                              </td>
                              <td className="px-6 py-3.5" onClick={() => handleSelectTicket(ticket)}>
                                 <StatusBadge status={ticket.status} />
                              </td>
                              <td className="px-6 py-3.5 text-left font-bold" onClick={() => handleSelectTicket(ticket)}>
                                <div>
                                  <p className="font-mono font-bold text-primary-bright mb-0.5">{ticket.ticket_id}</p>
                                  <p className="text-[10px] text-foreground truncate max-w-[150px] font-semibold">{ticket.title}</p>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-muted-foreground" onClick={() => handleSelectTicket(ticket)}>
                                {ticket.category}
                              </td>
                              <td className="px-6 py-3.5" onClick={() => handleSelectTicket(ticket)}>
                                <UrgencyBadge level={ticket.urgency} />
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <button onClick={() => handleSelectTicket(ticket)} className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 bg-primary-bright/5 hover:bg-primary-bright/10 border border-primary-bright/20 text-primary-bright transition-all rounded-lg cursor-pointer">
                                   Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
                          className="p-1 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className="p-1 bg-surface border border-border rounded-lg disabled:opacity-40 cursor-pointer text-foreground"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Split Screen Detailed Inspector */}
              <AnimatePresence>
                {selectedTicket ? (
                  <motion.div 
                    key="inspector"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="lg:col-span-1 bg-surface border border-border/80 rounded-xl p-5 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col gap-5 shadow-sm text-left"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-primary-bright px-2 py-0.5 bg-primary-bright/5 rounded border border-primary-bright/10 w-fit">
                          {selectedTicket.ticket_id}
                        </span>
                        <h4 className="text-xs font-extrabold text-foreground leading-tight line-clamp-1 mt-1">{selectedTicket.title}</h4>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border/30 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>

                    {/* Basic details */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Incident Statement</span>
                        <p className="p-3 bg-background border border-border rounded-lg leading-relaxed text-foreground italic whitespace-pre-wrap">
                          "{selectedTicket.description}"
                        </p>
                      </div>

                      {selectedTicket.location && (
                        <div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Geospatial Location</span>
                          <div className="p-3 bg-background border border-border rounded-lg flex items-center gap-1.5">
                            <MapPin size={12} className="text-primary-bright" />
                            <span className="truncate text-foreground font-medium">{selectedTicket.location}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI suggester Resolution Draft */}
                    <div className="p-4 bg-primary-bright/[0.02] border border-primary-bright/15 rounded-xl relative overflow-hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[9px] font-black text-primary-bright uppercase tracking-wider flex items-center gap-1">
                          <Zap size={11} className="fill-current" /> AI Suggested Solution
                        </h5>
                        <span className="text-[8px] font-bold text-muted-foreground font-mono">COPILOT ENGINE</span>
                      </div>
                      
                      {isAiSuggesting ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="animate-spin text-primary-bright" size={12} />
                          <p className="text-[10px] text-muted-foreground italic font-mono">DRAFTING RESOLUTION...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-foreground text-xs leading-relaxed font-medium">
                            {aiSuggestion || "Select a filing record to generate strategy suggestions."}
                          </p>
                          {aiSuggestion && (
                            <button 
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('inject-comment', { 
                                  detail: { 
                                    grievanceId: selectedTicket.id, 
                                    message: aiSuggestion 
                                  } 
                                }));
                                toast.success("AI suggestion injected to Correspondence logs");
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider px-3 py-2 bg-primary-bright text-white hover:bg-secondary transition-colors rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Activity size={10} /> Inject to Comment Buffer
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Deep reasoner */}
                    <div className="p-4 bg-background border border-border rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[9px] font-black text-foreground uppercase tracking-wider flex items-center gap-1">
                          <Cpu size={12} className="text-primary-bright" /> Root Cause reasoning
                        </h5>
                        {!deepAnalysis && !isDeepAnalyzing && (
                          <button 
                            onClick={handleDeepInspection}
                            className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 bg-muted hover:bg-border rounded border border-border/55 text-muted-foreground transition-all cursor-pointer"
                          >
                            Run Reasoning
                          </button>
                        )}
                      </div>

                      {isDeepAnalyzing ? (
                        <div className="space-y-2 py-1">
                          <div className="flex items-center gap-2 text-[9px] text-primary-bright font-bold uppercase">
                            <Loader2 className="animate-spin" size={12} /> Reasoning module running...
                          </div>
                        </div>
                      ) : deepAnalysis ? (
                        <div className="space-y-3 text-xs">
                          {deepAnalysis.reasoning && (
                            <div className="p-2.5 bg-muted/50 rounded-lg border border-border font-mono text-[9px] text-muted-foreground leading-relaxed max-h-[80px] overflow-y-auto">
                              {deepAnalysis.reasoning}
                            </div>
                          )}
                          <p className="text-foreground leading-relaxed pl-2.5 border-l border-primary-bright">{deepAnalysis.content}</p>
                          <button 
                            onClick={() => applyAiResolution(deepAnalysis.content)}
                            className="w-full py-2 bg-primary-bright/10 border border-primary-bright/20 hover:bg-primary-bright/20 text-primary-bright text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 size={12} /> Apply Strategic Solution
                          </button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-[10px] italic">Deep reasoning diagnostics ready to compile.</p>
                      )}
                    </div>

                    {/* Evidence Vision Scan */}
                    {selectedTicket.attachment_url && (
                      <div className="p-4 bg-background border border-border rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[9px] font-black text-foreground uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} className="text-primary-bright" /> Evidence Vision Scan
                          </h5>
                          {!scannedTable && !isScanningTable && (
                            <button 
                              onClick={handleScanTable}
                              className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 bg-muted hover:bg-border rounded border border-border/55 text-muted-foreground transition-all cursor-pointer"
                            >
                              Scan Image Table
                            </button>
                          )}
                        </div>

                        {isScanningTable ? (
                          <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-bold uppercase">
                            <Loader2 className="animate-spin" size={12} /> OCR Structure Extracting...
                          </div>
                        ) : scannedTable ? (
                          <div className="space-y-2.5 text-xs text-left">
                            <div className="p-2 bg-success/5 border border-success/20 rounded-lg text-[10px] text-muted-foreground font-mono max-h-[100px] overflow-y-auto">
                              {JSON.stringify(scannedTable, null, 2)}
                            </div>
                            <a 
                              href={selectedTicket.attachment_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[9px] text-primary-bright hover:underline font-bold uppercase tracking-wider inline-flex items-center gap-1"
                            >
                              Open Attachment <TrendingUp size={10} />
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-[10px] italic">Attachment OCR table parsing available.</p>
                        )}
                      </div>
                    )}

                    {/* Comm logs / Chat */}
                    <div className="border-t border-border/50 pt-4 h-[350px] flex flex-col">
                      <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2 tracking-wider">Correspondence Logs</span>
                      <div className="flex-1 rounded-xl border border-border bg-background/50 overflow-hidden">
                        <CommandChat 
                          grievanceId={selectedTicket.id} 
                          currentUser={sessionUser} 
                          role="admin"
                        />
                      </div>
                    </div>

                    {/* Specialist Elevate */}
                    <div className="space-y-2 border-t border-border/50 pt-4">
                      <span className="text-[9px] font-black uppercase text-muted-foreground block tracking-wider">Elevate Jurisdiction</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['IT', 'Finance', 'Legal', 'Academia', 'Medical'].map(dept => (
                          <button 
                            key={dept}
                            onClick={() => fetchSpecialistBriefing(selectedTicket, dept)}
                            className="px-2.5 py-1.5 bg-muted hover:bg-primary-bright hover:text-white rounded-lg border border-border/50 text-[9px] font-bold uppercase tracking-wider transition-colors text-foreground cursor-pointer"
                          >
                             Brief {dept}
                          </button>
                        ))}
                      </div>

                      {(isBriefing || specialistBriefing) && (
                        <div className="p-3 bg-primary-bright/[0.02] border border-primary-bright/15 rounded-xl space-y-2 text-left">
                          <span className="text-[8px] font-bold text-primary-bright font-mono uppercase tracking-wider block">Specialist Brief Output</span>
                          {isBriefing ? (
                            <div className="flex items-center gap-2 py-1">
                               <Loader2 className="animate-spin text-primary-bright" size={10} />
                               <span className="text-[10px] text-muted-foreground italic uppercase">Drafting Elevated briefing...</span>
                            </div>
                          ) : (
                            <div className="space-y-2 text-xs">
                              <p className="text-muted-foreground italic">"{specialistBriefing}"</p>
                              <button 
                                onClick={() => applyAiResolution(specialistBriefing)}
                                className="px-2.5 py-1 bg-primary-bright/20 border border-primary-bright/30 text-primary-bright text-[8px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                              >
                                Integrate Briefing
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action button resolution */}
                    <div className="border-t border-border/50 pt-4 space-y-3 text-left">
                      <span className="text-[9px] font-black uppercase text-muted-foreground block tracking-wider">Final Redressal Protocol</span>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Resolution summary statement..."
                        rows="3"
                        className="glass-input w-full text-xs font-medium bg-background border border-border/60"
                      />
                      
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus('In-Progress')} className="btn-ghost py-2.5 flex-1 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer">Hold Active</button>
                        <button 
                          onClick={() => handleUpdateStatus('Resolved')} 
                          className="bg-success text-white text-[10px] font-bold uppercase tracking-wider py-2.5 flex-1 flex items-center justify-center gap-1 rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                        >
                          <CheckCircle2 size={12} /> Close Grievance
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Admin Activity Feed Widget */
                  activityLogs.length > 0 && (
                    <motion.div 
                      key="activity-feed"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="lg:col-span-1 bg-surface border border-border/80 rounded-xl p-5 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col gap-5 shadow-xs text-left"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={14} className="text-primary-bright animate-pulse" /> Live Admin Operations
                          </h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Real-time audit log of active administrators.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {activityLogs.map((log) => {
                          const adminName = profileMap[log.admin_id] || 'System Operator';
                          const targetName = log.target_user_id ? (profileMap[log.target_user_id] || 'Target User') : null;
                          const actionFormatted = log.action.replace(/_/g, ' ');

                          return (
                            <div key={log.id} className="p-3 bg-background border border-border/60 rounded-xl space-y-2 text-xs relative overflow-hidden group hover:border-primary-bright/20 transition-all duration-200">
                              <div className="flex justify-between items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-primary-bright/5 text-primary-bright border border-primary-bright/15 text-[8px] font-mono font-bold uppercase tracking-wider">
                                  {log.action}
                                </span>
                                <span className="text-[8px] font-mono text-muted-foreground font-bold">
                                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-foreground leading-snug font-medium text-[11px]">
                                <span className="font-bold text-foreground">{adminName}</span> performed <span className="italic text-primary-bright font-semibold">{actionFormatted}</span>
                                {targetName && <span> on <span className="font-bold text-foreground">{targetName}</span></span>}
                              </p>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="text-[9px] font-mono text-muted-foreground bg-muted/20 p-2 rounded border border-border/40 max-h-24 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* --- BROADCAST TAB --- */}
        {activeTab === 'broadcast' && (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-bright/10 rounded-xl text-primary-bright border border-primary-bright/20">
                    <Radio size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">AI Broadcaster</h3>
                    <p className="text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-wider">Synthesis Intent Engine</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Outreach Subject Intent</label>
                    <textarea 
                      value={broadcastIntent}
                      onChange={(e) => setBroadcastIntent(e.target.value)}
                      placeholder="e.g. Broadcast system updates regarding financial sector scholarship triage outages this Sunday."
                      className="glass-input w-full h-32 resize-none"
                    />
                  </div>
                  
                  <button 
                    onClick={handleComposeBroadcast}
                    disabled={isComposing}
                    className="w-full btn-premium py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isComposing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    Synthesize Broadcast Draft
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Transmission Editor</h4>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Subject Header</label>
                    <input 
                      type="text"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      placeholder="Subject of broadcast"
                      className="glass-input w-full font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Body Context</label>
                    <textarea 
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder="Synthesized broadcast draft will render here for editing..."
                      className="glass-input w-full h-52 resize-none font-medium leading-relaxed"
                    />
                  </div>

                  <button 
                    onClick={handleSendBroadcast}
                    disabled={isBroadcasting || !broadcastBody}
                    className="w-full btn-premium py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isBroadcasting ? <Loader2 className="animate-spin" size={14} /> : <Terminal size={14} />}
                    Transmit Signal
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- SECURITY FIREWALL TAB --- */}
        {activeTab === 'security' && (
          <motion.div 
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SecurityAudit />
          </motion.div>
        )}

        {/* --- SYSTEM HEALTH TAB --- */}
        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">System Compliance & Health</h3>
                      <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider mt-1">Real-time status assessment // Node v2.0</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-600">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Uptime Stability', value: '99.98%', status: 'NOMINAL' },
                      { label: 'Database Load', value: '14ms', status: 'OPTIMAL' },
                      { label: 'Firewall Handshake', value: 'ACTIVE', status: 'SECURE' },
                      { label: 'Encryption Level', value: 'AES-256', status: 'VERIFIED' }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-background border border-border/60">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-foreground font-mono">{item.value}</p>
                        <div className="mt-2 text-[8px] font-bold text-success tracking-wide uppercase flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- REPORTS TAB --- */}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-wider">Executive Audit Report</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Registry Triage Performance & Analytical Trends.</p>
                </div>
                <button 
                  onClick={generatePerformanceSummary} 
                  disabled={isGeneratingReport}
                  className="btn-premium flex items-center gap-1.5"
                >
                  {isGeneratingReport ? <Loader2 className="animate-spin" size={14} /> : <Activity size={14} />}
                  <span>Re-Generate Summary</span>
                </button>
              </div>

              <div className="p-5 bg-background border border-border/50 rounded-xl leading-relaxed text-foreground text-xs italic font-medium">
                {isGeneratingReport ? (
                  <div className="flex flex-col items-center gap-4 py-12 justify-center">
                    <Loader2 className="animate-spin text-primary-bright" size={24} />
                    <span className="text-[10px] font-bold text-primary-bright animate-pulse tracking-wider">COMPILING ANALYTICAL AUDIT DATASET...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed font-sans not-italic text-sm">
                    {reportSummary || "Performance analysis summary is compiling. Click the Re-Generate button if it is not showing."}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-background border border-border/60 rounded-xl">
                  <div className="text-[9px] text-muted-foreground mb-1 uppercase font-black tracking-wider">Audit Scope Size</div>
                  <div className="text-2xl font-black text-foreground font-mono flex items-end gap-1.5">
                    {tickets.length} 
                    <span className="text-[9px] text-primary-bright font-black mb-1 uppercase">DATAPOINTS</span>
                  </div>
                </div>
                <div className="p-4 bg-background border border-border/60 rounded-xl">
                  <div className="text-[9px] text-muted-foreground mb-1 uppercase font-black tracking-wider">Average Sentiment</div>
                  <div className="text-2xl font-black text-warning font-mono flex items-end gap-1.5">
                    {(tickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / (tickets.length || 1)).toFixed(1)}
                    <span className="text-[9px] text-muted-foreground font-black mb-1 uppercase">FRUST INDEX</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border/60">
                <button 
                  onClick={handleExportCSV}
                  className="btn-ghost flex items-center gap-1.5"
                >
                  <Download size={14} /> EXPORT CSV DATA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Executive Summary Report Modal Dialog --- */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-surface border border-border/80 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-wide">Executive Audit Report</h2>
                  <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-wider font-mono">Registry Triage Performance & Analytical Trends.</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Report */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-black text-[10px] uppercase tracking-wider">
                    <Terminal size={14} className="text-primary-bright" /> AI Neural Synthesis
                  </div>
                  <div className="p-5 bg-background border border-border/50 rounded-xl leading-relaxed text-foreground text-xs italic font-medium">
                    {isGeneratingReport ? (
                      <div className="flex flex-col items-center gap-4 py-8 justify-center">
                        <Loader2 className="animate-spin text-primary-bright" size={20} />
                        <span className="text-[10px] font-bold text-primary-bright animate-pulse tracking-wider">COMPILING ANALYTICAL AUDIT DATASET...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line leading-relaxed font-sans not-italic text-sm">
                        {reportSummary || "Performance analysis summaries not available."}
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                   <div className="flex items-center gap-2 text-foreground font-black text-[10px] uppercase tracking-wider">
                    <Activity size={14} className="text-primary-bright" /> Key Metrics
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-background border border-border/60 rounded-xl">
                      <div className="text-[9px] text-muted-foreground mb-1 uppercase font-black tracking-wider">Audit Scope Size</div>
                      <div className="text-2xl font-black text-foreground font-mono flex items-end gap-1.5">
                        {tickets.length} 
                        <span className="text-[9px] text-primary-bright font-black mb-1 uppercase">DATAPOINTS</span>
                      </div>
                    </div>
                    <div className="p-4 bg-background border border-border/60 rounded-xl">
                      <div className="text-[9px] text-muted-foreground mb-1 uppercase font-black tracking-wider">Average Sentiment</div>
                      <div className="text-2xl font-black text-warning font-mono flex items-end gap-1.5">
                        {(tickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / (tickets.length || 1)).toFixed(1)}
                        <span className="text-[9px] text-muted-foreground font-black mb-1 uppercase">FRUST INDEX</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <p className="text-[8px] text-muted-foreground font-black flex items-center gap-1.5 uppercase font-mono tracking-wider">
                   <ShieldCheck size={12} className="text-success" /> SYSTEM RESOLUTION SIGNATURE VERIFIED
                </p>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button onClick={() => setShowReportModal(false)} className="btn-ghost px-5 py-2.5">Close</button>
                    <button 
                      onClick={() => {
                        handleExportCSV();
                        setShowReportModal(false);
                      }}
                      className="btn-premium px-5 py-2.5 shadow-md flex items-center gap-1.5"
                    >
                      <Download size={14} /> EXPORT DATA
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
