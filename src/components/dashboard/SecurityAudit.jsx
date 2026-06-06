import React, { useState, useEffect } from 'react';
import { Shield, Terminal, Clock, MapPin, Fingerprint, Loader2, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

export const SecurityAudit = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setAuditLogs(data);
          setIsConnected(true);
        }
      } catch (err) {
        // Fallback for demo without DB
      }
    };

    fetchLogs();

    const channel = supabase
      .channel('audit-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setAuditLogs((prev) => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-wider flex items-center gap-2.5">
             <Shield className="text-primary-bright w-5 h-5" /> Zero-Trust Access Logs
          </h3>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mt-1">Real-time perimeter monitoring & internal audit trail.</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${
          isConnected 
            ? 'bg-success/5 border-success/20 text-success' 
            : 'bg-warning/5 border-warning/20 text-warning'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-warning animate-bounce'}`} />
          {isConnected ? 'MONITORING_ACTIVE' : 'CONNECTING_TO_KERNEL...'}
        </div>
      </div>

      <div className="space-y-4">
        {auditLogs.length > 0 ? (
          auditLogs.map((log, idx) => {
            const logAction = log.action || log.event || 'Unknown Action';
            const logDetails = log.details || {};
            const logLevel = logDetails.level || log.level || 'info';
            const logEmail = logDetails.user_email || log.user_email || 'System Operator';
            const logLocation = logDetails.location || log.location || 'Kernel Node';

            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={log.id} 
                className="bg-surface border border-border/80 p-5 hover:border-primary-bright/20 transition-all rounded-xl shadow-xs group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-[1.02] ${
                      logLevel === 'critical' ? 'bg-error/5 border-error/20 text-error' : 
                      logLevel === 'warning' ? 'bg-warning/5 border-warning/20 text-warning' : 
                      'bg-primary-bright/5 border-primary-bright/10 text-primary-bright'
                    }`}>
                      <Terminal size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-foreground text-xs uppercase tracking-wide">{logAction}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded ${
                          logLevel === 'critical' ? 'border-error/20 text-error bg-error/5' : 
                          'border-border text-muted-foreground bg-muted/30'
                        }`}>{logLevel}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><Fingerprint size={12} className="text-muted-foreground/60" /> {logEmail}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-muted-foreground/60" /> {logLocation}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 justify-start sm:justify-end uppercase tracking-wider mb-1">
                      <Clock size={12} /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-mono">NODE_IP: {log.ip_address}</div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="p-12 border border-dashed border-border/80 bg-surface/30 rounded-xl flex flex-col items-center justify-center text-center">
            <Activity className="text-muted-foreground/40 w-10 h-10 mb-3" />
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Awaiting system audit streams...</p>
          </div>
        )}
      </div>
      
      <div className="p-5 bg-surface border border-border/80 rounded-xl text-[10px] text-muted-foreground tracking-wider leading-relaxed">
        <p className="mb-3 uppercase font-black text-foreground tracking-wider border-b border-border/60 pb-3 flex items-center gap-2">
          <ShieldCheck size={14} className="text-primary-bright" /> Institutional O.S. Security Protocol v7.1
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-semibold">
          <p className="flex items-center gap-2"><Activity size={12} className="text-primary-bright" /> SYSLOG_INTEGRITY: <span className="text-success font-bold">STABLE</span></p>
          <p className="flex items-center gap-2"><Cpu size={12} className="text-primary-bright" /> ENCRYPTION: <span className="text-primary-bright font-bold">AES-256GCM</span></p>
          <p className="flex items-center gap-2 text-muted-foreground/60"><Terminal size={12} /> NODE_CLUSTER: <span className="text-foreground">ACTIVE_03</span></p>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
