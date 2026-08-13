import React from 'react';
import { motion } from 'framer-motion';

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
  className = '',
  iconColor = 'text-indigo-400',
  iconBg = 'bg-indigo-500/10 border-indigo-500/20',
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative rounded-3xl p-6 bg-slate-950/80 backdrop-blur-xl 
        border border-white/10 hover:border-indigo-500/30 
        shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 
        flex flex-col justify-between text-left group transition-all duration-300
        ${className}
      `}
      {...props}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className={`w-11 h-11 rounded-2xl ${iconBg} border flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
              <Icon size={20} />
            </div>
          )}
          {badge && (
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-base font-heading font-black text-white group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Bottom accent glow bar */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 transition-colors">
        <span>Verified Enterprise Feature</span>
        <span className="text-indigo-400 font-bold">&rarr;</span>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
