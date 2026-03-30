import React, { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Listen for custom notification events from dashboards
    const handleNotification = (e) => {
      const newNotif = {
        id: Date.now(),
        time: new Date(),
        read: false,
        ...e.detail
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
      setHasUnread(true);
    };

    window.addEventListener('app-notification', handleNotification);
    return () => window.removeEventListener('app-notification', handleNotification);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-success" size={16} />;
      case 'warning': return <AlertCircle className="text-warning" size={16} />;
      case 'error': return <X className="text-error" size={16} />;
      default: return <Info className="text-primary" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 z-50 glass-card p-0 overflow-hidden shadow-2xl border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Security Alerts</h4>
                <button onClick={markAllRead} className="text-[9px] font-black uppercase tracking-wider text-primary hover:text-white transition-colors">Mark all read</button>
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-600">
                      <Clock size={20} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">No new protocols recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 hover:bg-white/5 transition-all cursor-default ${n.read ? 'opacity-60' : ''}`}>
                        <div className="flex gap-3">
                          <div className="mt-1">{getIcon(n.type)}</div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-2">{n.message}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">
                              {formatDistanceToNow(n.time, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/10 text-center bg-white/[0.01]">
                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Encrypted Session Protocol</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
