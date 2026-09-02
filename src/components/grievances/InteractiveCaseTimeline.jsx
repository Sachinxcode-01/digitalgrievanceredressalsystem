import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Clock, ShieldCheck, UserCheck, Sparkles, 
  FileText, Image, ChevronRight, MessageSquare, AlertCircle, 
  ExternalLink, Eye, ArrowRight, Star
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const InteractiveCaseTimeline = ({ 
  grievance = {}, 
  timelineEvents = [],
  onAddNote = null,
  isAdmin = false 
}) => {
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(null);
  const [showEvidenceComparison, setShowEvidenceComparison] = useState(false);

  const status = grievance.status || 'Pending';
  const isResolved = ['Resolved', 'Closed', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'].includes(status);
  const isInProgress = ['In Progress', 'IN_PROGRESS', 'Under Review'].includes(status);

  // Compute canonical steps
  const steps = [
    {
      id: 'submitted',
      title: 'Grievance Registered',
      description: grievance.is_anonymous ? 'Submitted via Whistleblower Anonymous Vault' : 'Logged & Assigned Proof Hash',
      timestamp: grievance.created_at,
      icon: FileText,
      status: 'completed',
      meta: grievance.proof_hash ? `Proof: ${grievance.proof_hash.substring(0, 16)}...` : null
    },
    {
      id: 'ai_triage',
      title: 'AI Smart Triage & Categorization',
      description: `Routed to ${grievance.department || 'General Support'} with ${grievance.urgency || 'Medium'} urgency.`,
      timestamp: grievance.created_at,
      icon: Sparkles,
      status: 'completed',
      meta: grievance.ai_sentiment ? `Sentiment: ${grievance.ai_sentiment}` : null
    },
    {
      id: 'officer_assigned',
      title: 'Department Officer Assigned',
      description: grievance.assigned_to 
        ? `Case assigned to Officer ID: ${grievance.assigned_to}` 
        : (isInProgress || isResolved ? 'Assigned to Nodal Officer' : 'Pending officer dispatch in queue'),
      timestamp: grievance.updated_at || grievance.created_at,
      icon: UserCheck,
      status: (isInProgress || isResolved) ? 'completed' : 'current',
    },
    {
      id: 'investigation',
      title: 'Active Investigation & On-Site Action',
      description: grievance.resolution_notes 
        ? 'Field inspection completed & resolution drafted.' 
        : (isInProgress ? 'Investigation in progress by department technicians.' : 'Awaiting officer initial review'),
      timestamp: isResolved ? grievance.resolved_at || grievance.updated_at : null,
      icon: Clock,
      status: isResolved ? 'completed' : (isInProgress ? 'current' : 'upcoming'),
    },
    {
      id: 'resolution',
      title: isResolved ? 'Case Resolved & Certified' : 'Final Resolution Sign-Off',
      description: isResolved 
        ? (grievance.resolution_notes || 'All reported issues rectified in accordance with campus SLA.') 
        : 'Pending final verification & sign-off.',
      timestamp: grievance.resolved_at,
      icon: ShieldCheck,
      status: isResolved ? 'completed' : 'upcoming',
      meta: isResolved && grievance.proof_hash ? 'Digital Institutional Seal Applied' : null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Timeline Header & Evidence Compare CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div>
          <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-bright" />
            Interactive Lifecycle Audit Trail
          </h3>
          <p className="text-xs text-muted-foreground">
            Cryptographically sealed timeline of events and department actions.
          </p>
        </div>

        {(grievance.attachment_url || grievance.resolution_proof_url) && (
          <button
            type="button"
            onClick={() => setShowEvidenceComparison(true)}
            className="px-3 py-1.5 rounded-xl bg-primary-bright/10 hover:bg-primary-bright/20 border border-primary-bright/30 text-primary-bright text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect Evidence Before & After
          </button>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-6 space-y-8 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Node Icon Indicator */}
              <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isDone 
                  ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-sm' 
                  : isCurrent 
                  ? 'bg-primary-bright text-white ring-4 ring-primary-bright/20 animate-pulse' 
                  : 'bg-muted border border-border text-muted-foreground'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
              </div>

              {/* Node Card Content */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isDone 
                  ? 'bg-surface/60 border-border/80 hover:border-border' 
                  : isCurrent 
                  ? 'bg-primary-bright/5 border-primary-bright/30 shadow-xs' 
                  : 'bg-surface/30 border-border/40 opacity-70'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${
                    isDone ? 'text-foreground' : isCurrent ? 'text-primary-bright font-extrabold' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {format(new Date(step.timestamp), 'MMM dd, yyyy • hh:mm a')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {step.description}
                </p>

                {step.meta && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted/50 border border-border text-[10px] font-mono text-muted-foreground">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {step.meta}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Side-by-Side Evidence Inspection Modal */}
      <AnimatePresence>
        {showEvidenceComparison && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary-bright" />
                    Evidence & Resolution Verification Inspector
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compare the initial citizen evidence with the department officer resolution proof.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEvidenceComparison(false)}
                  className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Initial Citizen Photo */}
                <div className="space-y-3 p-4 rounded-2xl bg-surface/40 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                      1. Citizen Initial Evidence
                    </span>
                    <span className="text-[11px] text-muted-foreground">At Submission</span>
                  </div>
                  {grievance.attachment_url ? (
                    <div className="rounded-xl overflow-hidden border border-border bg-slate-950 aspect-video flex items-center justify-center">
                      <img 
                        src={grievance.attachment_url} 
                        alt="Initial Grievance Evidence" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                      <FileText className="w-8 h-8 mb-2 opacity-40" />
                      <span>No media attachment uploaded at submission.</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground italic">
                    "{grievance.title}"
                  </p>
                </div>

                {/* Officer Resolution Proof */}
                <div className="space-y-3 p-4 rounded-2xl bg-surface/40 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20">
                      2. Officer Resolution Proof
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Rectified</span>
                  </div>
                  {grievance.resolution_proof_url ? (
                    <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 aspect-video flex items-center justify-center">
                      <img 
                        src={grievance.resolution_proof_url} 
                        alt="Officer Resolution Proof" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                      <ShieldCheck className="w-8 h-8 mb-2 text-emerald-400 opacity-60" />
                      <span>{isResolved ? 'Issue marked verified by departmental supervisor.' : 'Resolution proof pending officer upload upon repair.'}</span>
                    </div>
                  )}
                  <p className="text-xs text-foreground/90 font-medium">
                    {grievance.resolution_notes || 'Technician notes: Verified and cleared under standard operating procedures.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceComparison(false)}
                  className="px-5 py-2 rounded-xl bg-primary-bright text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Done Inspecting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveCaseTimeline;
