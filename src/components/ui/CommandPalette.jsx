import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, LayoutDashboard, Ticket, FileText, 
  ShieldCheck, Landmark, Activity, HelpCircle, Sun, 
  Moon, ArrowRight, CornerDownLeft, Sparkles, Building2,
  Clock, Hash, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Keyboard shortcut listener: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Command items definitions
  const commands = [
    // Navigation
    { id: 'nav-home', category: 'Navigation', title: 'Portal Gateway / Home', icon: Landmark, action: () => navigate('/') },
    { id: 'nav-dash', category: 'Navigation', title: 'Citizen Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard') },
    { id: 'nav-submit', category: 'Navigation', title: 'File New Grievance', icon: Plus, badge: 'Quick Action', action: () => navigate('/submit') },
    { id: 'nav-my', category: 'Navigation', title: 'My Grievances Registry', icon: Ticket, action: () => navigate('/grievances') },
    { id: 'nav-track', category: 'Navigation', title: 'Public Status & Milestone Tracker', icon: Clock, action: () => navigate('/track') },
    { id: 'nav-transparency', category: 'Navigation', title: 'Public Transparency Scorecard', icon: ShieldCheck, badge: 'Leaderboard', action: () => navigate('/transparency') },
    { id: 'nav-verify', category: 'Navigation', title: 'Cryptographic Hash Verifier', icon: Hash, action: () => navigate('/verify-hash') },
    { id: 'nav-status', category: 'Navigation', title: 'System SLA & Health Status', icon: Activity, action: () => navigate('/status') },

    // Department Quick Filters
    { id: 'dept-it', category: 'Departments', title: 'IT Support & Campus Wi-Fi', icon: Building2, action: () => navigate('/grievances?category=IT+Support') },
    { id: 'dept-acad', category: 'Departments', title: 'Academic Registrar & Exams', icon: Building2, action: () => navigate('/grievances?category=Academic') },
    { id: 'dept-maint', category: 'Departments', title: 'Hostel & Infrastructure Maintenance', icon: Building2, action: () => navigate('/grievances?category=Maintenance') },
    { id: 'dept-fin', category: 'Departments', title: 'Finance & Student Accounts', icon: Building2, action: () => navigate('/grievances?category=Financial') },

    // Quick Actions
    { id: 'act-guide', category: 'Actions', title: 'Open 30-Second Guided Tour', icon: HelpCircle, action: () => {
      localStorage.removeItem('dg_onboarding_seen');
      navigate('/dashboard');
      toast.success('Launching Interactive Guide...');
    }},
    { id: 'act-theme-dark', category: 'Actions', title: 'Switch to Midnight Cyber Theme', icon: Moon, action: () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      toast.success('Midnight Cyber Theme active');
    }},
    { id: 'act-theme-light', category: 'Actions', title: 'Switch to Crystal Light Theme', icon: Sun, action: () => {
      document.documentElement.setAttribute('data-theme', 'light');
      toast.success('Crystal Light Theme active');
    }}
  ];

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  });

  // Direct Ticket Search Fallback
  const isTicketQuery = query.trim().toUpperCase().startsWith('TKT') || query.trim().toUpperCase().startsWith('#TKT') || query.trim().length >= 6;

  const handleExecute = (cmd) => {
    setIsOpen(false);
    if (cmd && cmd.action) {
      cmd.action();
    }
  };

  const handleTicketDirectJump = () => {
    const clean = query.replace('#', '').trim();
    setIsOpen(false);
    navigate(`/track?ticket=${encodeURIComponent(clean)}`);
    toast.success(`Jumping to ticket #${clean}...`);
  };

  // Keyboard navigation within list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length + (isTicketQuery ? 1 : 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length + (isTicketQuery ? 1 : 0)) % (filteredCommands.length + (isTicketQuery ? 1 : 0)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isTicketQuery && selectedIndex === 0) {
        handleTicketDirectJump();
      } else {
        const item = filteredCommands[isTicketQuery ? selectedIndex - 1 : selectedIndex];
        if (item) handleExecute(item);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md">
          {/* Backdrop Click */}
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative z-10 text-left font-sans"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-slate-950/60">
              <Search className="text-indigo-400 shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, page, department, or ticket ID..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none font-medium"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-500 hover:text-white rounded-md cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px] font-mono text-slate-400">
                  ESC
                </span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {/* Direct Ticket Jump Option */}
              {isTicketQuery && (
                <div
                  onClick={handleTicketDirectJump}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    selectedIndex === 0 ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Hash size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        Search & Track Ticket "{query.trim()}"
                      </span>
                      <span className="text-[10px] text-indigo-300/80 block font-mono">
                        Jump to public receipt & live SLA milestones
                      </span>
                    </div>
                  </div>
                  <CornerDownLeft size={14} className="opacity-70" />
                </div>
              )}

              {filteredCommands.length === 0 && !isTicketQuery ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No matching actions or pages found for "{query}".
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const actualIdx = isTicketQuery ? idx + 1 : idx;
                  const isSelected = selectedIndex === actualIdx;
                  const Icon = cmd.icon;

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => handleExecute(cmd)}
                      onMouseEnter={() => setSelectedIndex(actualIdx)}
                      className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-slate-950 text-slate-400 border-white/10'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold block">
                              {cmd.title}
                            </span>
                            {cmd.badge && (
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              }`}>
                                {cmd.badge}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block font-mono ${
                            isSelected ? 'text-indigo-200' : 'text-slate-500'
                          }`}>
                            {cmd.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-60">
                        <CornerDownLeft size={13} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Shortcuts */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">↓</kbd>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">↵</kbd>
                  <span>to select</span>
                </span>
              </div>
              <span className="text-indigo-400 font-bold">
                ResolveNow Command Spotlight
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
