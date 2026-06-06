import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, FileDown, MessageSquare, ShieldCheck, 
  MapPin, CheckCircle, HelpCircle, Loader2, Calendar, ClipboardList, 
  AlertCircle, History, Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { grievanceService } from '../../api/grievanceService';
import { CommandChat } from '../../components/ai/CommandChat';
import StatusBadge from '../../components/ui/StatusBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import TimelineStep from '../../components/ui/TimelineStep';
import { logSecurityEvent } from '../../lib/auditLogger';
import toast from 'react-hot-toast';

export const GrievanceDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, comments, resolution, audit
  const [isExporting, setIsExporting] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const data = await grievanceService.getById(id);
      setTicket(data);
      
      const timelineData = await grievanceService.getTimeline(id);
      setTimeline(timelineData || []);
    } catch (err) {
      toast.error('Could not fetch ticket details.');
      navigate('/grievances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();

    // Subscribe to updates for this specific ticket
    const channel = supabase
      .channel(`ticket-details:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grievances', filter: `id=eq.${id}` },
        (payload) => {
          setTicket(payload.new);
          toast.success(`Ticket status is now ${payload.new.status}`);
          // Fetch updated timeline records
          grievanceService.getTimeline(id).then(setTimeline).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleExportDossier = async () => {
    if (!ticket) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Clean header banner
      doc.setFillColor(37, 99, 235); // Blue primary
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("GRIEVANCE DOSSIER", 20, 25);
      doc.setFontSize(10);
      doc.text(`TICKET REFERENCE: #${ticket.ticket_id}`, 140, 25);
      doc.text(`EXPORT DATE: ${new Date().toLocaleDateString()}`, 140, 32);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text("Ticket Parameters", 20, 60);
      doc.line(20, 63, 190, 63);
      
      doc.setFontSize(10);
      doc.text(`Subject: ${ticket.title}`, 20, 72);
      doc.text(`Category Segment: ${ticket.category}`, 20, 80);
      doc.text(`Department: ${ticket.department || 'General'}`, 20, 88);
      doc.text(`Status: ${ticket.status}`, 140, 72);
      doc.text(`Priority Level: ${ticket.urgency}`, 140, 80);
      doc.text(`Filing Date: ${new Date(ticket.created_at).toLocaleString()}`, 20, 96);
      
      doc.setFontSize(13);
      doc.text("Narrative Statement", 20, 115);
      doc.line(20, 118, 190, 118);
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(ticket.description, 170);
      doc.text(splitDesc, 20, 128);
      
      // If resolved, append resolution notes
      if (ticket.status === 'Resolved' && ticket.resolution_notes) {
        const yOffset = 145 + (splitDesc.length * 5);
        doc.setFillColor(240, 253, 250); // Light emerald
        doc.rect(20, yOffset, 170, 35, 'F');
        doc.setTextColor(13, 148, 136); // Emerald text
        doc.setFontSize(11);
        doc.text("Resolution Audit Summary", 25, yOffset + 10);
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const splitNotes = doc.splitTextToSize(ticket.resolution_notes, 160);
        doc.text(splitNotes, 25, yOffset + 18);
      }
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("This dossier represents a certified ResolveNow v2.0 institutional record.", 105, 285, null, null, "center");
      
      doc.save(`ResolveNow_Dossier_${ticket.ticket_id}.pdf`);
      toast.success("Dossier PDF downloaded successfully.");
      logSecurityEvent('Grievance Dossier Exported', user.email, 'Grievance Details Page', 'info');
    } catch (err) {
      toast.error("Failed to generate PDF dossier.");
    } finally {
      setIsExporting(false);
    }
  };

  const getSLAStatus = () => {
    if (!ticket || ticket.status === 'Resolved' || ticket.status === 'Closed') return null;
    const priority = ticket.urgency || 'Medium';
    const hours = priority === 'High' ? 24 : priority === 'Medium' ? 72 : 120;
    const created = new Date(ticket.created_at);
    const deadline = new Date(created.getTime() + hours * 60 * 60 * 1000);
    const remaining = deadline - new Date();
    
    if (remaining < 0) return { label: 'SLA BREACHED', color: 'text-error border-error/20 bg-error/5' };
    const remHours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
    return { label: `SLA Target: ${remHours} hours remaining`, color: 'text-success border-success/20 bg-success/5' };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary-bright" size={36} />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing Grievance Module...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-12">
      
      {/* Back to registry navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/grievances')}
            className="p-2 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-all"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary-bright px-2 py-0.5 bg-primary-bright/5 rounded border border-primary-bright/10">
                {ticket.ticket_id}
              </span>
              <StatusBadge status={ticket.status} />
              <UrgencyBadge level={ticket.urgency} />
            </div>
            <h1 className="text-lg font-heading font-black text-foreground mt-1 truncate max-w-md">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getSLAStatus() && (
            <span className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${getSLAStatus().color}`}>
              {getSLAStatus().label}
            </span>
          )}
          <button 
            onClick={handleExportDossier}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border hover:border-primary-bright/20 hover:bg-primary-bright/[0.01] rounded-lg text-[10px] font-bold text-foreground uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            <span>Dossier</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border/80 gap-6 overflow-x-auto select-none no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Info },
          { id: 'timeline', label: 'Timeline log', icon: Calendar },
          { id: 'comments', label: 'Discussion', icon: MessageSquare },
          { id: 'resolution', label: 'Resolution', icon: ShieldCheck },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'border-primary-bright text-primary-bright' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Details card */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Subject title</span>
                      <p className="text-sm font-bold text-foreground">{ticket.title}</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Complaint details</span>
                      <p className="p-4 rounded-lg bg-background border border-border text-foreground text-xs leading-relaxed italic whitespace-pre-wrap">
                        "{ticket.description}"
                      </p>
                    </div>
                  </div>

                  {/* Evidence Attachments */}
                  {ticket.attachment_url && (
                    <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Attached Evidence</span>
                      <a 
                        href={ticket.attachment_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary-bright/20 transition-all bg-background"
                      >
                        <div className="p-2 bg-muted border border-border rounded-lg text-primary-bright">
                          <FileDown size={14} />
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-foreground truncate max-w-xs">Open Attachment Link</p>
                          <p className="text-[9px] text-muted-foreground uppercase">Verified Document File</p>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Metadata Column */}
                <div className="space-y-6">
                  <div className="bg-surface border border-border/80 rounded-xl p-5 shadow-xs space-y-4">
                    <h3 className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Grievance parameters</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Segment category</span>
                        <span className="inline-block px-2.5 py-1 bg-background border border-border rounded text-[10px] font-mono font-bold uppercase text-foreground mt-1">
                          {ticket.category}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Assigned department</span>
                        <span className="inline-block px-2.5 py-1 bg-background border border-border rounded text-[10px] font-mono font-bold uppercase text-foreground mt-1">
                          {ticket.department || 'General Operations'}
                        </span>
                      </div>

                      {ticket.location && (
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block flex items-center gap-1">
                            <MapPin size={10} className="text-primary-bright" /> Incident location
                          </span>
                          <p className="text-xs text-foreground mt-1 font-medium">{ticket.location}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Impact Frustration score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-foreground">{ticket.frustration_index || 1}/10</span>
                          <div className="flex-1 bg-background border border-border/60 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-bright rounded-full"
                              style={{ width: `${(ticket.frustration_index || 1) * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TIMELINE PANEL */}
          {activeTab === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-xl p-6 shadow-xs space-y-6"
            >
              <div>
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">Redressal Timeline Log</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Chronological record of status changes, operator logs, and workflow milestones.</p>
              </div>

              <div className="space-y-6 relative pl-2">
                <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />
                
                {timeline.map((step, idx) => (
                  <TimelineStep 
                    key={step.id || idx}
                    done={true}
                    active={idx === timeline.length - 1 && ticket.status !== 'Resolved'}
                    label={step.status}
                    date={new Date(step.created_at).toLocaleDateString()}
                    desc={step.notes || `Activity type: ${step.activity_type}`}
                  />
                ))}

                {timeline.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No timeline events compiled yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* COMMENTS PANEL */}
          {activeTab === 'comments' && (
            <motion.div 
              key="comments"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="h-[520px]"
            >
              <CommandChat 
                grievanceId={ticket.id} 
                currentUser={user} 
                role="user"
              />
            </motion.div>
          )}

          {/* RESOLUTION PANEL */}
          {activeTab === 'resolution' && (
            <motion.div 
              key="resolution"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-xl p-6 shadow-xs space-y-6"
            >
              <div>
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">Remediation Resolution Statement</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Official statement logged by the assigned redressal coordinator.</p>
              </div>

              {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                <div className="p-5 rounded-xl border border-success/20 bg-success/[0.02] space-y-4">
                  <div className="flex gap-2">
                    <CheckCircle className="text-success shrink-0" size={18} />
                    <div className="space-y-1 text-left">
                      <h4 className="text-sm font-bold text-foreground">Grievance Successfully Addressed</h4>
                      <p className="text-xs text-muted-foreground">The assigned officer has completed investigation and logged final details:</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border text-xs text-foreground font-medium italic whitespace-pre-wrap leading-relaxed">
                    "{ticket.resolution_notes || 'Resolved without comments.'}"
                  </div>
                  {ticket.resolved_at && (
                    <span className="text-[10px] text-muted-foreground/60 font-mono block">
                      Resolution Time: {new Date(ticket.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-warning/20 bg-warning/[0.01] flex gap-3">
                  <HelpCircle className="text-warning shrink-0" size={18} />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">Resolution Pending</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Investigation is currently in queue. The resolution statement will appear here once the redressal coordinator transitions the ticket status to RESOLVED.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AUDIT TRAIL PANEL */}
          {activeTab === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-surface border border-border/80 rounded-xl p-6 shadow-xs space-y-6"
            >
              <div>
                <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground font-black">Security Audit Trail</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Immutable system log tracking user actions and database handshakes for this grievance.</p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-background text-[10px] uppercase text-muted-foreground font-bold border-b border-border">
                      <th className="px-4 py-3">Event Action</th>
                      <th className="px-4 py-3">Actor / Origin</th>
                      <th className="px-4 py-3">Summary Description</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {timeline.map((step, idx) => (
                      <tr key={step.id || idx} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-bold text-primary-bright uppercase text-[10px]">
                          {step.activity_type}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {step.profiles?.full_name || 'Authorized Operator'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {step.notes || `Grievance transitioned to state: ${step.status}`}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(step.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {timeline.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-muted-foreground italic">
                          No audit records compiled.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};

export default GrievanceDetailsPage;
