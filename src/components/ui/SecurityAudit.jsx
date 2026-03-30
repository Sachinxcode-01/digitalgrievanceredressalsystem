import React from 'react';
import { Shield, Terminal, Clock, MapPin, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export const SecurityAudit = () => {
  const auditLogs = [
    { id: 1, event: 'Admin Session Initiated', user: 'admin@system.gov', ip: '192.168.1.105', location: 'Internal Node 4', time: '2 mins ago', level: 'info' },
    { id: 2, event: 'AI Triage Override', user: 'system.daemon', ip: 'local.host', location: 'Neural Gateway', time: '14 mins ago', level: 'warning' },
    { id: 3, event: 'Sensitive Ticket View', user: 'admin@system.gov', ip: '192.168.1.105', location: 'Internal Node 4', time: '1 hour ago', level: 'info' },
    { id: 4, event: 'Encryption Key Rotation', user: 'security.bot', ip: '0.0.0.0', location: 'Vault-01', time: '3 hours ago', level: 'critical' },
    { id: 5, event: 'Failed Access Attempt', user: 'unknown_guest', ip: '45.12.89.22', location: 'Outside Perimeter', time: '5 hours ago', level: 'critical' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-3">
             <Shield className="text-primary" /> Zero-Trust Access Logs
          </h3>
          <p className="text-slate-500 text-sm mt-1">Real-time perimeter monitoring & internal audit trail.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Active Monitoring
        </div>
      </div>

      <div className="space-y-3">
        {auditLogs.map((log, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={log.id} 
            className="glass-card p-4 hover:border-primary/30 group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  log.level === 'critical' ? 'bg-error/10 border-error/20 text-error' : 
                  log.level === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' : 
                  'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  <Terminal size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{log.event}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      log.level === 'critical' ? 'border-error/30 text-error bg-error/5' : 
                      'border-white/5 text-slate-500'
                    }`}>{log.level}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Fingerprint size={12} /> {log.user}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {log.location}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-2 justify-end">
                  <Clock size={12} /> {log.time}
                </div>
                <div className="text-[9px] text-slate-600 mt-1 uppercase tracking-tight">IP: {log.ip}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-primary/60">
        <p className="mb-2 uppercase font-black text-slate-700 tracking-[0.2em]">Security Protocol v4.2</p>
        <p>{'>'} SYSLOG_INTEGRITY_CHECK: PASSED</p>
        <p>{'>'} ENCRYPTION_LAYER: AES-256GCM</p>
        <p>{'>'} THREAT_INTEL: 0 ACTIVE INCIDENTS</p>
      </div>
    </div>
  );
};
