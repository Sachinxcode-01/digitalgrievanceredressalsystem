import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, Clock, ArrowRight, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const SmartTriageAssistant = ({ 
  title = '', 
  description = '', 
  category = 'General', 
  urgency = 'Medium',
  onApplyRoute = null,
  onApplyResolution = null
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  const runSmartRouting = async () => {
    if (!description && !title) {
      toast.error('Please enter a title or description for AI analysis.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/ai/smart-route', { title, description, category, urgency });
      setAnalysis(res.data);
      toast.success('AI Smart Triage complete.');
    } catch (err) {
      console.error('Smart Triage failed:', err);
      // Fallback result
      setAnalysis({
        recommended_department: category === 'IT Support' ? 'IT Support & Campus Wi-Fi' : 'Academic Affairs',
        predicted_sla_hours: urgency === 'High' ? 24 : 48,
        sentiment: urgency === 'High' ? 'Urgent' : 'Calm',
        suggested_action: `Logged under ${category}. Priority triage assigned.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDraft = () => {
    if (!analysis?.suggested_action) return;
    navigator.clipboard.writeText(analysis.suggested_action);
    setCopied(true);
    toast.success('Resolution template copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);

    if (onApplyResolution) {
      onApplyResolution(analysis.suggested_action);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-linear-to-tr from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4 layer-3d">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Neural Triage & Smart Route</h4>
            <p className="text-[10px] text-slate-400">Powered by Llama 3.1 & Gemini 2.0 Flash</p>
          </div>
        </div>

        <button
          onClick={runSmartRouting}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Zap className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Run AI Triage</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-3 border-t border-white/10 text-xs"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">Department</span>
                <span className="font-bold text-indigo-400 truncate block">{analysis.recommended_department}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">Predicted SLA</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {analysis.predicted_sla_hours} Hours
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">User Tone</span>
                <span className={`font-bold uppercase text-[10px] ${
                  analysis.sentiment === 'Critical' || analysis.sentiment === 'Urgent' ? 'text-rose-400' : 'text-cyan-400'
                }`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>

            {analysis.suggested_action && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Suggested AI Resolution Draft</span>
                  <button
                    onClick={handleCopyDraft}
                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Applied' : 'Copy Draft'}</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed italic text-[11px]">
                  "{analysis.suggested_action}"
                </p>
              </div>
            )}

            {onApplyRoute && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onApplyRoute(analysis)}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Apply Recommended Department ({analysis.recommended_department})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartTriageAssistant;
