import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ArrowLeft, Loader2, Database, Cpu, Activity, Server, Radio, 
  RefreshCw, Zap, Settings, ShieldAlert, Mail, MessageSquare, Brain, 
  Bell, Shield, Clock, Landmark, Wrench, Save, Send, AlertTriangle, 
  Plus, Trash2, Edit3, CheckCircle, Info, ChevronRight, HardDrive, Terminal, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';

export const SuperAdminSystemPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System Health Metrics state
  const [metrics, setMetrics] = useState(null);
  const [metricsRefreshing, setMetricsRefreshing] = useState(false);

  // Dropdown lists
  const [users, setUsers] = useState([]);
  
  // Settings grouped state
  const [settings, setSettings] = useState({
    general: {},
    auth: {},
    email: {},
    sms: {},
    ai: {},
    notification: {},
    security: {}
  });

  // Dynamic entities lists
  const [departments, setDepartments] = useState([]);
  const [slaRules, setSlaRules] = useState([]);
  const [escalationRules, setEscalationRules] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);

  // Testing dispatch states
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testingSms, setTestingSms] = useState(false);

  // Template Editing state
  const [editingTemplate, setEditingTemplate] = useState(null); // { type: 'email'|'sms', template: {} }
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptAutoAssign, setDeptAutoAssign] = useState(true);
  const [savingDept, setSavingDept] = useState(false);

  // SLA Modal State
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [editingSla, setEditingSla] = useState(null);
  const [slaName, setSlaName] = useState('');
  const [slaCategory, setSlaCategory] = useState('');
  const [slaPriority, setSlaPriority] = useState('Medium');
  const [slaResHours, setSlaResHours] = useState(48);
  const [slaWarnHours, setSlaWarnHours] = useState(12);
  const [savingSla, setSavingSla] = useState(false);

  // Escalation Modal State
  const [escModalOpen, setEscModalOpen] = useState(false);
  const [editingEsc, setEditingEsc] = useState(null);
  const [escName, setEscName] = useState('');
  const [escSlaId, setEscSlaId] = useState('');
  const [escDelayHours, setEscDelayHours] = useState(12);
  const [escToUserId, setEscToUserId] = useState('');
  const [savingEsc, setSavingEsc] = useState(false);

  // Backups log state
  const [backups, setBackups] = useState([]);
  const [backingUp, setBackingUp] = useState(false);

  // Tabs layout configuration
  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'auth', label: 'Authentication', icon: ShieldAlert },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'sms', label: 'SMS Gateway', icon: MessageSquare },
    { id: 'ai', label: 'Gemini AI Integration', icon: Brain },
    { id: 'notification', label: 'Global Notifications', icon: Bell },
    { id: 'security', label: 'Firewall & Safety', icon: Shield },
    { id: 'sla', label: 'SLAs & Escalations', icon: Clock },
    { id: 'departments', label: 'Departments', icon: Landmark },
    { id: 'maintenance', label: 'Maintenance & Health', icon: Wrench }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        settingsRes,
        deptsRes,
        slasRes,
        escsRes,
        emailTplRes,
        smsTplRes,
        usersRes,
        metricsRes
      ] = await Promise.all([
        apiClient.get('/admin/settings'),
        apiClient.get('/admin/departments'),
        apiClient.get('/admin/settings/sla-rules'),
        apiClient.get('/admin/settings/escalation-rules'),
        apiClient.get('/admin/settings/templates/email'),
        apiClient.get('/admin/settings/templates/sms'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/health-metrics').catch(() => ({ data: null }))
      ]);

      // Map settings response
      const mapped = {
        general: {},
        auth: {},
        email: {},
        sms: {},
        ai: {},
        notification: {},
        security: {}
      };

      Object.entries(settingsRes.data || {}).forEach(([cat, list]) => {
        if (mapped[cat] !== undefined) {
          list.forEach(item => {
            mapped[cat][item.key] = item.value;
          });
        }
      });

      setSettings(mapped);
      setDepartments(deptsRes.data || []);
      setSlaRules(slasRes.data || []);
      setEscalationRules(escsRes.data || []);
      setEmailTemplates(emailTplRes.data || []);
      setSmsTemplates(smsTplRes.data || []);
      setUsers(usersRes.data || []);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system control center data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshMetrics = async () => {
    setMetricsRefreshing(true);
    try {
      const res = await apiClient.get('/admin/health-metrics');
      setMetrics(res.data);
    } catch (err) {
      toast.error('Failed to fetch node telemetry: ' + err.message);
    } finally {
      setMetricsRefreshing(false);
    }
  };

  // Helper to handle flat changes in settings object
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async (category) => {
    setSaving(true);
    try {
      const payload = settings[category];
      await apiClient.put('/admin/settings', payload);
      toast.success(`${category.toUpperCase()} settings saved successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setTestingEmail(true);
    try {
      await apiClient.post('/admin/settings/test-email', { testEmail: testEmailAddress });
      toast.success('Test email successfully dispatched');
      setTestEmailAddress('');
    } catch (err) {
      console.error(err);
      toast.error('SMTP test failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async (e) => {
    e.preventDefault();
    if (!testPhoneNumber) return;
    setTestingSms(true);
    try {
      await apiClient.post('/admin/settings/test-sms', { testPhone: testPhoneNumber });
      toast.success('Test SMS successfully transmitted');
      setTestPhoneNumber('');
    } catch (err) {
      console.error(err);
      toast.error('SMS Gateway handshake failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestingSms(false);
    }
  };

  // Template actions
  const openTemplateEdit = (type, tpl) => {
    setEditingTemplate({ type, template: tpl });
    setTemplateSubject(type === 'email' ? tpl.subject : '');
    setTemplateBody(tpl.body);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setSavingTemplate(true);
    const { type, template } = editingTemplate;
    try {
      if (type === 'email') {
        await apiClient.put(`/admin/settings/templates/email/${template.id}`, {
          subject: templateSubject,
          body: templateBody
        });
        setEmailTemplates(prev => prev.map(t => t.id === template.id ? { ...t, subject: templateSubject, body: templateBody } : t));
      } else {
        await apiClient.put(`/admin/settings/templates/sms/${template.id}`, {
          body: templateBody
        });
        setSmsTemplates(prev => prev.map(t => t.id === template.id ? { ...t, body: templateBody } : t));
      }
      toast.success('Template updated successfully');
      setEditingTemplate(null);
    } catch (err) {
      toast.error('Failed to update template: ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Department actions
  const openDeptModal = (dept = null) => {
    setEditingDept(dept);
    setDeptName(dept ? dept.name : '');
    setDeptDesc(dept ? dept.description || '' : '');
    setDeptHead(dept ? dept.head_user_id || '' : '');
    setDeptAutoAssign(dept ? dept.assignment_rules?.autoAssign !== false : true);
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSavingDept(true);
    try {
      const payload = {
        name: deptName,
        description: deptDesc,
        headUserId: deptHead || null,
        assignmentRules: { autoAssign: deptAutoAssign }
      };

      if (editingDept) {
        await apiClient.put(`/admin/departments/${editingDept.id}`, payload);
      } else {
        await apiClient.post('/admin/departments', payload);
      }
      toast.success(`Department ${editingDept ? 'updated' : 'created'} successfully`);
      setDeptModalOpen(false);
      const res = await apiClient.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to save department: ' + err.message);
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All assigned ticket routing may fall back to system defaults.')) return;
    try {
      await apiClient.delete(`/admin/departments/${id}`);
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast.success('Department deleted successfully');
    } catch (err) {
      toast.error('Failed to delete department: ' + err.message);
    }
  };

  // SLA actions
  const openSlaModal = (sla = null) => {
    setEditingSla(sla);
    setSlaName(sla ? sla.name : '');
    setSlaCategory(sla ? sla.category : departments[0]?.name || '');
    setSlaPriority(sla ? sla.priority : 'Medium');
    setSlaResHours(sla ? sla.resolution_time_hours : 48);
    setSlaWarnHours(sla ? sla.warning_time_hours : 12);
    setSlaModalOpen(true);
  };

  const handleSaveSla = async (e) => {
    e.preventDefault();
    setSavingSla(true);
    try {
      const payload = {
        name: slaName,
        category: slaCategory,
        priority: slaPriority,
        resolutionTimeHours: parseInt(slaResHours),
        warningTimeHours: parseInt(slaWarnHours)
      };

      if (editingSla) {
        await apiClient.put(`/admin/settings/sla-rules/${editingSla.id}`, payload);
      } else {
        await apiClient.post('/admin/settings/sla-rules', payload);
      }
      toast.success(`SLA Rule ${editingSla ? 'updated' : 'created'} successfully`);
      setSlaModalOpen(false);
      const res = await apiClient.get('/admin/settings/sla-rules');
      setSlaRules(res.data);
    } catch (err) {
      toast.error('Failed to save SLA: ' + err.message);
    } finally {
      setSavingSla(false);
    }
  };

  const handleDeleteSla = async (id) => {
    if (!window.confirm('Delete SLA rule?')) return;
    try {
      await apiClient.delete(`/admin/settings/sla-rules/${id}`);
      setSlaRules(prev => prev.filter(s => s.id !== id));
      toast.success('SLA Rule deleted successfully');
    } catch (err) {
      toast.error('Failed to delete SLA: ' + err.message);
    }
  };

  // Escalation actions
  const openEscModal = (esc = null) => {
    setEditingEsc(esc);
    setEscName(esc ? esc.name : '');
    setEscSlaId(esc ? esc.sla_rule_id : slaRules[0]?.id || '');
    setEscDelayHours(esc ? esc.trigger_delay_hours : 12);
    setEscToUserId(esc ? esc.escalate_to_user_id || '' : '');
    setEscModalOpen(true);
  };

  const handleSaveEsc = async (e) => {
    e.preventDefault();
    setSavingEsc(true);
    try {
      const payload = {
        name: escName,
        slaRuleId: escSlaId,
        triggerDelayHours: parseInt(escDelayHours),
        escalateToUserId: escToUserId || null
      };

      if (editingEsc) {
        await apiClient.put(`/admin/settings/escalation-rules/${editingEsc.id}`, payload);
      } else {
        await apiClient.post('/admin/settings/escalation-rules', payload);
      }
      toast.success(`Escalation rule ${editingEsc ? 'updated' : 'created'} successfully`);
      setEscModalOpen(false);
      const res = await apiClient.get('/admin/settings/escalation-rules');
      setEscalationRules(res.data);
    } catch (err) {
      toast.error('Failed to save escalation rule: ' + err.message);
    } finally {
      setSavingEsc(false);
    }
  };

  const handleDeleteEsc = async (id) => {
    if (!window.confirm('Delete escalation rule?')) return;
    try {
      await apiClient.delete(`/admin/settings/escalation-rules/${id}`);
      setEscalationRules(prev => prev.filter(e => e.id !== id));
      toast.success('Escalation rule deleted successfully');
    } catch (err) {
      toast.error('Failed to delete escalation: ' + err.message);
    }
  };

  // Maintenance Triggers
  const handleFlushCache = async () => {
    try {
      const res = await apiClient.post('/admin/settings/maintenance/cache');
      toast.success(res.data.message || 'Telemetry cache successfully cleared');
    } catch (err) {
      toast.error('Cache flush failed: ' + err.message);
    }
  };

  const handleTriggerBackup = async () => {
    setBackingUp(true);
    try {
      const res = await apiClient.post('/admin/settings/maintenance/backup');
      toast.success('Backup snapshot created successfully.');
      setBackups(prev => [res.data, ...prev]);
    } catch (err) {
      toast.error('Database backup failed: ' + err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // User list utility filters
  const staffOfficers = users.filter(u => ['admin', 'super admin', 'faculty', 'staff'].includes(u.role));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-8 pt-20 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-all uppercase tracking-widest text-[9px] font-bold mb-2">
            <ArrowLeft size={12} /> Back to Command Console
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
            <Lock className="text-primary-bright w-8 h-8" /> System Configuration
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Global whitelabel policies, security firewalls, SMTP dispatchers, SLA timers, and department configurations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 text-primary-bright animate-spin" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Hydrating System Settings...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Navigation: Vertical Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2 lg:sticky lg:top-24">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none text-left ${
                    isActive 
                      ? 'bg-primary-bright/10 text-primary-bright border border-primary-bright/20 shadow-sm' 
                      : 'bg-[#0b1329]/30 border border-white/5 text-slate-400 hover:text-white hover:bg-[#0b1329]/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Area: Form Panels */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="glass-card p-6 space-y-6"
              >
                
                {/* 1. GENERAL SETTINGS TAB */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">General Configurations</h2>
                      <p className="text-[10px] text-slate-500">Institutional identities, support coordinates and whitelabels.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution Name</label>
                        <input
                          type="text"
                          value={settings.general.institution_name || ''}
                          onChange={(e) => handleSettingChange('general', 'institution_name', e.target.value)}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branded Logo URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={settings.general.logo_url || ''}
                          onChange={(e) => handleSettingChange('general', 'logo_url', e.target.value)}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Contact Phone</label>
                        <input
                          type="text"
                          value={settings.general.contact_phone || ''}
                          onChange={(e) => handleSettingChange('general', 'contact_phone', e.target.value)}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email Address</label>
                        <input
                          type="email"
                          value={settings.general.support_email || ''}
                          onChange={(e) => handleSettingChange('general', 'support_email', e.target.value)}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Timezone</label>
                        <select
                          value={settings.general.timezone || 'Asia/Kolkata'}
                          onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                          className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="UTC">Coordinated Universal Time (UTC)</option>
                          <option value="America/New_York">Eastern Time (EST/EDT)</option>
                          <option value="Europe/London">London (GMT/BST)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Representation Format</label>
                        <select
                          value={settings.general.date_format || 'MM/DD/YYYY'}
                          onChange={(e) => handleSettingChange('general', 'date_format', e.target.value)}
                          className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings('general')}
                      disabled={saving}
                      className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                )}

                {/* 2. AUTHENTICATION TAB */}
                {activeTab === 'auth' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Authentication Settings</h2>
                      <p className="text-[10px] text-slate-500">Define access rules, session cooldowns and password requirements.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">One-Time Password (OTP) Lifetime (Sec)</label>
                        <input
                          type="number"
                          value={settings.auth.otp_expiry_seconds || 300}
                          onChange={(e) => handleSettingChange('auth', 'otp_expiry_seconds', parseInt(e.target.value))}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Inactivity Time Limit (Min)</label>
                        <input
                          type="number"
                          value={settings.auth.session_expiry_minutes || 60}
                          onChange={(e) => handleSettingChange('auth', 'session_expiry_minutes', parseInt(e.target.value))}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Failed Logins Before Lockout</label>
                        <input
                          type="number"
                          value={settings.auth.max_login_attempts || 5}
                          onChange={(e) => handleSettingChange('auth', 'max_login_attempts', parseInt(e.target.value))}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Lockout Duration (Min)</label>
                        <input
                          type="number"
                          value={settings.auth.lockout_duration_minutes || 30}
                          onChange={(e) => handleSettingChange('auth', 'lockout_duration_minutes', parseInt(e.target.value))}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Google Single Sign-On</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Enable OAuth Login pathways</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('auth', 'enable_google_login', !settings.auth.enable_google_login)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.auth.enable_google_login ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.auth.enable_google_login ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Force Email Verification</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Require verified email for access</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('auth', 'force_email_verification', !settings.auth.force_email_verification)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.auth.force_email_verification ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.auth.force_email_verification ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings('auth')}
                      disabled={saving}
                      className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                )}

                {/* 3. EMAIL SMTP TAB */}
                {activeTab === 'email' && (
                  <div className="space-y-8">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Email Server Settings</h2>
                      <p className="text-[10px] text-slate-500">Configure SMTP dispatches, email templates and white-labels.</p>
                    </div>

                    {/* SMTP parameters */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">SMTP Credentials</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Host URL</label>
                          <input
                            type="text"
                            value={settings.email.smtp_host || ''}
                            onChange={(e) => handleSettingChange('email', 'smtp_host', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Server Port</label>
                          <input
                            type="number"
                            value={settings.email.smtp_port || 587}
                            onChange={(e) => handleSettingChange('email', 'smtp_port', parseInt(e.target.value))}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP SSL/TLS Toggle</label>
                          <select
                            value={String(settings.email.smtp_ssl || false)}
                            onChange={(e) => handleSettingChange('email', 'smtp_ssl', e.target.value === 'true')}
                            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="false">STARTTLS / Plain (false)</option>
                            <option value="true">SSL / TLS (true)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Account Username</label>
                          <input
                            type="text"
                            value={settings.email.smtp_username || ''}
                            onChange={(e) => handleSettingChange('email', 'smtp_username', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••"
                            value={settings.email.smtp_password || ''}
                            onChange={(e) => handleSettingChange('email', 'smtp_password', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Name Prefix</label>
                          <input
                            type="text"
                            value={settings.email.sender_name || ''}
                            onChange={(e) => handleSettingChange('email', 'sender_name', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Email Address</label>
                          <input
                            type="email"
                            value={settings.email.sender_email || ''}
                            onChange={(e) => handleSettingChange('email', 'sender_email', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveSettings('email')}
                        disabled={saving}
                        className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                      >
                        <Save size={14} />
                        <span>{saving ? 'Saving...' : 'Save Credentials'}</span>
                      </button>
                    </div>

                    {/* SMTP handshake check panel */}
                    <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Radio size={14} className="text-primary-bright animate-pulse" /> SMTP Connection Handshake
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Verify SMTP host configurations by dispatching a secure test packet.</p>
                      </div>
                      <form onSubmit={handleTestEmail} className="flex gap-2 w-full md:w-auto">
                        <input
                          type="email"
                          required
                          placeholder="recipient@test.com"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          className="glass-input text-xs py-2 px-3 w-full md:w-56"
                        />
                        <button
                          type="submit"
                          disabled={testingEmail || !testEmailAddress}
                          className="btn-ghost border border-white/5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
                        >
                          {testingEmail ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                        </button>
                      </form>
                    </div>

                    {/* Email templates list */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Email Templates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emailTemplates.map(tpl => (
                          <div key={tpl.id} className="p-4 bg-slate-950/20 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] font-bold text-primary-bright uppercase tracking-wider block">{tpl.name.replace(/_/g, ' ')}</span>
                              <span className="text-xs font-bold text-white block truncate max-w-[200px]">{tpl.subject}</span>
                              <span className="text-[10px] text-slate-500 font-medium leading-normal block">{tpl.description || 'System dispatch template.'}</span>
                            </div>
                            <button
                              onClick={() => openTemplateEdit('email', tpl)}
                              className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. SMS GATEWAY TAB */}
                {activeTab === 'sms' && (
                  <div className="space-y-8">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">SMS Gateway Configuration</h2>
                      <p className="text-[10px] text-slate-500">Coordinate Android SMS Gateway API connection ports.</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Gateway API Settings</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMS Gateway URL</label>
                          <input
                            type="text"
                            placeholder="http://..."
                            value={settings.sms.sms_api_url || ''}
                            onChange={(e) => handleSettingChange('sms', 'sms_api_url', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SMS Provider Selection</label>
                          <select
                            value={settings.sms.sms_provider || 'android-gateway'}
                            onChange={(e) => handleSettingChange('sms', 'sms_provider', e.target.value)}
                            className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="android-gateway">Android SMS Gateway Client</option>
                            <option value="twilio">Twilio Cloud API (Mock)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway Login User</label>
                          <input
                            type="text"
                            value={settings.sms.sms_login || ''}
                            onChange={(e) => handleSettingChange('sms', 'sms_login', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            value={settings.sms.sms_password || ''}
                            onChange={(e) => handleSettingChange('sms', 'sms_password', e.target.value)}
                            className="glass-input w-full text-xs font-medium"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveSettings('sms')}
                        disabled={saving}
                        className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                      >
                        <Save size={14} />
                        <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                      </button>
                    </div>

                    {/* SMS Test Connection */}
                    <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Radio size={14} className="text-primary-bright animate-pulse" /> Gateway Handshake Test
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Verify gateway APIs by sending an SMS key handshake.</p>
                      </div>
                      <form onSubmit={handleTestSms} className="flex gap-2 w-full md:w-auto">
                        <input
                          type="text"
                          required
                          placeholder="+1234567890"
                          value={testPhoneNumber}
                          onChange={(e) => setTestPhoneNumber(e.target.value)}
                          className="glass-input text-xs py-2 px-3 w-full md:w-56"
                        />
                        <button
                          type="submit"
                          disabled={testingSms || !testPhoneNumber}
                          className="btn-ghost border border-white/5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
                        >
                          {testingSms ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                        </button>
                      </form>
                    </div>

                    {/* SMS Templates */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">SMS Templates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {smsTemplates.map(tpl => (
                          <div key={tpl.id} className="p-4 bg-slate-950/20 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                            <div className="space-y-1 min-w-0 flex-1">
                              <span className="font-mono text-[10px] font-bold text-primary-bright uppercase tracking-wider block">{tpl.name.replace(/_/g, ' ')}</span>
                              <span className="text-xs font-medium text-white block truncate max-w-[250px]">{tpl.body}</span>
                              <span className="text-[10px] text-slate-500 font-medium leading-normal block">{tpl.description || 'System SMS template.'}</span>
                            </div>
                            <button
                              onClick={() => openTemplateEdit('sms', tpl)}
                              className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 5. GEMINI AI TAB */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Google Gemini AI Engine</h2>
                      <p className="text-[10px] text-slate-500">Configure AI auto-categorization, urgency and sentiment indices.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gemini API Key</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••••••••••••••••••••••••"
                          value={settings.ai.gemini_api_key || ''}
                          onChange={(e) => handleSettingChange('ai', 'gemini_api_key', e.target.value)}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Model Variant Selection</label>
                        <select
                          value={settings.ai.gemini_model || 'gemini-1.5-flash'}
                          onChange={(e) => handleSettingChange('ai', 'gemini_model', e.target.value)}
                          className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Speed)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Accuracy)</option>
                          <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Auto-Categorization</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Assign sector categories via AI</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('ai', 'enable_ai_categorization', !settings.ai.enable_ai_categorization)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.ai.enable_ai_categorization ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.ai.enable_ai_categorization ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Sentiment Analysis</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Calculate user frustration rating (1-10)</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('ai', 'enable_sentiment_analysis', !settings.ai.enable_sentiment_analysis)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.ai.enable_sentiment_analysis ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.ai.enable_sentiment_analysis ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Urgency Detection</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Detect severity index automatically</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('ai', 'enable_urgency_detection', !settings.ai.enable_urgency_detection)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.ai.enable_urgency_detection ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.ai.enable_urgency_detection ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Copilot Suggestions</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Draft incident resolution scripts</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('ai', 'enable_ai_suggestions', !settings.ai.enable_ai_suggestions)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.ai.enable_ai_suggestions ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.ai.enable_ai_suggestions ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings('ai')}
                      disabled={saving}
                      className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                )}

                {/* 6. GLOBAL NOTIFICATIONS TAB */}
                {activeTab === 'notification' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Global Notifications</h2>
                      <p className="text-[10px] text-slate-500">Toggle communication delivery channels for ResolveNow updates.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">SMTP Email Transmissions</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Enable automated transactional emails</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('notification', 'enable_email_notifications', !settings.notification.enable_email_notifications)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.notification.enable_email_notifications ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.notification.enable_email_notifications ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">SMS Mobile Transmissions</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Enable OTP key dispatches over SMS</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('notification', 'enable_sms_notifications', !settings.notification.enable_sms_notifications)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.notification.enable_sms_notifications ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.notification.enable_sms_notifications ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Web Push Alerts</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Toggle desktop browser push (Mock)</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('notification', 'enable_push_notifications', !settings.notification.enable_push_notifications)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.notification.enable_push_notifications ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.notification.enable_push_notifications ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">In-App Bell Badges</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Toggle header alert bell indicators</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('notification', 'enable_in_app_notifications', !settings.notification.enable_in_app_notifications)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.notification.enable_in_app_notifications ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.notification.enable_in_app_notifications ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings('notification')}
                      disabled={saving}
                      className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                )}

                {/* 7. FIREWALL SECURITY TAB */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Firewall & Security Settings</h2>
                      <p className="text-[10px] text-slate-500">Configure connection limits, session properties and audit controls.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate Limit Threshold (15-Min)</label>
                        <input
                          type="number"
                          value={settings.security.rate_limit_max || 100}
                          onChange={(e) => handleSettingChange('security', 'rate_limit_max', parseInt(e.target.value))}
                          className="glass-input w-full text-xs font-medium"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Audit Logging</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Record administrative SQL mutations</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('security', 'enable_audit_logging', !settings.security.enable_audit_logging)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.security.enable_audit_logging ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.security.enable_audit_logging ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Device & Browser Audit</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Log User Agent browser headers</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('security', 'session_device_tracking', !settings.security.session_device_tracking)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.security.session_device_tracking ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.security.session_device_tracking ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wide">Realtime Security Alerts</h4>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Broadcast notifications on lockout warning</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('security', 'enable_security_alerts', !settings.security.enable_security_alerts)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            settings.security.enable_security_alerts ? 'bg-primary-bright' : 'bg-slate-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.security.enable_security_alerts ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings('security')}
                      disabled={saving}
                      className="btn-premium flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer ml-auto"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                    </button>
                  </div>
                )}

                {/* 8. SLAs & ESCALATIONS TAB */}
                {activeTab === 'sla' && (
                  <div className="space-y-8">
                    
                    {/* SLA Rules list */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                          <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Service Level Agreements (SLAs)</h2>
                          <p className="text-[10px] text-slate-500">Target redressal hours by priority and sector.</p>
                        </div>
                        <button
                          onClick={() => openSlaModal(null)}
                          className="btn-ghost border border-white/5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5"
                        >
                          <Plus size={12} /> Add SLA
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slaRules.map(sla => (
                          <div key={sla.id} className="p-4 bg-[#0b1329]/30 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                            <div className="space-y-2">
                              <div>
                                <span className="font-heading font-black text-xs text-white uppercase block">{sla.name}</span>
                                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">{sla.category}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold uppercase">
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400">Priority: {sla.priority}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400">Resolve: {sla.resolution_time_hours} Hours</span>
                                <span className="px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10 text-amber-400">Warn: {sla.warning_time_hours} Hours</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openSlaModal(sla)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"><Edit3 size={12} /></button>
                              <button onClick={() => handleDeleteSla(sla.id)} className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Escalation Rules list */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                          <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Escalation Chains</h2>
                          <p className="text-[10px] text-slate-500">Automate ticket escalation loops on SLA breaches.</p>
                        </div>
                        <button
                          onClick={() => openEscModal(null)}
                          disabled={slaRules.length === 0}
                          className="btn-ghost border border-white/5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 disabled:opacity-40"
                        >
                          <Plus size={12} /> Add Chain
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {escalationRules.map(esc => {
                          const targetOfficer = staffOfficers.find(u => u.id === esc.escalate_to_user_id);
                          const officerLabel = targetOfficer ? (targetOfficer.user_profiles?.full_name || targetOfficer.email) : 'Default Supervisor';
                          
                          return (
                            <div key={esc.id} className="p-4 bg-[#0b1329]/30 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-heading font-black text-xs text-white uppercase block">{esc.name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">SLA Link: {esc.sla_rules?.name || 'Missing SLA'}</span>
                                </div>
                                <div className="space-y-1 text-[10px] font-medium text-slate-400">
                                  <p>• Trigger delay: <span className="font-mono text-white font-bold">{esc.trigger_delay_hours} hrs</span> past SLA breach</p>
                                  <p>• Escalate to: <span className="font-mono text-primary-bright font-bold">{officerLabel}</span></p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => openEscModal(esc)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"><Edit3 size={12} /></button>
                                <button onClick={() => handleDeleteEsc(esc.id)} className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* 9. DEPARTMENTS TAB */}
                {activeTab === 'departments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h2 className="text-lg font-heading font-black uppercase tracking-wider text-white">Department Registry</h2>
                        <p className="text-[10px] text-slate-500">Manage institutional sectors, assigned heads and triage rules.</p>
                      </div>
                      <button
                        onClick={() => openDeptModal(null)}
                        className="btn-ghost border border-white/5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5"
                      >
                        <Plus size={12} /> Add Department
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {departments.map(dept => {
                        const deptHeadUser = users.find(u => u.id === dept.head_user_id);
                        const headName = deptHeadUser ? (deptHeadUser.user_profiles?.full_name || deptHeadUser.email) : 'Not assigned';
                        
                        return (
                          <div key={dept.id} className="p-5 bg-[#0b1329]/30 border border-white/5 rounded-2xl flex flex-col justify-between gap-4 text-left">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="font-heading font-black text-sm text-white uppercase tracking-wide">{dept.name}</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold uppercase tracking-wider">
                                  {dept.assignment_rules?.autoAssign ? 'AutoAssign: On' : 'AutoAssign: Off'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                                {dept.description || 'No department summary declared.'}
                              </p>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Head Supervisor: <span className="text-slate-300 font-bold">{headName}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                              <button
                                onClick={() => openDeptModal(dept)}
                                className="px-3 py-1.5 text-[9px] font-bold uppercase bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer"
                              >
                                Configure
                              </button>
                              <button
                                onClick={() => handleDeleteDept(dept.id)}
                                className="px-3 py-1.5 text-[9px] font-bold uppercase bg-rose-500/5 border border-rose-500/10 text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 10. SYSTEM MAINTENANCE TAB */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-8">
                    
                    {/* Telemetry diagnostics */}
                    {metrics ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <Server size={16} className="text-primary-bright" /> Telemetry diagnostics
                            </h3>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">PLATFORM TELEMETRY // CORE KERNEL NODE</p>
                          </div>
                          <button
                            onClick={refreshMetrics}
                            disabled={metricsRefreshing}
                            className="p-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <RefreshCw size={14} className={metricsRefreshing ? 'animate-spin' : ''} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-left">
                          <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">CPU LOAD</span>
                            <span className="text-2xl font-black text-white">{metrics?.system?.cpu?.usagePercentage}%</span>
                            <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
                              <div className="bg-primary-bright h-1 rounded-full" style={{ width: `${metrics?.system?.cpu?.usagePercentage || 0}%` }} />
                            </div>
                          </div>
                          <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">MEMORY (RAM)</span>
                            <span className="text-2xl font-black text-white">{metrics?.system?.memory?.usagePercentage}%</span>
                            <p className="text-[8px] text-slate-500 mt-1">{formatBytes(metrics?.system?.memory?.used)} / {formatBytes(metrics?.system?.memory?.total)}</p>
                          </div>
                          <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">DATABASE LATENCY</span>
                            <span className="text-2xl font-black text-white">{metrics?.database?.latencyMs} ms</span>
                            <span className="text-[8px] text-emerald-400 font-bold block mt-1 uppercase">● NOMINAL STATUS</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic">System diagnostics metrics offline.</p>
                    )}

                    {/* Cache & Maintenance Switch operations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Flush Telemetry Cache</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Flush the server cache and reload settings parameters directly from PostgreSQL databases.</p>
                        <button
                          onClick={handleFlushCache}
                          className="w-full bg-[#0d1324]/60 hover:bg-[#0d1324]/90 border border-white/5 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Zap size={13} className="text-yellow-400" /> Flush Session Cache Store
                        </button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Database Backups Center</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Trigger an immediate PostgreSQL database schema backup snapshot for restoration safety.</p>
                        <button
                          onClick={handleTriggerBackup}
                          disabled={backingUp}
                          className="w-full bg-primary-bright/10 hover:bg-primary-bright/20 border border-primary-bright/20 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-primary-bright transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          {backingUp ? <Loader2 className="animate-spin" size={14} /> : <HardDrive size={13} />}
                          <span>{backingUp ? 'Creating snapshot...' : 'Trigger Database Backup'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Backups metadata log */}
                    {backups.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Generated Backups Log</h4>
                        <div className="space-y-2">
                          {backups.map((bak, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/50 border border-white/5 rounded-xl flex justify-between items-center text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-emerald-400" />
                                <span className="text-slate-300 truncate max-w-xs">{bak.backupFile}</span>
                              </div>
                              <span className="text-slate-500 font-bold">{formatBytes(bak.sizeBytes)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT TEMPLATE DIALOG --- */}
      <AnimatePresence>
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setEditingTemplate(null)} className="absolute inset-0 bg-black backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-surface border border-border/85 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left">
              <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-md font-heading font-black text-foreground uppercase tracking-wider">Configure Template</h2>
                  <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-widest font-mono">TEMPLATE: {editingTemplate.template.name.toUpperCase()}</p>
                </div>
                <button onClick={() => setEditingTemplate(null)} className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"><X size={16} /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {editingTemplate.type === 'email' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Email Subject</label>
                    <input
                      type="text"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Template Body (HTML/Text)</label>
                  <textarea
                    rows="10"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    className="glass-input w-full font-mono text-xs leading-relaxed"
                  />
                  <div className="p-2 bg-slate-900 rounded-lg border border-white/5 flex gap-2 items-start">
                    <Info size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[8px] text-slate-500 leading-normal uppercase">
                      Supported variables: <span className="font-bold text-slate-300 font-mono">&#123;&#123;fullName&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;email&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;otp&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;purpose&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;ticketId&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;oldStatus&#125;&#125;</span>, <span className="font-bold text-slate-300 font-mono">&#123;&#123;newStatus&#125;&#125;</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/60 bg-surface/50 flex justify-end gap-2 shrink-0">
                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleSaveTemplate} disabled={savingTemplate} className="btn-premium flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  {savingTemplate ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                  <span>Save Template</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT/CREATE DEPARTMENT --- */}
      <AnimatePresence>
        {deptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setDeptModalOpen(false)} className="absolute inset-0 bg-black backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-surface border border-border/85 w-full max-w-lg overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left">
              <form onSubmit={handleSaveDepartment} className="flex flex-col h-full">
                <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-md font-heading font-black text-foreground uppercase tracking-wider">{editingDept ? 'Update' : 'Create'} Department</h2>
                    <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-widest font-mono">SECTOR PARAMETERS SETUP</p>
                  </div>
                  <button type="button" onClick={() => setDeptModalOpen(false)} className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"><X size={16} /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Department Name</label>
                    <input
                      type="text"
                      required
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Description</label>
                    <textarea
                      rows="3"
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Department Head / Supervisor</label>
                    <select
                      value={deptHead}
                      onChange={(e) => setDeptHead(e.target.value)}
                      className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Supervisor --</option>
                      {staffOfficers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.user_profiles?.full_name || u.email} ({u.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.03]">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-wide">Auto-Routing Assignment</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">Assign grievances matching categorization</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeptAutoAssign(!deptAutoAssign)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        deptAutoAssign ? 'bg-primary-bright' : 'bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        deptAutoAssign ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="p-6 border-t border-border/60 bg-surface/50 flex justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => setDeptModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingDept} className="btn-premium flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    {savingDept ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                    <span>Save Department</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT/CREATE SLA --- */}
      <AnimatePresence>
        {slaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSlaModalOpen(false)} className="absolute inset-0 bg-black backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-surface border border-border/85 w-full max-w-lg overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left">
              <form onSubmit={handleSaveSla} className="flex flex-col h-full">
                <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-md font-heading font-black text-foreground uppercase tracking-wider">{editingSla ? 'Update' : 'Create'} SLA Rule</h2>
                    <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-widest font-mono">RESOLUTION HOURS CONFIG</p>
                  </div>
                  <button type="button" onClick={() => setSlaModalOpen(false)} className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"><X size={16} /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">SLA Rule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Critical IT Resolution limit"
                      value={slaName}
                      onChange={(e) => setSlaName(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Category / Department Sector</label>
                    <select
                      value={slaCategory}
                      onChange={(e) => setSlaCategory(e.target.value)}
                      className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Priority Triage Level</label>
                    <select
                      value={slaPriority}
                      onChange={(e) => setSlaPriority(e.target.value)}
                      className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Resolution Time (Hours)</label>
                      <input
                        type="number"
                        required
                        value={slaResHours}
                        onChange={(e) => setSlaResHours(e.target.value)}
                        className="glass-input w-full text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Warning Threshold (Hours)</label>
                      <input
                        type="number"
                        required
                        value={slaWarnHours}
                        onChange={(e) => setSlaWarnHours(e.target.value)}
                        className="glass-input w-full text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border/60 bg-surface/50 flex justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => setSlaModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingSla} className="btn-premium flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    {savingSla ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                    <span>Save SLA</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDIT/CREATE ESCALATION --- */}
      <AnimatePresence>
        {escModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setEscModalOpen(false)} className="absolute inset-0 bg-black backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-surface border border-border/85 w-full max-w-lg overflow-hidden flex flex-col relative shadow-2xl rounded-xl text-left">
              <form onSubmit={handleSaveEsc} className="flex flex-col h-full">
                <div className="p-6 border-b border-border/60 bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-md font-heading font-black text-foreground uppercase tracking-wider">{editingEsc ? 'Update' : 'Create'} Escalation Rule</h2>
                    <p className="text-primary-bright text-[9px] font-bold mt-1 uppercase tracking-widest font-mono">AUTOMATED SUPERVISOR ESCALATION</p>
                  </div>
                  <button type="button" onClick={() => setEscModalOpen(false)} className="p-1.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"><X size={16} /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Escalation Rule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Critical IT breach supervisor escalation"
                      value={escName}
                      onChange={(e) => setEscName(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Link to SLA Rule</label>
                    <select
                      value={escSlaId}
                      onChange={(e) => setEscSlaId(e.target.value)}
                      className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {slaRules.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.priority} - {s.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Trigger Delay Past Breach (Hours)</label>
                    <input
                      type="number"
                      required
                      value={escDelayHours}
                      onChange={(e) => setEscDelayHours(e.target.value)}
                      className="glass-input w-full text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Escalate To User (Supervisor)</label>
                    <select
                      value={escToUserId}
                      onChange={(e) => setEscToUserId(e.target.value)}
                      className="w-full bg-[#0d1324]/60 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Default Supervisor (System) --</option>
                      {staffOfficers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.user_profiles?.full_name || u.email} ({u.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-6 border-t border-border/60 bg-surface/50 flex justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => setEscModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingEsc} className="btn-premium flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    {savingEsc ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                    <span>Save Escalation</span>
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

export default SuperAdminSystemPage;
