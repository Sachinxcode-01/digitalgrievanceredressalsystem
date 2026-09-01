import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, ShieldCheck, ArrowRight, Check, X, HelpCircle, HeartHandshake } from 'lucide-react';

export const GuidedTourModal = ({ forceOpen = false, onClose = null }) => {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return !localStorage.getItem('dg_onboarding_seen');
    } catch {
      return false;
    }
  });
  const [currentStep, setCurrentStep] = useState(0);

  const isModalOpen = forceOpen || isOpen;

  const handleDismiss = () => {
    try {
      localStorage.setItem('dg_onboarding_seen', 'true');
    } catch {
      // ignore storage errors
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const steps = [
    {
      icon: Sparkles,
      color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      badge: 'Step 1 of 3: Effortless Filing',
      title: 'Voice, Regional Languages & AI Help',
      description: 'You do not need complicated technical words. Type in simple everyday words (English, Hindi, or regional languages) or click the Microphone to speak. Our AI automatically figures out the correct department and urgency for you.',
      tips: '💡 Tip: Click any quick-complaint chip on the submission page to fill the form in 10 seconds!'
    },
    {
      icon: Clock,
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badge: 'Step 2 of 3: Guaranteed Timelines',
      title: 'Every Complaint Has a Fixed Deadline',
      description: 'Once submitted, your issue is protected by a strict Service Level Agreement (SLA). You get an exact countdown timer showing when the department must resolve it (typically 24 to 48 hours). If delayed, it automatically escalates to the Department Head.',
      tips: '⏱️ Tip: You will receive live status alerts on your phone and email at every milestone.'
    },
    {
      icon: ShieldCheck,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: 'Step 3 of 3: You Hold the Final Word',
      title: 'Dispute Appeals & Honest Ratings',
      description: 'When an officer marks your issue as resolved, you inspect the work. If you are satisfied, leave a 5-star rating. If the work was incomplete, click "Appeal & Dispute" to reopen the case directly with the Institutional Ombudsman.',
      tips: '🛡️ Tip: Your complaints are cryptographically locked so records can never be erased or modified.'
    }
  ];

  if (!isModalOpen) return null;

  const stepData = steps[currentStep];
  const StepIcon = stepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-950/60 border border-white/10 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Skip Guide"
          >
            <X size={16} />
          </button>

          {/* Step Badge & Icon */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${stepData.color} shadow-md`}>
              <StepIcon size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                {stepData.badge}
              </span>
              <h3 className="text-lg font-heading font-black text-white tracking-tight">
                {stepData.title}
              </h3>
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
            <p>{stepData.description}</p>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs text-indigo-200 font-medium leading-relaxed">
              {stepData.tips}
            </div>
          </div>

          {/* Stepper Dots & Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-5 border-t border-white/10">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-indigo-500'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-white/10 transition-colors cursor-pointer"
                >
                  Previous
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-400/30"
                >
                  <Check size={14} />
                  <span>Ready to Use!</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GuidedTourModal;
