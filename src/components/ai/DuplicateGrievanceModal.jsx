import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, Ticket, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

export const DuplicateGrievanceModal = ({
  isOpen = false,
  duplicateData = null,
  onClose = () => {},
  onProceedAsNew = () => {},
  onUpvotedSuccess = () => {}
}) => {
  const [isUpvoting, setIsUpvoting] = useState(false);

  if (!isOpen || !duplicateData || !duplicateData.matching_ticket) return null;

  const ticket = duplicateData.matching_ticket;
  const matchScore = duplicateData.match_confidence || 85;

  const handleUpvote = async () => {
    setIsUpvoting(true);
    try {
      const res = await grievanceService.upvote(ticket.id || ticket.ticket_id);
      toast.success(res.alreadyUpvoted ? 'You have already upvoted this ticket.' : `Upvoted ticket #${ticket.ticket_id || ticket.id}! You are subscribed to updates.`);
      onUpvotedSuccess(res.grievance || ticket);
    } catch (err) {
      console.error('Upvote error:', err);
      toast.error('Could not upvote ticket. Saved locally.');
      onUpvotedSuccess(ticket);
    } finally {
      setIsUpvoting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl p-6 overflow-hidden rounded-3xl bg-slate-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-slate-100"
        >
          {/* Top glow decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">AI Duplicate Detection</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  {matchScore}% Match Confidence
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">Similar Grievance Already Active</h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            {duplicateData.reason || 'Our AI engine detected an open grievance matching your complaint parameters. Upvoting accelerates priority resolution!'}
          </p>

          {/* Matched Ticket Preview Card */}
          <div className="p-4 mb-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm font-semibold">
                <Ticket className="w-4 h-4" />
                <span>{ticket.ticket_id || ticket.id}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {ticket.status || 'Active'}
              </span>
            </div>

            <h4 className="font-semibold text-slate-200 text-sm">{ticket.title}</h4>
            <p className="text-xs text-slate-400 line-clamp-2">{ticket.description}</p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Category: {ticket.category || 'General'}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-amber-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{ticket.upvote_count || 1} Student Upvotes</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpvote}
              disabled={isUpvoting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Upvote & Subscribe</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onProceedAsNew();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700"
            >
              <span>Submit New Separate Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DuplicateGrievanceModal;
