import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Award, FileText, CheckCircle2, ShieldCheck, Printer, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateAcknowledgmentReceipt, generateResolutionCertificate } from '../../utils/pdfGenerator';

export const ExportCertificateModal = ({ isOpen, onClose, ticket = {}, user = {} }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('receipt'); // 'receipt' or 'certificate'

  const isResolved = ['Resolved', 'Closed', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'].includes(ticket.status);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      if (selectedDocType === 'certificate') {
        generateResolutionCertificate(ticket, user);
        toast.success('Official Resolution Certificate generated & downloaded!');
      } else {
        generateAcknowledgmentReceipt(ticket, user);
        toast.success('Official Grievance Acknowledgment Receipt downloaded!');
      }
      onClose();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF document.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-bright/20 text-primary-bright flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Official Document Export Studio</h3>
              <p className="text-xs text-muted-foreground">Certified PDF generation with institutional seals.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => setSelectedDocType('receipt')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              selectedDocType === 'receipt'
                ? 'bg-primary-bright/10 border-primary-bright text-foreground shadow-md'
                : 'bg-surface/50 border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <FileText className={`w-5 h-5 ${selectedDocType === 'receipt' ? 'text-primary-bright' : 'text-muted-foreground'}`} />
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                Official
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">Acknowledgment Receipt</h4>
            <p className="text-xs text-muted-foreground leading-snug">
              Intake confirmation with ticket ID, proof hash, and SLA commitment.
            </p>
          </div>

          <div
            onClick={() => {
              if (isResolved) {
                setSelectedDocType('certificate');
              } else {
                toast('Resolution certificate is available once the grievance is marked Resolved.', { icon: 'ℹ️' });
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              !isResolved
                ? 'opacity-50 cursor-not-allowed bg-surface/30 border-border'
                : selectedDocType === 'certificate'
                ? 'bg-amber-500/15 border-amber-500 text-foreground shadow-md'
                : 'bg-surface/50 border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <Award className={`w-5 h-5 ${selectedDocType === 'certificate' ? 'text-amber-400' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                isResolved ? 'bg-amber-500/20 text-amber-300' : 'bg-muted text-muted-foreground'
              }`}>
                {isResolved ? 'Ready' : 'Locked'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">Resolution Certificate</h4>
            <p className="text-xs text-muted-foreground leading-snug">
              Formal gold-bordered closure certificate with officer sign-off & audit stamp.
            </p>
          </div>
        </div>

        {/* Selected Document Info Summary */}
        <div className="p-4 rounded-2xl bg-surface/40 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Target Ticket:</span>
            <span className="font-mono font-bold text-foreground">#{ticket.ticket_id || ticket.id || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Department Node:</span>
            <span className="font-semibold text-foreground">{ticket.department || 'Central Redressal'}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Cryptographic Proof:</span>
            <span className="font-mono text-[10px] text-emerald-400">
              {ticket.proof_hash ? `${ticket.proof_hash.substring(0, 16)}...` : 'Verified on Ledger'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-primary-bright text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-md shadow-primary-bright/20"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Document...' : 'Download Certified PDF'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportCertificateModal;
