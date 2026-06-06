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

    // Watch Supabase websocket status
    // Supabase JS v2 doesn't expose public websocket instance directly, but we can verify status via channel subscriptions
    const healthChannel = supabase.channel('system_health_ping');
    
    healthChannel
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(healthChannel);
    };
  }, [onReconnect]);

  return {
    isOnline,
    isRealtimeConnected,
    isSystemHealthy: isOnline && isRealtimeConnected,
    connectionState: !isOnline ? 'OFFLINE' : (!isRealtimeConnected ? 'RECONNECTING' : 'ONLINE')
  };
};

export default useRealtimeConnection;
