import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Search, 
  MoreVertical, X, CheckCircle2, Download, Shield, ShieldAlert, Lock, 
  Zap, Sparkles, ShieldCheck 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis } from 'recharts';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { RainbowButton } from '../components/ui/RainbowButton';
import { SecurityAudit } from '../components/ui/SecurityAudit';
import { supabase } from '../lib/supabase';
import { grievanceService } from '../api/grievanceService';
import StatusBadge from '../components/ui/StatusBadge';
import UrgencyBadge from '../components/ui/UrgencyBadge';

export const AdminDashboard = ({ sessionUser, userProfile }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkSelection, setBulkSelection] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Comments logic
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  
  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [specialistBriefing, setSpecialistBriefing] = useState('');
  const [isBriefing, setIsBriefing] = useState(false);
  const searchParams = new URL(window.location.href).searchParams;
  const initialTab = searchParams.get('tab') === 'security' ? 'security' : 'insights';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'security') setActiveTab('security');
    if (currentTab === 'insights' || currentTab === 'overview') setActiveTab('insights');
  }, [window.location.search]);


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
      .channel('admin-ticket-comments')
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
    setSpecialistBriefing('');
    fetchComments(ticket.id);
    fetchAiSuggestion(ticket);
  };

  const fetchAiSuggestion = async (ticket) => {
    setAiSuggestion('');
    setIsAiSuggesting(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      });
      const data = await response.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error("AI Suggestion Error:", err);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const fetchSpecialistBriefing = async (ticket, dept) => {
    setSpecialistBriefing('');
    setIsBriefing(true);
    try {
      const res = await fetch('/api/ai/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket, department: dept })
      });
      const data = await res.json();
      setSpecialistBriefing(data.briefing);
    } catch (err) {
      console.error("Specialist Briefing Error:", err);
    } finally {
      setIsBriefing(false);
    }
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

  const fetchGlobalTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getAll();
      setTickets(data);
    } catch {
      toast.error('Could not fetch global grievances');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    const { error } = await supabase
      .from('grievances')
      .update({ status, admin_comment: resolutionNote })
      .eq('id', selectedTicket.id);
    
    if (!error) {
      if (status === 'Resolved') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#ec4899']
        });
        toast.success(`Ticket ${selectedTicket.ticket_id} resolved!`);
      } else {
        toast.success(`Ticket marked as ${status}`);
      }
      setSelectedTicket(null);
      setResolutionNote('');
      fetchGlobalTickets();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: 'Resolution Protocol Executed',
          message: `Ticket ${selectedTicket.ticket_id} matches criteria: RESOLVED.`,
          type: 'success'
        }
      }));
    } else {
      toast.error('Failed to update ticket status');
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
      confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      toast.success(`${bulkSelection.length} tickets resolved successfully!`);
      setBulkSelection([]);
      fetchGlobalTickets();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: {
          title: 'Batch Resolution Completed',
          message: `${bulkSelection.length} tickets moved to RESOLVED status.`,
          type: 'success'
        }
      }));
    } else {
      toast.error('Failed to bulk resolve tickets');
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
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets })
      });
      const data = await res.json();
      setReportSummary(data.summary);
    } catch (err) {
      console.error("Report Generation Error:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (tickets.length === 0) {
      toast.error("No tickets to export");
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
    a.setAttribute('download', `grievances_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('CSV Report downloaded exported');
  };

  const adminStats = [
    { label: 'High Priority', value: tickets.filter(t => t.urgency === 'High' && t.status !== 'Resolved').length, icon: <AlertTriangle />, color: 'text-error' },
    { label: 'Pending Action', value: tickets.filter(t => t.status === 'Pending').length, icon: <Clock />, color: 'text-warning' },
    { label: 'Resolved (Total)', value: tickets.filter(t => t.status === 'Resolved').length, icon: <CheckCircle />, color: 'text-success' },
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

  // Analytics Data
  const categoryData = [
    { name: 'IT Support', value: tickets.filter(t => t.category === 'IT Support').length },
    { name: 'Maintenance', value: tickets.filter(t => t.category === 'Maintenance').length },
    { name: 'Academic', value: tickets.filter(t => t.category === 'Academic').length },
    { name: 'Financial', value: tickets.filter(t => t.category === 'Financial').length },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Pending', count: tickets.filter(t => t.status === 'Pending').length },
    { name: 'In-Progress', count: tickets.filter(t => t.status === 'In-Progress').length },
    { name: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
  ];

  const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-['Outfit'] text-white">Administration Control</h2>
          <p className="text-slate-400">Review and resolve organization-wide grievances.</p>
        </div>
        <RainbowButton 
          onClick={handleOpenReport} 
          className="!py-3 !px-8 !text-xs shadow-2xl shadow-primary/30"
        >
          <TrendingUp size={16} />
          Executive Audit Report
        </RainbowButton>
      </div>

      <AnimatePresence>
        {bulkSelection.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-600/90 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 shadow-xl shadow-indigo-500/20 border border-indigo-400/30"
          >
             <span className="text-white font-bold text-sm tracking-widest uppercase">{bulkSelection.length} Selected</span>
             <div className="w-px h-6 bg-white/20"></div>
             <button onClick={handleBulkResolve} className="text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors flex items-center gap-2 uppercase tracking-wider">
               <CheckCircle2 size={14} /> Resolve All
             </button>
             <button onClick={() => setBulkSelection([])} className="text-indigo-200 hover:text-white transition-colors ml-2">
               <X size={16} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-2xl w-fit mb-8 relative z-30">
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
        >
          <TrendingUp size={14} /> Global Insights
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-error text-white shadow-lg shadow-error/20' : 'text-slate-500 hover:text-white'}`}
        >
          <ShieldAlert size={14} /> Security Audit
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' ? (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {adminStats.map((stat, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-8 group border-white/[0.03]"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-[20px] bg-white/[0.03] ${stat.color} group-hover:bg-white/[0.08] transition-colors`}>{stat.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</span>
                  </div>
                  <h3 className="text-4xl font-black text-white">{stat.value}</h3>
                </motion.div>
              ))}
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-lg text-white mb-6">Distribution by Category</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                  {tickets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-500 text-sm">No data available for charts.</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold text-lg text-white mb-6">Resolution Velocity</h3>
                <div className="h-[250px] w-full flex items-center justify-center">
                  {tickets.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#ffffff20', borderRadius: '12px' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : entry.name === 'In-Progress' ? '#f59e0b' : '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                   ) : (
                      <p className="text-slate-500 text-sm">No data available for charts.</p>
                   )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8"
          >
            <SecurityAudit />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card" id="grievances-table">
        <div className="p-6 border-b border-white/10 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <h3 className="font-bold text-lg text-white">All Grievances</h3>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID or Subject..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 py-2.5 w-full text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input py-2.5 bg-[#1a1f2e] text-sm text-slate-300"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input py-2.5 bg-[#1a1f2e] text-sm text-slate-300"
              >
                <option value="All">All Categories</option>
                <option value="IT Support">IT Support</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Academic">Academic</option>
                <option value="Financial">Financial</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 text-center text-slate-500 font-['Outfit']">Fetching records...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4 w-10">
                     <input 
                       type="checkbox"
                       className="w-4 h-4 rounded bg-white/5 border-white/20"
                       onChange={(e) => {
                         if (e.target.checked) {
                           setBulkSelection(sortedTickets.map(t => t.id));
                         } else {
                           setBulkSelection([]);
                         }
                       }}
                       checked={bulkSelection.length === sortedTickets.length && sortedTickets.length > 0}
                     />
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedTickets.map((ticket, idx) => (
                  <tr key={idx} className={`hover:bg-white/5 transition-colors group ${getPriorityScore(ticket) > 5 ? 'border-l-2 border-error/50' : ''} ${bulkSelection.includes(ticket.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                       <input 
                         type="checkbox"
                         className="w-4 h-4 rounded bg-white/5 border-white/20"
                         checked={bulkSelection.includes(ticket.id)}
                         onChange={() => toggleBulkSelection(ticket.id)}
                       />
                    </td>
                    <td className="px-6 py-4" onClick={() => handleSelectTicket(ticket)}>
                       <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4" onClick={() => handleSelectTicket(ticket)}>
                      <div>
                        <p className="font-bold text-white mb-0.5 flex items-center gap-2">
                          {ticket.ticket_id}
                          {getPriorityScore(ticket) > 8 && <TrendingUp size={12} className="text-error animate-pulse" />}
                          {ticket.frustration_index >= 7 && <span title={`High Frustration: ${ticket.frustration_index}/10`} className="text-error">🔥</span>}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ticket.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={ticket.urgency} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={() => handleSelectTicket(ticket)}>
                      <button className="btn-primary !p-2 !rounded-lg !bg-white/5 hover:!bg-white/10">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-2xl overflow-hidden">
              <div className="p-8 border-b border-white/10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold font-['Outfit'] text-white">{selectedTicket.ticket_id}</h2>
                    <StatusBadge status={selectedTicket.status} />
                    {selectedTicket.frustration_index != null && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 flex items-center gap-1">
                        {selectedTicket.frustration_index >= 7 ? '🔥' : selectedTicket.frustration_index <= 3 ? '🧊' : '😐'} 
                        Frustration: {selectedTicket.frustration_index}/10
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{selectedTicket.title}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Description</h4>
                  <p className="text-slate-200">{selectedTicket.description}</p>
                </div>

                {/* Legacy Resolution Note (kept for old tickets) */}
                {selectedTicket.admin_comment && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Resolution Note</h4>
                    <p className="text-slate-300 min-h-[50px]">{selectedTicket.admin_comment}</p>
                  </div>
                )}

                {/* AI Assistant for Admin */}
                <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <TrendingUp size={14} /> Neural Resolution Draft
                      </h4>
                      <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">
                         Gemini 1.5 Pro
                      </div>
                    </div>
                    
                    {isAiSuggesting ? (
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-500 italic font-medium">Neural engine drafting response...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed font-medium">
                          {aiSuggestion || "Select a ticket to generate a smart resolution draft."}
                        </p>
                        {aiSuggestion && (
                          <button 
                            onClick={() => setNewComment(aiSuggestion)}
                            className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2"
                          >
                            <Ticket size={14} />
                            Deploy Suggestion
                          </button>
                        )}
                      </>
                    )}
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
                      placeholder="Type a message or response to the user..." 
                      className="glass-input flex-1 text-sm py-2 px-4"
                      required
                    />
                    <button type="submit" disabled={isSendingComment} className="btn-primary px-4 py-2 !rounded-xl !text-sm">
                      Send
                    </button>
                  </form>
                </div>

                {/* Specialist Elevation Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck size={16} className="text-secondary" />
                      Specialist Elevation
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['IT', 'Finance', 'Legal', 'Academia', 'Medical'].map(dept => (
                      <button 
                        key={dept}
                        onClick={() => fetchSpecialistBriefing(selectedTicket, dept)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20 hover:border-secondary/40 transition-all text-slate-400 hover:text-white"
                      >
                         Brief {dept}
                      </button>
                    ))}
                  </div>

                  {(isBriefing || specialistBriefing) && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 font-['Outfit']">
                      <div className="flex items-center gap-2 mb-2 text-secondary text-[10px] font-black uppercase tracking-widest">
                        <Sparkles size={14} /> Neural Dept Briefing
                      </div>
                      {isBriefing ? (
                        <div className="py-2 flex items-center gap-2">
                           <div className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-xs text-slate-500 italic">Synthesizing briefing...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 italic">"{specialistBriefing}"</p>
                      )}
                    </motion.div>
                  )}
                </div>

                 <div className="flex items-center gap-4 mt-12 pt-8 border-t border-white/[0.05]">
                    <button onClick={() => handleUpdateStatus('In-Progress')} className="btn-ghost flex-1">Mark In-Progress</button>
                    <RainbowButton 
                      onClick={() => handleUpdateStatus('Resolved')} 
                      className="flex-1 !bg-primary/90 hover:!bg-primary"
                    >
                      <CheckCircle2 size={18} />
                      Resolve Ticket
                    </RainbowButton>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white font-['Outfit']">Executive Audit Report</h2>
                  <p className="text-slate-500 text-xs mt-1">Institutional performance & neural trend analysis.</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                <section>
                  <div className="flex items-center gap-3 mb-6 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    <Sparkles size={16} /> Neural Performance Analysis
                  </div>
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 leading-relaxed text-slate-300 font-['Outfit'] italic">
                    {isGeneratingReport ? (
                      <div className="flex items-center gap-4 py-8 justify-center">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium animate-pulse">Running institutional audit through Gemini-Flash...</span>
                      </div>
                    ) : (
                      reportSummary || "No summary generated."
                    )}
                  </div>
                </section>

                <section>
                   <div className="flex items-center gap-3 mb-6 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                    <TrendingUp size={16} /> Statistical Metrics
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-xs text-slate-600 mb-1 uppercase font-black">Audit Scope</div>
                      <div className="text-3xl font-black text-white font-['Outfit']">{tickets.length} <span className="text-sm text-slate-500">Tickets</span></div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-xs text-slate-600 mb-1 uppercase font-black">Avg Sentiment</div>
                      <div className="text-3xl font-black text-warning font-['Outfit']">
                        {(tickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / (tickets.length || 1)).toFixed(1)}
                        <span className="text-sm text-slate-500 font-medium ml-2">/ 10</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-[10px] text-slate-600 font-mono italic flex items-center gap-2">
                   <Shield size={12} /> SECURE_AUDIT_PROTOCOL_v7.1_SIGNATURE_VERIFIED
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setShowReportModal(false)} className="btn-ghost flex-1 sm:flex-initial">Cancel</button>
                    <button 
                      onClick={() => {
                        handleExportCSV();
                        setShowReportModal(false);
                      }}
                      className="btn-premium flex-1 sm:flex-initial"
                    >
                      <Download size={18} /> Download Excel/CSV
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
