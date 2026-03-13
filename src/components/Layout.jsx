import React from 'react';
import { LogOut, LayoutDashboard, Ticket, Users, Bell, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  return (
    <div className="flex h-screen bg-transparent text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Ticket className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Grievance
            </h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" currentPath={location.pathname} />
          {user.role === 'admin' ? (
            <>
              {/* <NavItem to="/departments" icon={<Users size={20} />} label="Departments" currentPath={location.pathname} /> */}
            </>
          ) : (
             null
          )}
          <NavItem to="/profile" icon={<User size={20} />} label="Profile Settings" currentPath={location.pathname} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-96">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-[#1a1f2e]"></span>
            </button>
            <Link to="/profile" className="flex items-center gap-3 pl-6 border-l border-white/10 group cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-none mb-1 group-hover:text-primary transition-colors">{user.user_metadata?.full_name || user.email.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-colors">
                <span className="text-primary font-bold">{user.email[0].toUpperCase()}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`
      flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 group
      ${active 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `}>
      <span className={`${active ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};
