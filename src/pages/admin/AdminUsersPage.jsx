import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserCheck, ShieldAlert, ArrowLeft, Loader2, Shield, UserX, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to retrieve user registry: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update clearance level');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'locked' ? 'active' : 'locked';
    setUpdatingUserId(userId);
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status: nextStatus });
      toast.success(`User status updated to ${nextStatus}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus, lockout_until: nextStatus === 'locked' ? 'active_lock' : null } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle account lock state');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.mobile_number || '').includes(searchQuery);

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-8 pt-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <UserCheck className="text-primary w-8 h-8" /> User Credentials Registry
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage institutional credentials, access clearance, and security status mappings.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background/20 backdrop-blur-md p-4 rounded-2xl border border-white/5">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors font-medium"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
          >
            <option value="All">All Clearance Levels</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="super admin">Super Admin</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
          >
            <option value="All">All Account States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Users Grid/List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Hydrating User Index...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
          No operators matching query parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => {
              const initials = (user.fullName || user.email || '?')[0].toUpperCase();
              const isLocked = user.status === 'locked' || (user.lockout_until && new Date() < new Date(user.lockout_until));

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  layout
                  className="glass-card p-6 border-white/5 bg-[#0b1329]/40 hover:bg-[#0b1329]/65 transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* User Profile Header */}
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/10 to-secondary/10 border border-white/10 flex items-center justify-center text-primary font-black text-xl overflow-hidden shadow-md">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="space-y-0.5 max-w-[70%]">
                        <h4 className="font-heading font-extrabold text-white text-sm truncate uppercase tracking-tight">{user.fullName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2.5 text-[10px] font-mono font-bold uppercase">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">User identifier</span>
                        <span className="text-slate-400 select-all">{user.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Mobile queue</span>
                        <span className="text-slate-400">{user.mobile_number || 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Registration Node</span>
                        <span className="text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Status</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono ${
                          isLocked 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : user.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isLocked ? 'LOCKED' : user.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                    {/* Role dropdown */}
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Clearance Level</span>
                      <select
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-slate-950 border border-white/5 rounded-lg py-1.5 px-2 text-[10px] text-slate-300 font-bold uppercase tracking-wider focus:outline-none focus:border-primary/50 cursor-pointer disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="super admin">Super Admin</option>
                      </select>
                    </div>

                    {/* Lock button */}
                    <div className="shrink-0 self-end">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        disabled={updatingUserId === user.id}
                        title={isLocked ? 'Unlock Account' : 'Lock Account'}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ${
                          isLocked 
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                        type="button"
                      >
                        {isLocked ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
