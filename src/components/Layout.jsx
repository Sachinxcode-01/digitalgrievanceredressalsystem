import React from 'react';
import { LogOut, LayoutDashboard, Ticket, Users, Bell, Search, User, Briefcase, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { BackgroundGradientAnimation } from './ui/background-gradient-animation';

export const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Overview' },
    { path: '/profile', icon: User, label: 'Account' },
    { path: '/track', icon: Ticket, label: 'Tickets' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: Briefcase, label: 'Admin Panel' });
  }

  return (
    <BackgroundGradientAnimation 
      interactive={true} 
      gradientBackgroundStart="rgb(0, 8, 20)" 
      gradientBackgroundEnd="rgb(0, 4, 12)"
      firstColor="67, 97, 238"    /* Indigo-Blue */
      secondColor="114, 9, 183"   /* Rich Purple */
      thirdColor="0, 0, 0"
    >
      <div className="flex h-screen overflow-hidden relative z-50">
        {/* --- Desktop Sidebar Component --- */}
        <motion.aside 
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex w-72 glass-premium border-r border-white/10 p-8 flex-col m-4 rounded-[40px] shadow-2xl relative overflow-hidden group"
        >
          {/* Subtle sidebar hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none opacity-50" />

          <div className="flex items-center gap-4 mb-16 relative">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 p-1.5"
            >
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 font-['Outfit'] uppercase tracking-tight">ResolveNow</h1>
              <p className="text-[9px] text-primary font-black uppercase tracking-[0.4em]">Sector Active</p>
            </div>
          </div>

          <nav className="flex-grow space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all duration-500 group relative
                  ${isActive 
                    ? 'text-white bg-white/10 shadow-[0_4px_20px_-3px_rgba(67,97,238,0.25)] border border-white/15' 
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <item.icon size={20} className="relative z-10" />
                <span className="font-bold text-sm uppercase tracking-widest relative z-10">{item.label}</span>
                {/* Visual Active Indicator Dot */}
                <NavLink to={item.path}>
                    {({ isActive }) => isActive && (
                        <motion.div layoutId="navDot" className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(67,97,238,0.8)] z-20" />
                    )}
                </NavLink>
              </NavLink>
            ))}
          </nav>

          <button 
            onClick={onLogout}
            className="flex items-center gap-4 w-full px-6 py-5 mt-auto text-slate-500 hover:text-error hover:bg-error/10 rounded-[28px] transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em] border border-transparent hover:border-error/20"
          >
            <LogOut size={18} />
            <span>Terminate Access</span>
          </button>
        </motion.aside>

        {/* --- Main Content Sector --- */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          {/* Universal Header */}
          <header className="h-24 glass-premium border-b border-white/5 flex items-center justify-between px-12 m-4 mb-0 rounded-[32px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="flex items-center gap-6">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]"
              >
                Control Center / <span className="text-white">Sector {location.pathname === '/' ? '01' : '02'}</span>
              </motion.h2>
              
              <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-2.5 w-80">
                <Search size={18} className="text-slate-500" />
                <input type="text" placeholder="Scan Universal ID..." className="bg-transparent border-none outline-none text-[11px] font-bold text-white placeholder:text-slate-600 uppercase tracking-widest w-full" />
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <button className="p-3 text-slate-400 hover:text-white transition-colors relative group">
                  <Bell size={20} />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-ping" />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full" />
                </button>
                <button className="p-3 text-slate-400 hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
              </div>

              <div className="w-[1px] h-8 bg-white/10" />
              
              <motion.div 
                whileHover={{ y: -1 }}
                className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{user?.user_metadata?.full_name || 'System Operator'}</p>
                  <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none opacity-70">{user?.role || 'authorized'}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center font-black text-white text-xs border border-white/10 shadow-lg shadow-primary/20">
                  {(user?.user_metadata?.full_name || 'U')[0]}
                </div>
              </motion.div>
            </div>
          </header>

          {/* Atomic Page Content Wrapper */}
          <main className="flex-grow overflow-y-auto p-6 md:p-12 custom-scrollbar pb-28 md:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* --- Mobile Bottom Navigation --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-premium border-t border-white/10 p-4 rounded-t-3xl z-50 mx-2 flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={`mob-${item.path}`}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300
                ${isActive ? 'text-white bg-primary/20 shadow-[0_0_15px_rgba(67,97,238,0.3)]' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </NavLink>
          ))}
          <button onClick={onLogout} className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-500 hover:text-error transition-all">
            <LogOut size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
          </button>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
};
