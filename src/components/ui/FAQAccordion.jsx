import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQAccordion = ({ faqs = [] }) => {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="space-y-2.5 w-full max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div 
            key={idx} 
            className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-slate-100 font-semibold text-xs sm:text-sm text-left hover:text-indigo-400 transition-colors cursor-pointer gap-4"
            >
              <span>{faq.q}</span>
              <span className="text-base font-mono font-bold text-indigo-400 shrink-0">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5 text-left font-normal"
                >
                  {faq.a}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
