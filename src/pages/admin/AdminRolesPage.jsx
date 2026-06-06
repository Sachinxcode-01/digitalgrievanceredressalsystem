import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Unlock, Key, Trash2, Edit3, Plus, 
  ArrowLeft, CheckCircle, AlertTriangle, Loader2, Save,
  X, Info, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Role workspace state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState([]); // Array of permission IDs
  const [roleDescription, setRoleDescription] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // New Custom Role modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePerms, setNewRolePerms] = useState([]); // Array of permission IDs
  const [creatingRole, setCreatingRole] = useState(false);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/permissions')
      ]);
      
      const rolesList = rolesRes.data || [];
      setRoles(rolesList);
      setPermissions(permsRes.data || []);

      // Re-select active role to update display if needed
      if (rolesList.length > 0) {
        const matchingSelected = selectedRole 
          ? rolesList.find(r => r.id === selectedRole.id) 
          : rolesList[0];
        
        const activeRole = matchingSelected || rolesList[0];
        setSelectedRole(activeRole);
        setRoleDescription(activeRole.description || '');
        setSelectedRolePerms(activeRole.permissions.map(p => p.id));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load access control schemas: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRoleDescription(role.description || '');
    setSelectedRolePerms(role.permissions.map(p => p.id));
  };

  const handlePermissionToggle = (permId) => {
    setSelectedRolePerms(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setSavingRole(true);
    try {
      await apiClient.put(`/admin/roles/${selectedRole.id}`, {
        description: roleDescription,
        permissions: selectedRolePerms
      });
      toast.success(`Role "${selectedRole.name.toUpperCase()}" updated successfully`);
      await fetchRolesAndPermissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (['student', 'faculty', 'staff', 'admin', 'super admin'].includes(role.name)) {
      toast.error('Critical system roles are locked and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the custom role "${role.name.toUpperCase()}"? Users holding this role may lose all access permissions.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/roles/${role.id}`);
      toast.success(`Role "${role.name.toUpperCase()}" removed successfully`);
      
      // If we deleted the currently selected role, clear selection
      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
      }
      
      await fetchRolesAndPermissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete role: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    const cleanName = newRoleName.trim().toLowerCase();
    if (roles.some(r => r.name === cleanName)) {
      toast.error(`Role name "${cleanName.toUpperCase()}" already exists`);
      return;
    }

    setCreatingRole(true);
    try {
      await apiClient.post('/admin/roles', {
        name: cleanName,
        description: newRoleDescription,
        permissions: newRolePerms
      });
      
      toast.success(`Custom role "${cleanName.toUpperCase()}" registered successfully`);
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRolePerms([]);
      setCreateModalOpen(false);
      await fetchRolesAndPermissions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create role: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreatingRole(false);
    }
  };

  const toggleNewRolePerm = (permId) => {
    setNewRolePerms(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const isSystemRole = (name) => {
    return ['student', 'faculty', 'staff', 'admin', 'super admin'].includes(name.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8 pt-20 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <Key className="text-primary-bright w-8 h-8" /> RBAC Access Control
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Configure dynamic Role-Based Access Control schema definitions and coordinate system privileges.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-premium flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider"
        >
          <Plus size={14} />
          <span>New Custom Role</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 text-primary-bright animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Syncing Access Mappings...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Role List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">
              Active Security Roles ({roles.length})
            </h3>
            
            <div className="space-y-3">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const isSys = isSystemRole(role.name);
                
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start gap-4 ${
                      isSelected 
                        ? 'bg-primary-bright/[0.04] border-primary-bright/40 shadow-sm' 
                        : 'bg-[#0b1329]/30 border-white/5 hover:border-white/10 hover:bg-[#0b1329]/50'
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-black text-sm uppercase tracking-wider text-white">
                          {role.name}
                        </span>
                        {isSys ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-mono font-bold uppercase tracking-wider">
                            System
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono font-bold uppercase tracking-wider">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                        {role.description || 'No description provided.'}
                      </p>
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase flex items-center gap-1">
                        <span>{role.permissions?.length || 0} Permissions assigned</span>
                      </div>
                    </div>

                    {!isSys && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 transition-all cursor-pointer shrink-0"
                        title="Delete custom role"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right/Middle Column: Permissions Check Grid Matrix */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRole ? (
              <div className="glass-card p-6 space-y-6">
                
                {/* Selected Role Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-primary-bright font-black uppercase tracking-widest">
                      ROLE CONFIGURATION WORKSPACE
                    </span>
                    <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                      {selectedRole.name}
                    </h2>
                  </div>
                  
                  <button
                    onClick={handleSaveRole}
                    disabled={savingRole}
                    className="btn-premium py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md align-self-start sm:align-self-auto"
                  >
                    {savingRole ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    <span>Save Changes</span>
                  </button>
                </div>

                {/* Description Editor */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Role Description
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Provide a detailed administrative description explaining what users inheriting this role can access..."
                    className="glass-input w-full h-16 resize-none text-xs font-medium"
                  />
                </div>

                {/* Permissions Grid */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Assigned Capabilities ({selectedRolePerms.length} / {permissions.length})
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((perm) => {
                      const isChecked = selectedRolePerms.includes(perm.id);
                      
                      return (
                        <div
                          key={perm.id}
                          onClick={() => handlePermissionToggle(perm.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex gap-3 items-start select-none ${
                            isChecked 
                              ? 'bg-primary-bright/[0.02] border-primary-bright/20' 
                              : 'bg-slate-950/20 border-white/5 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Controlled via parent div click
                            className="w-4 h-4 rounded text-primary-bright focus:ring-primary-bright bg-slate-950 border-white/10 shrink-0 mt-0.5 cursor-pointer"
                          />
                          <div className="space-y-1 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-slate-200 block truncate">
                              {perm.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-normal block">
                              {perm.description || 'No capability breakdown registered.'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                Select a role workspace from the list to begin editing capabilities.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create custom role glass modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-surface border border-border/80 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-wide">
                    Create Custom Role
                  </h2>
                  <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-wider font-mono">
                    DECLARE AN ACCESS CLEARANCE LEVEL DEFINITION
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateRole} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Role Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                    Role Identifier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
                    placeholder="e.g. departmental coordinator"
                    className="glass-input w-full font-bold uppercase placeholder:normal-case text-xs"
                  />
                  <p className="text-[9px] text-slate-500 font-medium">
                    Name will be sanitized to lowercase and used in security routes. Use letters, numbers, and spaces only.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                    Role Description
                  </label>
                  <textarea
                    required
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    placeholder="Explain the administrative scope of this role (e.g. Coordinates maintenance ticket assignments)..."
                    className="glass-input w-full h-20 resize-none text-xs font-medium"
                  />
                </div>

                {/* Select initial permissions */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                    Select Initial Permissions ({newRolePerms.length} selected)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar border border-white/5 rounded-xl p-3 bg-slate-950/20">
                    {permissions.map((perm) => {
                      const isChecked = newRolePerms.includes(perm.id);
                      return (
                        <div
                          key={`new-${perm.id}`}
                          onClick={() => toggleNewRolePerm(perm.id)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex gap-2.5 items-start select-none ${
                            isChecked
                              ? 'bg-primary-bright/[0.02] border-primary-bright/20'
                              : 'bg-slate-950/30 border-white/5 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-primary-bright focus:ring-primary-bright bg-slate-950 border-white/10 shrink-0 mt-0.5 cursor-pointer"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-mono text-[10px] font-bold text-slate-200 block truncate">
                              {perm.name}
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium leading-tight block">
                              {perm.description || 'No description.'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creatingRole}
                    className="w-full btn-premium py-3 text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {creatingRole ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    <span>{creatingRole ? 'Registering...' : 'Register Custom Role'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminRolesPage;
