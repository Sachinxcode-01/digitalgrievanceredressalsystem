import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import AnimatedButton from './AnimatedButton';

export const AnimatedNavbar = ({ user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Track Status', href: '/public-status' },
    { name: 'System Status', href: '/status' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 pointer-events-none">
      <div className={`max-w-6xl mx-auto px-4 pt-3 transition-all duration-500 ${scrolled ? 'translate-y-1' : ''}`}>
        <div
          className={`
            pointer-events-auto rounded-full transition-all duration-500 border p-2 pl-5 pr-3 flex items-center justify-between
            ${scrolled
              ? 'bg-slate-950/85 backdrop-blur-2xl border-white/15 shadow-2xl shadow-black/80'
              : 'bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-lg'}
          `}
        >
          {/* Logo with Glow */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="ResolveNow — Home">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-sm group-hover:blur-md transition-all" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-black text-sm tracking-wider bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent uppercase">
                ResolveNow
              </span>
              <span className="text-[8px] font-mono font-bold tracking-widest text-indigo-400 uppercase -mt-0.5">
                Redressal Node
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-white/10"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 to-cyan-600/40 border border-indigo-400/40 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link to={user.role === 'admin' || user.role === 'super admin' ? '/admin/dashboard' : '/dashboard'}>
                <AnimatedButton variant="glow" size="sm" rightIcon={ArrowRight}>
                  Dashboard
                </AnimatedButton>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <AnimatedButton variant="outline" size="sm">
                    Sign In
                  </AnimatedButton>
                </Link>
                <Link to="/register">
                  <AnimatedButton variant="glow" size="sm" rightIcon={ArrowRight}>
                    Get Started
                  </AnimatedButton>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-full bg-slate-900 border border-white/10 transition-colors"
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden pointer-events-auto max-w-6xl mx-4 mt-2 bg-slate-950/95 border border-white/15 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={location.pathname === link.href ? 'page' : undefined}
                  className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-indigo-400 py-1.5 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                {user ? (
                  <Link
                    to={user.role === 'admin' || user.role === 'super admin' ? '/admin/dashboard' : '/dashboard'}
                    onClick={() => setMobileOpen(false)}
                  >
                    <AnimatedButton variant="glow" size="md" className="w-full">
                      Dashboard
                    </AnimatedButton>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <AnimatedButton variant="outline" size="md" className="w-full">
                        Sign In
                      </AnimatedButton>
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>
                      <AnimatedButton variant="glow" size="md" className="w-full">
                        Get Started
                      </AnimatedButton>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AnimatedNavbar;
