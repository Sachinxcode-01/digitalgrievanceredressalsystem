import React from 'react';

const UrgencyBadge = ({ level }) => {
  const styles = {
    'High': 'text-error border-error/20 bg-error/10 shadow-[0_0_12px_rgba(239,68,68,0.05)]',
    'Medium': 'text-warning border-warning/20 bg-warning/10 shadow-[0_0_12px_rgba(245,158,11,0.05)]',
    'Low': 'text-muted-foreground border-border/50 bg-background/50'
  };
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg ${styles[level] || styles['Low']} transition-all duration-200 select-none`}>
      <span className={`w-1 h-1 rounded-full ${
        level === 'High' ? 'bg-error shadow-[0_0_6px_var(--color-error)] animate-pulse' : 
        level === 'Medium' ? 'bg-warning shadow-[0_0_6px_var(--color-warning)]' : 
        'bg-muted-foreground'
      }`}></span>
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
        LVL_{level.toUpperCase()}
      </span>
    </div>
  );
};

export default UrgencyBadge;
