import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Clock, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, Send, Loader2, RotateCcw, ShieldAlert, UserCheck,
  FileText, MessageSquare, Activity, Zap, Star, MapPin, Paperclip,
  RefreshCw, Download, Lock, Unlock, Edit3, Bot, ChevronRight,
  TrendingUp, Calendar, Tag, Building2, Circle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { grievanceService } from '../../services/grievanceService';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import toast from 'react-hot-toast';

// ─── Status Flow Configuration ───────────────────────────────────────────────
const STATUS_TRANSITIONS = {
  'Draft':                 ['Submitted'],
  'Submitted':             ['Under Review', 'Assigned', 'Closed'],
  'Under Review':          ['Assigned', 'In Progress', 'Closed'],
  'New':                   ['Under Review', 'Assigned', 'Closed'],
  'Pending':               ['Assigned', 'In Progress', 'Closed'],
  'Assigned':              ['In Progress', 'Pending User Response', 'Resolved', 'Escalated'],
  'In Progress':           ['Pending User Response', 'Resolved', 'Escalated', 'Closed'],
  'Pending User Response': ['In Progress', 'Resolved', 'Closed'],
  'Escalated':             ['In Progress', 'Resolved', 'Closed'],
  'Resolved':              ['Closed', 'Reopened', 'In Progress'],
  'Closed':                ['Reopened', 'In Progress'],
  'Reopened':              ['Assigned', 'In Progress', 'Resolved', 'Closed']
};

const STATUS_COLORS = {
  'Draft':                 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  'Submitted':             'text-blue-400 bg-blue-400/10 border-blue-400/30',
  'New':                   'text-blue-400 bg-blue-400/10 border-blue-400/30',
  'Under Review':          'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Pending':               'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Pending User Response': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  'Assigned':              'text-purple-400 bg-purple-400/10 border-purple-400/30',
  'In Progress':           'text-orange-400 bg-orange-400/10 border-orange-400/30',
  'Escalated':             'text-red-400 bg-red-400/10 border-red-400/30',
  'Resolved':              'text-green-400 bg-green-400/10 border-green-400/30',
  'Closed':                'text-slate-400 bg-slate-400/10 border-slate-400/30',
  'Reopened':              'text-amber-400 bg-amber-400/10 border-amber-400/30'
};

const STATUS_ICONS = {
  'Draft':                 FileText,
  'Submitted':             Circle,
  'New':                   Circle,
  'Under Review':          Clock,
  'Pending':               Clock,
  'Pending User Response': MessageSquare,
  'Assigned':              UserCheck,
  'In Progress':           Activity,
  'Escalated':             ShieldAlert,
  'Resolved':              CheckCircle2,
  'Closed':                Lock,
  'Reopened':              RotateCcw
};

// ─── AI Suggested Responses ──────────────────────────────────────────────────
const AI_RESPONSES = [
  "We have reviewed your grievance and assigned it to the relevant department. Our team will investigate and respond within 3-5 business days.",
  "Your concern has been escalated to senior management for priority review. We apologize for any inconvenience caused.",
  "We are pleased to inform you that your grievance has been resolved. The corrective measures have been implemented.",
  "Thank you for bringing this matter to our attention. We have initiated an internal audit and will update you with findings.",
  "Your grievance requires additional information. Please provide supporting documentation to help us process your request.",
];

// ─── Timeline Entry Component ─────────────────────────────────────────────────
const TimelineEntry = ({ entry, isLast }) => {
  const Icon = STATUS_ICONS[entry.status] || Circle;
  return (
    <div className="flex gap-4 relative">
      {!isLast && (
        <div className="absolute left-4.5 top-9 bottom-0 w-px bg-border/40" />
      )}
      <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${STATUS_COLORS[entry.status] || 'text-muted-foreground border-border'}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-foreground">{entry.action || `Status → ${entry.status}`}</span>
            {entry.notes && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.notes}</p>
            )}
            {entry.changed_by_name && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium uppercase tracking-wide">
                by {entry.changed_by_name}
              </p>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
            {entry.created_at ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── AI Assistant Panel ───────────────────────────────────────────────────────
const AIAssistantPanel = ({ ticket, onSuggestionApply }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I've analyzed grievance #${ticket?.ticket_id || '—'}. Category: **${ticket?.category || 'Unknown'}**, Priority: **${ticket?.urgency || 'Medium'}**, Status: **${ticket?.status || 'New'}**.\n\nHow can I assist you with the remediation of this ticket?`
    }
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setThinking(true);

    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    const aiReply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    setThinking(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApply = (content) => {
    onSuggestionApply(content);
    toast.success('AI response applied to resolution notes.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 custom-scrollbar pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary-bright/15 border border-primary-bright/30 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-primary-bright" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-bright/10 border border-primary-bright/20 text-foreground'
                : 'bg-muted/60 border border-border/40 text-muted-foreground'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && i > 0 && (
                <button
                  onClick={() => handleApply(msg.content)}
                  className="mt-1.5 text-[10px] text-primary-bright/70 hover:text-primary-bright flex items-center gap-1 transition-colors"
                >
                  <Edit3 size={9} />
                  Apply to notes
                </button>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-bright/15 border border-primary-bright/30 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-primary-bright animate-pulse" />
            </div>
            <div className="bg-muted/60 border border-border/40 rounded-xl px-3 py-2.5">
              <Loader2 size={12} className="animate-spin text-primary-bright" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask AI to draft a response…"
          className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary-bright/40 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={thinking || !query.trim()}
          className="w-8 h-8 bg-primary-bright/10 border border-primary-bright/30 rounded-lg flex items-center justify-center text-primary-bright hover:bg-primary-bright/20 transition-colors disabled:opacity-40"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AdminGrievanceDetailsPage = ({ user, sessionUser }) => {
  const currentUser = user || sessionUser;
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | timeline | actions | ai

  // Action panel state
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ticket + timeline ────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketData, timelineData] = await Promise.all([
        grievanceService.getById(id),
        grievanceService.getTimeline(id),
      ]);
      setTicket(ticketData);
      setTimeline(timelineData || []);
      setNewStatus(ticketData?.status || '');
    } catch (err) {
      toast.error('Failed to load ticket data.');
      navigate('/admin/grievances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === ticket.status) return toast.error('Select a different status.');
    setSubmitting(true);
    try {
      await grievanceService.updateStatus(id, newStatus, resolutionNotes);
      toast.success(`Status updated to "${newStatus}"`);
      setResolutionNotes('');
      await fetchData();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTo.trim()) return toast.error('Officer name/ID required.');
    setSubmitting(true);
    try {
      await grievanceService.assign(id, assignTo, assignDept);
      toast.success('Ticket assigned successfully.');
      setAssignTo('');
      setAssignDept('');
      await fetchData();
    } catch {
      toast.error('Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) return toast.error('Escalation reason required.');
    setSubmitting(true);
    try {
      await grievanceService.escalate(id, escalationReason);
      toast.success('Ticket escalated to senior review.');
      setEscalationReason('');
      await fetchData();
    } catch {
      toast.error('Escalation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!ticket) return;
    const content = [
      `Grievance Report — ${ticket.ticket_id}`,
      `Title: ${ticket.title}`,
      `Status: ${ticket.status}`,
      `Category: ${ticket.category}`,
      `Department: ${ticket.department || 'General'}`,
      `Priority: ${ticket.urgency}`,
      `Submitted: ${ticket.created_at ? format(new Date(ticket.created_at), 'PPpp') : '—'}`,
      '',
      'Description:',
      ticket.description,
      '',
      'Timeline:',
      ...timeline.map(e => `[${e.created_at ? format(new Date(e.created_at), 'PPpp') : '—'}] ${e.action || e.status}${e.notes ? `: ${e.notes}` : ''}`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ticket.ticket_id}_report.txt`;
    a.click();
    toast.success('Report exported.');
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-primary-bright mx-auto" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Retrieving ticket data…</p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const StatusIcon = STATUS_ICONS[ticket.status] || Circle;
  const availableTransitions = STATUS_TRANSITIONS[ticket.status] || [];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div className="space-y-5 text-left max-w-7xl mx-auto pb-12">

      {/* ── Breadcrumb & Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/grievances')}
            className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border/50"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Admin</span>
            <ChevronRight size={10} />
            <span>Grievances</span>
            <ChevronRight size={10} />
            <span className="text-primary-bright font-mono">{ticket.ticket_id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* ── Ticket Header Card ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[ticket.status]}`}>
                <StatusIcon size={9} />
                {ticket.status}
              </span>
              <UrgencyBadge level={ticket.urgency} />
              {ticket.escalated_at && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  <ShieldAlert size={9} />
                  Escalated
                </span>
              )}
            </div>
            <h1 className="text-lg font-heading font-black text-foreground leading-tight">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Tag size={11} />
                {ticket.category}
              </span>
              {ticket.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={11} />
                  {ticket.department}
                </span>
              )}
              {ticket.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={11} />
                  {ticket.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                {format(new Date(ticket.created_at), 'PPp')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            {[
              { label: 'Ticket ID', value: ticket.ticket_id, mono: true },
              { label: 'Assigned To', value: ticket.assigned_to || 'Unassigned', highlight: !!ticket.assigned_to },
              { label: 'Last Updated', value: ticket.updated_at ? formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true }) : '—' },
            ].map((item, i) => (
              <div key={i} className="bg-background/60 border border-border/50 rounded-lg p-3 min-w-25">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1">{item.label}</p>
                <p className={`text-xs font-bold truncate ${item.mono ? 'font-mono text-primary-bright' : item.highlight ? 'text-success' : 'text-foreground'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-surface/60 border border-border/60 rounded-xl p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-primary-bright text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ────────────────────────────────────────────────────── */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Description */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <FileText size={11} /> Description
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {ticket.resolution_notes && (
              <div className="bg-success/5 border border-success/20 rounded-xl p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-success mb-4 flex items-center gap-2">
                  <CheckCircle2 size={11} /> Resolution Notes
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {ticket.resolution_notes}
                </p>
              </div>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Paperclip size={11} /> Attachments ({ticket.attachments.length})
                </h3>
                <div className="space-y-2">
                  {ticket.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-background/60 border border-border/50 rounded-lg hover:border-primary-bright/30 transition-colors text-xs text-foreground group"
                    >
                      <Paperclip size={12} className="text-muted-foreground group-hover:text-primary-bright transition-colors" />
                      <span className="flex-1 truncate">{att.name || `Attachment ${i + 1}`}</span>
                      <Download size={10} className="text-muted-foreground/50 group-hover:text-primary-bright" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Metadata sidebar */}
          <div className="space-y-4">
            <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User size={11} /> Submitter Info
              </h3>
              {[
                { label: 'User ID', value: ticket.user_id ? `…${ticket.user_id.slice(-8)}` : '—' },
                { label: 'Anonymous', value: ticket.is_anonymous ? 'Yes' : 'No' },
                { label: 'Submitted', value: ticket.created_at ? format(new Date(ticket.created_at), 'PPp') : '—' },
                { label: 'AI Triage Score', value: ticket.frustration_index != null ? `${ticket.frustration_index}/10` : '—', highlight: (ticket.frustration_index || 0) >= 7 },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border/30 last:border-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">{row.label}</span>
                  <span className={`text-xs font-bold ${row.highlight ? 'text-error' : 'text-foreground'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Quick Status */}
            <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp size={11} /> Workflow State
              </h3>
              <div className="space-y-1.5">
                {['New', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((s) => {
                  const statuses = ['New', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
                  const currentIdx = statuses.indexOf(ticket.status === 'Escalated' ? 'In Progress' : ticket.status);
                  const stepIdx = statuses.indexOf(s);
                  const isActive = s === ticket.status;
                  const isDone = stepIdx < currentIdx;
                  const SIcon = STATUS_ICONS[s] || Circle;
                  return (
                    <div key={s} className={`flex items-center gap-2.5 p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? `${STATUS_COLORS[s]} border` : isDone ? 'text-muted-foreground/50' : 'text-muted-foreground/30'}`}>
                      <SIcon size={11} />
                      {s}
                      {isActive && <span className="ml-auto text-[8px] font-black">CURRENT</span>}
                      {isDone && <CheckCircle2 size={9} className="ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <Activity size={11} /> Audit Timeline ({timeline.length} events)
          </h3>
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock size={24} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs">No timeline events recorded yet.</p>
            </div>
          ) : (
            <div className="pt-2">
              {timeline.map((entry, i) => (
                <TimelineEntry key={entry.id || i} entry={entry} isLast={i === timeline.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIONS TAB */}
      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Status Update */}
          <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <RotateCcw size={11} /> Update Status
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">
                  Transition To
                </label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-bright/40 appearance-none cursor-pointer"
                  >
                    <option value={ticket.status}>{ticket.status} (current)</option>
                    {availableTransitions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">
                  Resolution / Internal Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Add context, resolution summary, or internal notes..."
                  rows={4}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary-bright/40 resize-none"
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={submitting || newStatus === ticket.status}
                className="w-full btn-primary flex items-center justify-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Apply Status Change
              </button>
            </div>
          </div>

          {/* Assignment Panel */}
          <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserCheck size={11} /> Assign Officer
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">
                  Officer ID / Name
                </label>
                <input
                  value={assignTo}
                  onChange={e => setAssignTo(e.target.value)}
                  placeholder="e.g. john.doe or UUID..."
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary-bright/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={assignDept}
                    onChange={e => setAssignDept(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-bright/40 appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Finance">Finance</option>
                    <option value="Student Services">Student Services</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Administration">Administration</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {ticket.assigned_to && (
                <div className="flex items-center gap-2 p-2.5 bg-success/5 border border-success/20 rounded-lg">
                  <UserCheck size={11} className="text-success shrink-0" />
                  <p className="text-[10px] text-success font-bold uppercase">
                    Currently: {ticket.assigned_to}
                  </p>
                </div>
              )}

              <button
                onClick={handleAssign}
                disabled={submitting || !assignTo.trim()}
                className="w-full btn-primary flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                {ticket.assigned_to ? 'Reassign Officer' : 'Assign Officer'}
              </button>
            </div>
          </div>

          {/* Escalation Panel */}
          <div className="bg-surface border border-red-500/20 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
              <ShieldAlert size={11} /> Escalation Control
            </h3>

            {ticket.escalated_at ? (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <ShieldAlert size={9} /> Active Escalation
                </p>
                <p className="text-xs text-muted-foreground">
                  Escalated {formatDistanceToNow(new Date(ticket.escalated_at), { addSuffix: true })}
                </p>
                {ticket.escalation_reason && (
                  <p className="text-xs text-foreground/80 italic border-l-2 border-red-400/40 pl-2">
                    "{ticket.escalation_reason}"
                  </p>
                )}
              </div>
            ) : null}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-1.5">
                Escalation Justification
              </label>
              <textarea
                value={escalationReason}
                onChange={e => setEscalationReason(e.target.value)}
                placeholder="Describe why this ticket requires senior review or escalation..."
                rows={5}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-400/40 resize-none"
              />
            </div>
            <button
              onClick={handleEscalate}
              disabled={submitting || !escalationReason.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
              {ticket.escalated_at ? 'Re-escalate Ticket' : 'Escalate to Senior Review'}
            </button>
          </div>
        </div>
      )}

      {/* AI ASSISTANT TAB */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface border border-primary-bright/20 rounded-xl p-6 shadow-sm h-120 flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-bright mb-4 flex items-center gap-2 shrink-0">
              <Bot size={11} /> AI Remediation Assistant
            </h3>
            <div className="flex-1 min-h-0">
              <AIAssistantPanel
                ticket={ticket}
                onSuggestionApply={(text) => {
                  setResolutionNotes(text);
                  setActiveTab('actions');
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Analysis Card */}
            <div className="bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap size={11} /> AI Triage Analysis
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Category Confidence', value: '94%', bar: 94, color: 'bg-primary-bright' },
                  { label: 'Frustration Index', value: `${(ticket.frustration_index || 3)}/10`, bar: (ticket.frustration_index || 3) * 10, color: (ticket.frustration_index || 3) >= 7 ? 'bg-error' : (ticket.frustration_index || 3) >= 5 ? 'bg-warning' : 'bg-success' },
                  { label: 'Resolution Urgency', value: ticket.urgency === 'High' ? 'Critical' : ticket.urgency === 'Medium' ? 'Moderate' : 'Standard', bar: ticket.urgency === 'High' ? 90 : ticket.urgency === 'Medium' ? 55 : 25, color: ticket.urgency === 'High' ? 'bg-error' : ticket.urgency === 'Medium' ? 'bg-warning' : 'bg-success' },
                  { label: 'Public Sentiment Risk', value: 'Medium', bar: 52, color: 'bg-warning' },
                ].map((metric, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
                      <span className="text-xs font-black text-foreground">{metric.value}</span>
                    </div>
                    <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color} rounded-full transition-all duration-700`}
                        style={{ width: `${metric.bar}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Star size={11} /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Mark Resolved', icon: CheckCircle2, action: () => { setNewStatus('Resolved'); setActiveTab('actions'); }, color: 'text-success hover:bg-success/10 border-success/20' },
                  { label: 'Assign Officer', icon: UserCheck, action: () => setActiveTab('actions'), color: 'text-primary-bright hover:bg-primary-bright/10 border-primary-bright/20' },
                  { label: 'Escalate Now', icon: ShieldAlert, action: () => setActiveTab('actions'), color: 'text-error hover:bg-error/10 border-error/20' },
                  { label: 'Close Ticket', icon: Lock, action: () => { setNewStatus('Closed'); setActiveTab('actions'); }, color: 'text-muted-foreground hover:bg-muted/30 border-border/60' },
                ].map((qa, i) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={i}
                      onClick={qa.action}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${qa.color}`}
                    >
                      <Icon size={12} />
                      {qa.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminGrievanceDetailsPage;
