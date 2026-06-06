import React, { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export const NotificationCenter = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem('nexus_alerts');
      return cached ? JSON.parse(cached).map(n => ({ ...n, time: new Date(n.time) })) : [];
    } catch {
      return [];
    }
  });

  // Persist alerts to cache
  useEffect(() => {
    try {
      localStorage.setItem('nexus_alerts', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    // 1. Listen for local custom notification events (legacy fallback support)
    const handleNotification = (e) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        time: new Date(),
        read: false,
        ...e.detail
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 10));
      setHasUnread(true);
    };
    window.addEventListener('app-notification', handleNotification);

    // 2. Realtime listener setup
    if (!user || !user.id) {
      return () => {
        window.removeEventListener('app-notification', handleNotification);
      };
    }

    const isAdmin = user.role === 'admin' || user.role === 'super admin';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(user.id);

    const activeChannels = [];

    if (isAdmin) {
      // Admin subscriptions
      // A. Listen for ALL new grievances
      const adminGrievanceChan = supabase
        .channel('admin-notif-grievances')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'grievances' },
          (payload) => {
            const newNotif = {
              id: Date.now() + Math.random(),
              title: 'Grievance Submission',
              message: `New ticket ${payload.new.ticket_id} filed under ${payload.new.category}.`,
              type: 'info',
              time: new Date(),
              read: false
            };
            setNotifications(prev => [newNotif, ...prev].slice(0, 10));
            setHasUnread(true);
            toast(`New Grievance: ${payload.new.ticket_id}`, { icon: '📝' });
          }
        )
        .subscribe();
      activeChannels.push(adminGrievanceChan);

      // B. Listen for system security alerts
      const adminSystemAlertsChan = supabase
        .channel('admin-notif-alerts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'system_alerts' },
          (payload) => {
            const newNotif = {
              id: Date.now() + Math.random(),
              title: 'Kernel Alert',
              message: payload.new.message,
              type: payload.new.priority === 'high' ? 'error' : 'warning',
              time: new Date(),
              read: false
            };
            setNotifications(prev => [newNotif, ...prev].slice(0, 10));
            setHasUnread(true);
            if (payload.new.priority === 'high') {
              toast.error(`CRITICAL: ${payload.new.message}`, { duration: 6000 });
            } else {
              toast.warn(`System Alert: ${payload.new.message}`);
            }
          }
        )
        .subscribe();
      activeChannels.push(adminSystemAlertsChan);

    } else {
      // Citizen subscriptions
      // A. Listen for status changes on OWN grievances
      if (isUuid) {
        const citizenGrievanceChan = supabase
          .channel('citizen-notif-grievances')
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'grievances',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              if (payload.old.status !== payload.new.status) {
                const newNotif = {
                  id: Date.now() + Math.random(),
                  title: 'Status Modified',
                  message: `Ticket ${payload.new.ticket_id} updated from ${payload.old.status} to ${payload.new.status}.`,
                  type: 'success',
                  time: new Date(),
                  read: false
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 10));
                setHasUnread(true);
                toast.success(`Ticket ${payload.new.ticket_id} updated: ${payload.new.status}`);
              }
            }
          )
          .subscribe();
        activeChannels.push(citizenGrievanceChan);
      }

      // B. Listen for comments on OWN grievances
      const citizenCommentsChan = supabase
        .channel('citizen-notif-comments')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ticket_comments' },
          async (payload) => {
            // Verify if comment is written by someone else and belongs to current user's ticket
            if (payload.new.user_id !== user.id) {
              const { data: ticket } = await supabase
                .from('grievances')
                .select('ticket_id, user_id')
                .eq('id', payload.new.grievance_id)
                .single();
              
              if (ticket && ticket.user_id === user.id) {
                const newNotif = {
                  id: Date.now() + Math.random(),
                  title: 'Official Clarification',
                  message: `New comment posted on ticket ${ticket.ticket_id}.`,
                  type: 'info',
                  time: new Date(),
                  read: false
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 10));
                setHasUnread(true);
                toast(`New update on ticket ${ticket.ticket_id}`, { icon: '💬' });
              }
            }
          }
        )
        .subscribe();
      activeChannels.push(citizenCommentsChan);
    }

    return () => {
      window.removeEventListener('app-notification', handleNotification);
      activeChannels.forEach(chan => supabase.removeChannel(chan));
    };
  }, [user?.id, user?.role]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-success" size={14} />;
      case 'warning': return <AlertCircle className="text-warning" size={14} />;
      case 'error': return <ShieldAlert className="text-error" size={14} />;
      default: return <Info className="text-primary" size={14} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }}
        className="relative p-2 rounded-xl bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute right-0 mt-3 w-80 z-50 glass-card p-0 overflow-hidden shadow-xl border border-border/60 bg-surface text-left"
            >
              <div className="p-3.5 border-b border-border/50 flex items-center justify-between bg-background/50">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">Operational Alerts</h4>
                <button 
                  onClick={markAllRead} 
                  className="text-[9px] font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                      <Clock size={16} />
                    </div>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">No new alerts recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 hover:bg-muted/40 transition-colors cursor-default ${n.read ? 'opacity-50' : ''}`}>
                        <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-bold text-foreground leading-tight">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground leading-normal">{n.message}</p>
                            <p className="text-[8px] text-muted-foreground/60 font-mono">
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
                <div className="p-2.5 border-t border-border/50 text-center bg-background/50">
                   <p className="text-[8px] text-muted-foreground font-black uppercase tracking-wider font-mono">Encrypted Alert Protocol</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
