import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, UserCheck, 
  ExternalLink, X, Smartphone, Sparkles, Volume2 
} from 'lucide-react';
import { webPushService, playMilestoneChime } from '../../services/webPushService';
import toast from 'react-hot-toast';

export const LiveDeliveryAlertBanner = () => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [pushStatus, setPushStatus] = useState(() => webPushService.getPermission());
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    const handleMilestoneAlert = (e) => {
      setActiveAlert(e.detail);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setActiveAlert(null);
      }, 8000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('delivery-milestone-alert', handleMilestoneAlert);
    return () => window.removeEventListener('delivery-milestone-alert', handleMilestoneAlert);
  }, []);

  const handleEnablePush = async () => {
    const res = await webPushService.requestPermission();
    setPushStatus(res);
    if (res === 'granted') {
      playMilestoneChime();
      toast.success('Live Browser Push Alerts Enabled! 🔔');
      webPushService.sendPushNotification('ResolveNow Alert Engine Activated', {
        body: 'You will receive real-time push alerts whenever your grievance changes milestone status.'
      });
      setShowPermissionPrompt(false);
    } else {
      toast.error('Browser notification permission was not granted.');
    }
  };

  return (
    <>
      {/* Floating Real-time Delivery Milestone Notification Toast */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed top-6 right-4 md:right-8 z-50 max-w-md w-full bg-surface/95 backdrop-blur-2xl border-2 border-primary/30 rounded-3xl p-5 shadow-2xl shadow-primary/20 text-left overflow-hidden"
          >
            {/* Top Glowing Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="font-mono text-xs font-black uppercase tracking-wider text-primary">
                  Live Delivery Milestone Dispatch
                </span>
              </div>
              <button 
                onClick={() => setActiveAlert(null)}
                className="p-1 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-3 space-y-2">
              <h4 className="font-heading font-black text-foreground text-sm flex items-center gap-2">
                {activeAlert.status === 'Resolved' ? <CheckCircle2 className="text-success" size={16} /> :
                 activeAlert.status === 'Escalated' ? <AlertTriangle className="text-warning" size={16} /> :
                 activeAlert.status === 'Assigned' ? <UserCheck className="text-primary" size={16} /> :
                 <Clock className="text-primary" size={16} />}
                {activeAlert.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeAlert.message}
              </p>
            </div>

            {/* Simulated SMS Alert Preview */}
            {activeAlert.smsPreview && (
              <div className="mt-2 bg-background/80 border border-border/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-muted-foreground font-mono">
                <Smartphone size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="truncate">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-primary">Multi-Channel SMS Telemetry</p>
                  <p className="truncate text-foreground">{activeAlert.smsPreview}</p>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
              {activeAlert.ticketId && (
                <a
                  href={`/public-status?ticketId=${activeAlert.ticketId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <ExternalLink size={13} />
                  <span>View Delivery Milestone</span>
                </a>
              )}

              {pushStatus !== 'granted' && (
                <button
                  onClick={handleEnablePush}
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Bell size={13} />
                  <span>Enable Push Alerts</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Reminder Widget if push status is default */}
      {showPermissionPrompt && pushStatus === 'default' && (
        <div className="fixed bottom-6 left-6 z-40 bg-surface/90 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-xl max-w-xs text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="text-primary" size={18} />
              <h5 className="font-bold text-xs text-foreground">Enable Web Push?</h5>
            </div>
            <button onClick={() => setShowPermissionPrompt(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Get instant desktop alerts when an officer accepts or resolves your grievance.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={handleEnablePush} className="btn-primary text-xs py-1 px-2.5 font-bold">
              Allow Notifications
            </button>
            <button onClick={() => setShowPermissionPrompt(false)} className="btn-secondary text-xs py-1 px-2">
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
};
