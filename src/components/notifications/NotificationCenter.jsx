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

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  // Web Audio API soft chime generator
  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* AudioContext muted or unsupported — ignore */ }
  };

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
    const handleNotification = (e) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        time: new Date(),
        read: false,
        ...e.detail
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      playChimeSound();
    };
    window.addEventListener('app-notification', handleNotification);

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
          playChimeSound();
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
      toast.success('All notifications marked as read.');
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

  const handleDeleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-400" size={14} />;
      case 'warning': return <AlertCircle className="text-amber-400" size={14} />;
      case 'error': return <ShieldAlert className="text-rose-400" size={14} />;
      default: return <Info className="text-indigo-400" size={14} />;
    }
  };

  const displayedNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-background/80 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-[9px] font-black text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
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
              className="absolute right-0 mt-3 w-84 z-50 glass-card p-0 overflow-hidden shadow-2xl border border-border/60 bg-slate-950/95 backdrop-blur-xl text-left rounded-2xl"
            >
              <div className="p-3.5 border-b border-border/50 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Live System Alerts</h4>
                  {hasUnread && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-bold">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={markAllRead} 
                    className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Mark read
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-slate-950 px-3 py-1.5 gap-2 text-[10px] font-bold uppercase">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {displayedNotifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Clock size={16} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No alerts to display.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {displayedNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.read && handleMarkAsRead(n.id)}
                        className={`p-3.5 hover:bg-white/5 transition-colors group relative ${
                          n.read ? 'opacity-60 bg-transparent' : 'bg-indigo-500/10'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                          <div className="space-y-1 text-left flex-1 pr-4">
                            <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {formatDistanceToNow(n.time, { addSuffix: true })}
                            </p>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all absolute right-2 top-2"
                            title="Remove alert"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2.5 border-t border-white/10 text-center bg-slate-900/60">
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Encrypted WebSockets Channel</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
