import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Ticket, Users, User, Settings, Moon, Sun, Shield, ShieldAlert, Activity, Lock, PlusCircle, ChevronLeft, ChevronRight, Menu, UserCheck, Building2, FileBarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { NotificationCenter } from '../../components/notifications/NotificationCenter';
import ResolveBot from '../../components/ai/ResolveBot';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';

export const Layout = ({ children, user, onLogout, theme, setTheme }) => {
  const location = useLocation();
  const { connectionState, isSystemHealthy } = useRealtimeConnection();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';

  const navItems = isAdmin 
    ? [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/grievances', icon: Ticket, label: 'Grievances' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/officers', icon: UserCheck, label: 'Officers' },
        { path: '/admin/departments', icon: Building2, label: 'Departments' },
        { path: '/admin/reports', icon: FileBarChart, label: 'Reports' },
        { path: '/admin/health', icon: Activity, label: 'Analytics' },
        { path: '/admin/compliance', icon: Shield, label: 'Compliance' },
        { path: '/admin/audit', icon: ShieldAlert, label: 'Audit Logs' },
        { path: '/security', icon: Settings, label: 'Settings' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/grievances/submit', icon: PlusCircle, label: 'Submit Grievance' },
        { path: '/grievances', icon: Ticket, label: 'My Grievances' },
        { path: '/public-status', icon: Activity, label: 'Track Status' },
        { path: '/reports', icon: FileBarChart, label: 'Reports' },
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/security', icon: Settings, label: 'Settings' },
      ];

  if (user?.role === 'super admin') {
    navItems.splice(navItems.length - 1, 0, { path: '/admin/system', icon: Lock, label: 'System Control' });
    navItems.splice(navItems.length - 1, 0, { path: '/admin/roles', icon: Lock, label: 'Roles & Perms' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[16px_16px] text-foreground font-sans antialiased">
      
      {/* --- Desktop Sidebar --- */}
      <aside 
        className={`hidden md:flex flex-col border-r border-border/80 bg-surface/85 backdrop-blur-md transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 shrink-0">
          <Link to="/" className="flex items-center gap-3 overflow-hidden select-none">
            <div className="w-8 h-8 rounded-lg bg-primary-bright flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-sm font-black uppercase tracking-tight">R</span>
            </div>
            {!isCollapsed && (
              <span className="font-heading font-black text-sm uppercase tracking-wider text-foreground whitespace-nowrap">
                ResolveNow
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const currentPath = location.pathname;
            const itemBasePath = item.path.split('?')[0];
            const isActive = currentPath === itemBasePath ||
              (item.path === '/grievances' && currentPath === '/my-grievances') ||
              (item.path === '/grievances/submit' && currentPath === '/submit-grievance') ||
              (item.path === '/security' && currentPath === '/settings') ||
              (item.path === '/public-status' && currentPath === '/track');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 relative group
                  ${isActive 
                    ? 'text-primary-bright bg-primary-bright/5 font-bold border border-primary-bright/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={16} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Collapse Trigger */}
        <div className="p-4 border-t border-border/50 flex flex-col gap-2 shrink-0">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-error hover:bg-error/5 transition-all duration-150 text-left"
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-full py-1.5 hover:bg-muted/40 rounded-lg text-muted-foreground transition-colors"
            type="button"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* --- Main Content Sector --- */}
      <div className="grow flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-border/80 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted/40 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              <Menu size={18} />
            </button>
            
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              Sector / <span className="text-foreground">{isAdmin ? 'Admin Console' : 'User Console'}</span>
              <span className="hidden sm:inline-block w-px h-3 bg-border mx-1" />
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                isSystemHealthy 
                  ? 'bg-success/5 border-success/20 text-success' 
                  : connectionState === 'OFFLINE'
                    ? 'bg-error/5 border-error/20 text-error'
                    : 'bg-warning/5 border-warning/20 text-warning'
              }`}>
                <span className={`w-1 h-1 rounded-full ${
                  isSystemHealthy 
                    ? 'bg-success animate-pulse' 
                    : connectionState === 'OFFLINE' 
                      ? 'bg-error' 
                      : 'bg-warning animate-bounce'
                }`} />
                {connectionState}
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationCenter user={user} />
            <button 
              onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/40 rounded-lg"
              aria-label="Toggle theme"
            >
              {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            
            <div className="w-px h-5 bg-border/80 mx-1" />
            
            <div className="relative group">
              <button 
                type="button" 
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-muted/30 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-bright/10 border border-primary-bright/20 flex items-center justify-center text-primary-bright font-black text-xs uppercase select-none shadow-xs overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (user?.fullName || user?.email || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight pr-1">
                  <span className="text-xs font-bold text-foreground truncate max-w-30">{user?.fullName || 'Operator'}</span>
                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{user?.role || 'Authorized'}</span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-52 py-2 bg-surface border border-border/80 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-border/50">
                  <p className="text-xs font-bold text-foreground truncate">{user?.fullName || 'Administrator'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                  <User size={14} className="text-muted-foreground" />
                  Profile Settings
                </Link>
                <Link to="/security" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                  <Settings size={14} className="text-muted-foreground" />
                  Account Security
                </Link>
                <Link to="/sessions" className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
                  <Shield size={14} className="text-muted-foreground" />
                  Active Sessions
                </Link>
                <div className="my-1 border-t border-border/50" />
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-error hover:bg-error/10 transition-colors text-left"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="grow overflow-y-auto relative z-10 custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- Mobile Drawer (Fallback Sidebar) --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-64 max-w-[80vw] h-full bg-surface border-r border-border flex flex-col p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-sm uppercase tracking-wider text-primary-bright">ResolveNow</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase text-muted-foreground p-1">Close</button>
              </div>
              
              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={`mob-${item.path}`}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-error hover:bg-error/5 transition-all text-left"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ResolveBot />
    </div>
  );
};
