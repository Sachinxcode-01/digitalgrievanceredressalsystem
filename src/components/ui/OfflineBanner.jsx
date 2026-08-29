import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, ShieldAlert } from 'lucide-react';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.aside
          role="status"
          aria-live="assertive"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-9999 bg-linear-to-r from-amber-600/90 via-orange-600/90 to-red-600/90 backdrop-blur-md text-white px-4 py-2.5 shadow-2xl border-b border-amber-400/30 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium"
        >
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" aria-hidden="true" />
          <span>
            <strong>Offline Mode:</strong> Internet connection lost. Your grievance drafts are stored locally and will sync once reconnected.
          </span>
        </motion.aside>
      )}

      {isOnline && showReconnected && (
        <motion.aside
          role="status"
          aria-live="polite"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-9999 bg-linear-to-r from-emerald-600/90 to-teal-600/90 backdrop-blur-md text-white px-4 py-2.5 shadow-xl border-b border-emerald-400/30 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium"
        >
          <Wifi className="w-4 h-4 text-emerald-200 shrink-0" aria-hidden="true" />
          <span>
            <strong>Connection Restored!</strong> You are back online. Real-time updates and ticket submissions are active.
          </span>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
