import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, FileText, CheckCircle2, ShieldCheck, Scale, 
  Send, Copy, Download, RefreshCw, Loader2, AlertCircle, BookOpen, 
  ChevronRight, ArrowRight, Award, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

const RESOLUTION_TONES = [
  { id: 'Empathetic & Formal', label: 'Empathetic & Formal', desc: 'Institutional care & respectful closure' },
  { id: 'Action-Oriented', label: 'Action-Oriented', desc: 'Direct steps taken & technical remedy' },
  { id: 'Technical & Audit-Ready', label: 'Technical / Audit-Ready', desc: 'Precise metrics & verification logs' },
  { id: 'Strict Regulatory', label: 'Strict Regulatory', desc: 'Statutory compliance & policy terms' }
];

const POLICY_PRESETS = [
  'Institutional Grievance Standard Operating Procedure (SOP §4.1)',
  'University Academic Evaluation & Exam Regulations §12.3',
  'Campus Residential & Facilities Maintenance Charter §6.0',
  'IT Infrastructure & Network Service Level Agreement (SLA §2.4)',
  'Student Welfare & Administrative Fair Treatment Policy §9.1'
];

export const AiResolutionCopilotModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onApplyResolution 
}) => {
  const [tone, setTone] = useState('Empathetic & Formal');
  const [policyReference, setPolicyReference] = useState(POLICY_PRESETS[0]);
  const [officerNotes, setOfficerNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [activeOutputTab, setActiveOutputTab] = useState('letter'); // letter | actions | policy
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await grievanceService.draftOfficialResolution(ticket, {
        tone,
        officerNotes,
        policyReference
      });
      setDossier(result);
      toast.success('Official resolution dossier drafted by Gemini AI!');
    } catch (err) {
      toast.error('Failed to generate resolution draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!dossier?.officialLetter) return;
    navigator.clipboard.writeText(dossier.officialLetter);
    setCopied(true);
    toast.success('Resolution letter copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToResolution = () => {
    if (!dossier) return;
    const combinedNotes = `${dossier.resolutionSummary}\n\nKey Actions:\n${(dossier.keyActionPoints || []).map(p => `• ${p}`).join('\n')}\n\nPolicy Reference: ${dossier.policyCitations?.[0] || policyReference}`;
    onApplyResolution({
      status: dossier.recommendedStatus || 'Resolved',
      notes: combinedNotes,
      fullLetter: dossier.officialLetter
    });
    onClose();
    toast.success('Resolution applied to ticket update queue!');
  };

  const handleDownloadPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export formal resolution notice.');
        return;
      }

      const letterContent = dossier?.officialLetter || '';
      const formattedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resolution Notice - ${ticket.ticket_id || ticket.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono&display=swap');
            body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: auto; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 12px; }
            .meta-item b { color: #475569; display: block; font-size: 10px; text-transform: uppercase; }
            .content { white-space: pre-wrap; font-size: 14px; margin-bottom: 30px; line-height: 1.7; }
            .actions-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
            .actions-box h4 { margin: 0 0 10px 0; color: #166534; font-size: 13px; text-transform: uppercase; }
            .actions-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #14532d; }
            .signature-block { border-top: 1px solid #cbd5e1; padding-top: 20px; margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
            .stamp { border: 2px solid #059669; color: #059669; padding: 6px 14px; border-radius: 6px; font-weight: 800; text-transform: uppercase; font-size: 12px; display: inline-block; transform: rotate(-3deg); }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">OFFICIAL GRIEVANCE RESOLUTION NOTICE</h1>
              <div class="badge">Verified Institutional Dossier</div>
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #0284c7;">
              <b>Ticket: #${ticket.ticket_id || ticket.id}</b><br>
              Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><b>Subject:</b> ${ticket.title}</div>
            <div class="meta-item"><b>Category:</b> ${ticket.category || 'General'}</div>
            <div class="meta-item"><b>Department:</b> ${ticket.department || 'Administration'}</div>
            <div class="meta-item"><b>Final Status:</b> RESOLVED</div>
          </div>

          <div class="content">${letterContent}</div>

          ${dossier?.keyActionPoints?.length ? `
            <div class="actions-box">
              <h4>Verified Remediation Actions</h4>
              <ul>
                ${dossier.keyActionPoints.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="signature-block">
            <div>
              <b>Authorized By:</b> Department Grievance Redressal Board<br>
              <b>Policy Ref:</b> ${dossier?.policyCitations?.[0] || policyReference}
            </div>
            <div style="text-align: right;">
              <div class="stamp">OFFICIALLY RESOLVED</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(formattedHtml);
      printWindow.document.close();
    } catch (err) {
      toast.error('Could not generate PDF view.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900/95 border border-primary-bright/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        >
          {/* Neon Top Accent Line */}
          <div className="h-1 w-full bg-linear-to-r from-primary-bright via-cyan-400 to-indigo-500 animate-pulse" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-border/70 flex items-start justify-between bg-slate-950/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-bright/15 border border-primary-bright/30 flex items-center justify-center text-primary-bright">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Gemini AI Resolution Copilot
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  Officer Tool
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Draft institutional-grade resolution sign-off letters with verified policy citations & action checklists.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
            {/* Ticket Context Pill */}
            <div className="p-3.5 bg-background/80 border border-border/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-primary-bright font-bold">#{ticket.ticket_id || ticket.id}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-bold text-foreground truncate max-w-xs">{ticket.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground text-[10px] font-bold uppercase">
                  {ticket.category || 'General'}
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase">
                  {ticket.urgency || 'Medium'} Priority
                </span>
              </div>
            </div>

            {/* Configuration Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tone Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award size={12} className="text-primary-bright" />
                  Resolution Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_TONES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        tone === t.id
                          ? 'bg-primary-bright/15 border-primary-bright text-white shadow-sm'
                          : 'bg-background/40 border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy Benchmark Reference */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scale size={12} className="text-indigo-400" />
                  Policy Citation Benchmark
                </label>
                <select
                  value={policyReference}
                  onChange={(e) => setPolicyReference(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-bright/60 cursor-pointer"
                >
                  {POLICY_PRESETS.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground/60 italic">
                  AI will cross-reference this institutional standard in the drafted findings.
                </p>
              </div>
            </div>

            {/* Officer Field Notes */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText size={12} className="text-cyan-400" />
                  Officer Action Notes & Remediation Evidence (Optional)
                </span>
                <span className="text-[10px] text-muted-foreground/50 lowercase">what was fixed / verified</span>
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="e.g. Technician replaced faulty ethernet switch in Lab 3; internet speed tested at 450Mbps; verified with complainant at 14:30."
                rows={3}
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary-bright/60 resize-none leading-relaxed"
              />
            </div>

            {/* Generate Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary-bright/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Synthesizing Resolution Dossier...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{dossier ? 'Re-Generate Resolution Dossier' : 'Draft Official Policy Resolution'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Output Preview Area */}
            {dossier && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/90 border border-primary-bright/30 rounded-xl overflow-hidden shadow-inner"
              >
                {/* Output Tabs Header */}
                <div className="border-b border-border/70 bg-muted/30 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'letter', label: 'Official Resolution Letter', icon: FileText },
                      { id: 'actions', label: 'Key Action Points', icon: CheckCircle2 },
                      { id: 'policy', label: 'Policy & Appeals', icon: ShieldCheck }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveOutputTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeOutputTab === tab.id
                              ? 'bg-primary-bright/20 text-primary-bright border border-primary-bright/40'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon size={12} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1 border border-border/60 hover:border-primary-bright/40"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1 border border-border/60 hover:border-primary-bright/40 text-cyan-400"
                    >
                      <Download size={12} />
                      Export Notice
                    </button>
                  </div>
                </div>

                {/* Tab 1: Letter */}
                {activeOutputTab === 'letter' && (
                  <div className="p-4 sm:p-5 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans space-y-3 bg-slate-950/30">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs">
                      <b>Executive Summary:</b> {dossier.resolutionSummary}
                    </div>
                    <div className="p-4 bg-background border border-border/50 rounded-lg font-mono text-[11px] leading-relaxed text-slate-300 select-text">
                      {dossier.officialLetter}
                    </div>
                  </div>
                )}

                {/* Tab 2: Action Checklist */}
                {activeOutputTab === 'actions' && (
                  <div className="p-5 space-y-3 bg-slate-950/30">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Verified Remediation Action Points:
                    </p>
                    <div className="space-y-2">
                      {(dossier.keyActionPoints || []).map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-background border border-border/60 rounded-lg text-xs">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                    {dossier.preventativeMeasures && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                        <b>Preventative Protocol:</b> {dossier.preventativeMeasures}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Policy & Appeals */}
                {activeOutputTab === 'policy' && (
                  <div className="p-5 space-y-3 bg-slate-950/30 text-xs">
                    <div className="p-3 bg-background border border-border/60 rounded-lg space-y-1">
                      <p className="font-bold text-indigo-400 uppercase tracking-wide text-[10px]">Institutional Policy Citation</p>
                      <p className="text-foreground">{dossier.policyCitations?.[0] || policyReference}</p>
                    </div>
                    <div className="p-3 bg-background border border-border/60 rounded-lg space-y-1">
                      <p className="font-bold text-amber-400 uppercase tracking-wide text-[10px]">Right to Appeal Window</p>
                      <p className="text-foreground">
                        Complainant retains statutory right to lodge an administrative appeal within <b>{dossier.appealWindowDays || 7} business days</b> of this resolution notice.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-border/70 bg-slate-950/60 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="btn-ghost px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyToResolution}
                disabled={!dossier}
                className="btn-primary px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
              >
                <CheckCircle2 size={13} />
                <span>Apply to Ticket & Mark Resolved</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiResolutionCopilotModal;
