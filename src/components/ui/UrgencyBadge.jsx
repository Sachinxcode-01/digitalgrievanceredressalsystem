import React from 'react';

const UrgencyBadge = ({ level }) => {
  const styles = {
    'High': 'text-error border-error/20 bg-error/5 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    'Medium': 'text-warning border-warning/20 bg-warning/5',
    'Low': 'text-success border-success/20 bg-success/5'
  };
  
  return (
    <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border backdrop-blur-sm ${styles[level] || styles['Low']} transition-all duration-300`}>
      <span className={`w-2 h-2 rounded-full ${
        level === 'High' ? 'bg-error shadow-[0_0_10px_#ef4444] animate-pulse' : 
        level === 'Medium' ? 'bg-warning shadow-[0_0_8px_#f59e0b]' : 
        'bg-success'
      }`}></span>
      <span className="text-[10px] font-black uppercase tracking-[0.15em]">
        {level}
      </span>
    </div>
  );
};

export default UrgencyBadge;
