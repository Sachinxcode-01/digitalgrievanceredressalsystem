import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'text-slate-500 bg-white/[0.03] border-white/[0.05]',
    'In-Progress': 'text-warning bg-warning/10 border-warning/20',
    'Resolved': 'text-success bg-success/10 border-success/20',
  };
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border backdrop-blur-md shadow-sm ${styles[status] || styles['Pending']} transition-all duration-300`}>
      {status}
    </span>
  );
};

export default StatusBadge;
