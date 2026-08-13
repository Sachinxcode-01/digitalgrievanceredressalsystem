import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from './GlassPanel';

export const FAQAccordion = ({ faqs = [] }) => {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="space-y-3 w-full">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <GlassPanel key={idx} className="p-0 overflow-hidden" intensity="medium">
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full px-6 py-4.5 flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider text-left hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>{faq.q}</span>
              <span className="text-lg font-mono font-bold ml-4 text-indigo-400">
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
                  className="px-6 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 text-left"
                >
                  {faq.a}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
