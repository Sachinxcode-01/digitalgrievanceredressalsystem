import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Download, X, CheckCircle2, 
  WifiOff, Sparkles, BellRing, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
    }
    return false;
  });

  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('dg_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast.success('ResolveNow installed successfully on your device! 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Manual instruction fallback for iOS / unsupported browsers
      toast('To install: Tap Share (📤) and select "Add to Home Screen" 📲', {
        icon: '💡',
        duration: 5000
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Installing ResolveNow App...');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('dg_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-20 left-4 sm:left-6 z-40 max-w-sm w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-left font-sans overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
            <Smartphone size={20} />
          </div>

          <div className="space-y-1 pr-4">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
              Native App Experience
            </span>
            <h4 className="text-xs font-heading font-black text-white">
              Install ResolveNow App
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Faster 1-tap launch from Home Screen, offline draft storage, and instant SLA notifications.
            </p>
          </div>
        </div>

        {/* Features micro-badges */}
        <div className="flex items-center gap-2 pt-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 size={11} /> Offline Ready
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <BellRing size={11} /> Push Alerts
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-3.5 mt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-white/10 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
