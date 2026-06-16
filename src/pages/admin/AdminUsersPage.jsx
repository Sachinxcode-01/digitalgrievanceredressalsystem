import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserCheck, ShieldAlert, ArrowLeft, Loader2, Shield, UserX, 
  Trash2, Plus, Edit2, X, Terminal, Calendar, Activity, Eye, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals & Drawers States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
    status: 'active'
  });

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

  const openCreateModal = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'student',
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const openActivityDrawer = async (user) => {
    setSelectedUser(user);
    setShowActivityDrawer(true);
    setLoadingActivity(true);
    setUserActivity([]);
    try {
      const res = await apiClient.get(`/admin/users/${user.id}/activity`);
      setUserActivity(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch activity stream: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/admin/users', formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put(`/admin/users/${selectedUser.id}`, formData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently terminate ${user.fullName || user.email}'s credentials? This action is irreversible.`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'locked' ? 'active' : 'locked';
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status: nextStatus });
      toast.success(`User status updated to ${nextStatus}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle lock state');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-8 pt-20 text-left relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6 relative z-10">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <UserCheck className="text-indigo-500 w-8 h-8 animate-pulse" /> User Credentials Registry
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Manage institutional credentials, access clearance, and security status mappings.
          </p>
        </div>
        <div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold uppercase tracking-widest text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 cursor-pointer"
          >
            <Plus size={14} /> Create User
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 relative z-10">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors font-medium"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
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
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors font-bold uppercase tracking-wider cursor-pointer"
          >
            <option value="All">All Account States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Hydrating User Index...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-slate-900/20 backdrop-blur-md p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest border border-white/5 rounded-2xl">
          No operators matching query parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
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
                  className="bg-slate-900/30 backdrop-blur-md p-6 border border-white/5 rounded-2xl hover:bg-slate-900/50 hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between h-80 relative overflow-hidden group shadow-md"
                >
                  {/* Subtle hover accent */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="space-y-4">
                    {/* User Profile Header */}
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 border border-white/10 flex items-center justify-center text-indigo-400 font-black text-xl overflow-hidden shadow-md">
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
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* View Activity */}
                      <button
                        onClick={() => openActivityDrawer(user)}
                        title="View Activity Stream"
                        className="p-2.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                      
                      {/* Edit Details */}
                      <button
                        onClick={() => openEditModal(user)}
                        title="Edit User Details"
                        className="p-2.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                        className="p-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 text-[9px] font-mono font-bold uppercase">
                        {user.role}
                      </span>
                      {/* Lock status toggle */}
                      <button
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        title={isLocked ? 'Unlock Account' : 'Lock Account'}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isLocked 
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                        type="button"
                      >
                        {isLocked ? <UserCheck size={13} /> : <UserX size={13} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Create User Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50" 
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50" 
                  placeholder="jane.doe@resolve.now"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50" 
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Clearance Level</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Account State</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {submitting ? 'Creating operator...' : 'Finalize Operator'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Edit Credentials Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50" 
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50" 
                  placeholder="jane.doe@resolve.now"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Clearance Level</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Account State</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {submitting ? 'Saving changes...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ACTIVITY DRAWER --- */}
      <AnimatePresence>
        {showActivityDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => setShowActivityDrawer(false)}
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-full max-w-lg bg-slate-900 border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl text-left z-10"
            >
              <div className="space-y-6 flex-grow overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity size={18} className="text-indigo-400" /> Activity stream
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {selectedUser?.fullName || selectedUser?.email}
                    </p>
                  </div>
                  <button onClick={() => setShowActivityDrawer(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {loadingActivity ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">Hydrating Log stream...</p>
                    </div>
                  ) : userActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs font-black uppercase tracking-widest gap-2">
                      <AlertCircle size={20} className="text-slate-600" />
                      No recent activity recorded.
                    </div>
                  ) : (
                    userActivity.map((log) => {
                      const date = new Date(log.created_at).toLocaleString();
                      const details = log.details || {};
                      
                      return (
                        <div key={log.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-2 hover:border-indigo-500/10 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 text-[9px] font-mono font-bold uppercase tracking-wider">
                              {log.action}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                              <Calendar size={10} /> {date}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-600 uppercase">
                            <span>IP Address</span>
                            <span className="text-slate-400">{log.ip_address}</span>
                          </div>

                          {Object.keys(details).length > 0 && (
                            <div className="bg-slate-950/80 p-2.5 rounded border border-white/[0.03] text-[10px] font-mono text-slate-400 space-y-1">
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">Payload parameters</span>
                              <pre className="whitespace-pre-wrap select-all font-medium text-left">
                                {JSON.stringify(details, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.user_agent && (
                            <div className="text-[8px] font-mono text-slate-600 truncate mt-1">
                              UA: {log.user_agent}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsersPage;
