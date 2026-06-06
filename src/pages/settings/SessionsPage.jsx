import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { Laptop, Smartphone, Monitor, ShieldCheck, Power, AlertCircle, MapPin, Globe, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const SessionsPage = () => {
  const { getSessions, revokeSession, revokeAllSessions } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores sessionId of active action

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data || []);
    } catch (err) {
      toast.error('Failed to retrieve active sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to sign out this device?')) {
      setActionLoading(sessionId);
      try {
        await revokeSession(sessionId);
        toast.success('Session terminated successfully.');
        // Remove from local list
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (err) {
        toast.error('Failed to revoke session.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleRevokeAllSessions = async () => {
    if (window.confirm('Are you sure you want to sign out all other devices?')) {
      setActionLoading('all');
      try {
        await revokeAllSessions();
        toast.success('All other sessions signed out.');
        // Filter local list to keep only current
        setSessions(prev => prev.filter(s => s.isCurrent));
      } catch (err) {
        toast.error('Failed to revoke sessions.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getDeviceIcon = (deviceInfo = '') => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('ios') || info.includes('iphone')) {
      return <Smartphone className="w-5 h-5 text-primary" />;
    }
    if (info.includes('windows') || info.includes('mac') || info.includes('linux')) {
      return <Laptop className="w-5 h-5 text-primary" />;
    }
    return <Monitor className="w-5 h-5 text-primary" />;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-muted/60 border border-border rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 text-foreground text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl font-heading font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Device Sessions
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Monitor and manage devices currently signed into your institutional profile.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAllSessions}
            disabled={actionLoading === 'all'}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border hover:border-error/30 hover:bg-error/5 text-muted-foreground hover:text-error rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            <Power className="w-4 h-4" />
            Sign Out All Other Devices
          </button>
        )}
      </div>

      {/* Session List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
              session.isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border/80 bg-background/50 hover:bg-background'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-center">
                {getDeviceIcon(session.device_info)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground text-sm">
                    {session.device_info || 'Unknown Device'}
                  </span>
                  {session.isCurrent && (
                    <span className="text-[9px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full font-mono uppercase tracking-wider font-bold">
                      Current Session
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
                    IP: {session.ip_address}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {session.login_location || 'Unknown Location'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                    Last Active: {new Date(session.last_active_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              {!session.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={actionLoading !== null}
                  className="p-2.5 bg-background border border-border hover:border-error/30 hover:bg-error/5 text-muted-foreground hover:text-error rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
                  title="Revoke session"
                >
                  <Power className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-foreground font-bold text-sm">No active sessions detected</h3>
            <p className="text-xs text-muted-foreground mt-1">This is unexpected. Please refresh.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
