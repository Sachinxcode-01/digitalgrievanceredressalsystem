import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to monitor client connectivity and Supabase connection health.
 * Triggers recovery actions when transitioning back online.
 * 
 * @param {Function} onReconnect - Optional callback triggered on network restoration
 */
export const useRealtimeConnection = (onReconnect) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onReconnect) onReconnect();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let healthChannel = null;
    try {
      healthChannel = supabase.channel('system_health_ping');
      healthChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED') {
          setIsRealtimeConnected(false);
        }
      });
    } catch {
      // Supabase is not configured or unavailable — stay optimistic.
      // setIsRealtimeConnected is already true by default; no state update needed.
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (healthChannel) {
        supabase.removeChannel(healthChannel).catch(() => {});
      }
    };
  }, []);

  return {
    isOnline,
    isRealtimeConnected,
    isSystemHealthy: isOnline,
    connectionState: !isOnline ? 'OFFLINE' : 'ONLINE'
  };
};

export default useRealtimeConnection;
