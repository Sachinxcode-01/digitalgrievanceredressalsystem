import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'text-muted-foreground bg-background/50 border-border/50',
    'In-Progress': 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]',
    'Resolved': 'text-success bg-success/10 border-success/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]',
  };
  
  return (
    <span className={`px-3 py-1 border text-[9px] font-mono font-bold uppercase tracking-widest rounded-full ${styles[status] || styles['Pending']} transition-all duration-200 select-none`}>
      {status === 'In-Progress' ? 'ACTIVE_SYNC' : status.toUpperCase()}
    </span>
  );
};

export default StatusBadge;
