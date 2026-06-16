import React, { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../api/apiClient';

export const NotificationCenter = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem('nexus_alerts');
      return cached ? JSON.parse(cached).map(n => ({ ...n, time: new Date(n.time) })) : [];
    } catch {
      return [];
    }
  });

  const hasUnread = notifications.some(n => !n.read);

  // Persist alerts to cache
  useEffect(() => {
    try {
      localStorage.setItem('nexus_alerts', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to persist alerts:', e);
    }
  }, [notifications]);

  const fetchDbNotifications = async () => {
    try {
      const res = await apiClient.get('/user/notifications');
      const mapped = (res.data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        time: new Date(n.created_at),
        read: n.is_read
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDbNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDbNotifications();
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    // 1. Listen for local custom notification events (legacy fallback support)
    const handleNotification = (e) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        time: new Date(),
        read: false,
        ...e.detail
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    };
    window.addEventListener('app-notification', handleNotification);

    // 2. Realtime listener setup
    if (!user || !user.id) {
      return () => {
        window.removeEventListener('app-notification', handleNotification);
      };
    }

    const notifChan = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'in_app_notifications', 
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            time: new Date(payload.new.created_at),
            read: payload.new.is_read
          };
          setNotifications(prev => {
            if (prev.some(p => p.id === newNotif.id)) return prev;
            return [newNotif, ...prev].slice(0, 50);
          });
          toast(payload.new.title, { icon: '🔔' });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('app-notification', handleNotification);
      supabase.removeChannel(notifChan);
    };
  }, [user?.id]);

  const markAllRead = async () => {
    try {
      await apiClient.put('/user/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/user/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
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
        onClick={() => setIsOpen(!isOpen)}
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
                      <div 
                        key={n.id} 
                        onClick={() => !n.read && handleMarkAsRead(n.id)}
                        className={`p-4 hover:bg-muted/40 transition-colors ${n.read ? 'opacity-50 cursor-default' : 'cursor-pointer bg-primary/5'}`}
                      >
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
