import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { motion } from 'framer-motion';
import { ShieldAlert, KeyRound, Bell, History, Trash2, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const AccountSecurityPage = () => {
  const { getProfile, updateProfile, changePassword, deleteAccount } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Password fields
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (value) => {
    setPasswordValidation({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') {
      validatePassword(value);
    }
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfileData(data);
    } catch (err) {
      toast.error('Failed to load profile security details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateNotifications = async (type, val) => {
    if (!profileData) return;
    
    const currentPreferences = profileData.profile?.notificationPreferences || { email: true, sms: true };
    const updatedPreferences = {
      ...currentPreferences,
      [type]: val
    };

    try {
      await updateProfile(
        profileData.profile?.fullName,
        profileData.profile?.profilePicture,
        updatedPreferences
      );
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          notificationPreferences: updatedPreferences
        }
      }));
      toast.success('Notification preferences updated.');
    } catch (err) {
      toast.error('Failed to update preferences.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwords.oldPassword) return toast.error('Current password is required.');
    if (!passwords.newPassword) return toast.error('New password is required.');
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (!isPasswordValid) {
      return toast.error('New password does not meet security rules.');
    }

    setActionLoading(true);
    try {
      await changePassword(passwords.oldPassword, passwords.newPassword);
      toast.success('Password changed successfully.');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const firstCheck = window.confirm(
      'WARNING: This will permanently delete your ResolveNow account, profile details, device links, and active sessions. This action is irreversible. Proceed?'
    );
    if (firstCheck) {
      const confirmationCode = prompt('Please type "DELETE ACCOUNT" to confirm:');
      if (confirmationCode === 'DELETE ACCOUNT') {
        try {
          await deleteAccount();
          toast.success('Your account has been deleted.');
          window.location.href = '/';
        } catch (err) {
          toast.error('Failed to delete account.');
        }
      } else {
        toast.error('Invalid confirmation string. Account deletion cancelled.');
      }
    }
  };

  if (loading || !profileData) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/60 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-muted/60 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { account, logs } = profileData;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 text-foreground text-left">
      {/* Page Title */}
      <div className="border-b border-border/80 pb-6">
        <h1 className="text-2xl font-heading font-black flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          Account Security & Settings
        </h1>
        <p className="text-xs text-muted-foreground font-medium mt-1">
          Manage your credentials, notification routing preferences, and view your account security audit trail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Credentials info and notification settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identity Card */}
          <div className="glass-card p-6 border-border/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Identity Status
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block">Registered Email</span>
                <span className="font-mono text-foreground text-xs">{account.email}</span>
                {account.email_verified ? (
                  <span className="text-[8px] font-bold ml-2 px-1.5 py-0.5 bg-success/15 border border-success/30 text-success rounded-md uppercase">Verified</span>
                ) : (
                  <span className="text-[8px] font-bold ml-2 px-1.5 py-0.5 bg-error/15 border border-error/30 text-error rounded-md uppercase">Unverified</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block">Mobile Connection</span>
                <span className="font-mono text-foreground text-xs">{account.mobile_number || 'None Linked'}</span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-muted-foreground block">Security Clearance</span>
                <span className="font-bold text-primary capitalize">{account.role}</span>
              </div>
            </div>
          </div>

          {/* Notifications config */}
          <div className="glass-card p-6 border-border/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Specify channels for system broadcasts and ticket updates.</p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground">Email Notifications</span>
                  <span className="text-[10px] text-muted-foreground">Alerts on ticket status transitions</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.profile?.notificationPreferences?.email !== false}
                    onChange={(e) => handleUpdateNotifications('email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted-foreground/60 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground">SMS Alerts</span>
                  <span className="text-[10px] text-muted-foreground">Real-time status change SMS</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.profile?.notificationPreferences?.sms !== false}
                    onChange={(e) => handleUpdateNotifications('sms', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-muted-foreground/60 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Password resets and deletion options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Password Reset Card */}
          <div className="glass-card p-6 border-border/50 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Update Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-muted-foreground ml-1">Current Password</label>
                <div className="relative group">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="oldPassword"
                    value={passwords.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="glass-input w-full pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-muted-foreground ml-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="glass-input w-full"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-muted-foreground ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="glass-input w-full"
                    required
                  />
                </div>
              </div>

              {passwords.newPassword && (
                <div className="bg-background/50 border border-border p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Password requirements:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.length ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.length ? 'text-success font-semibold' : 'text-muted-foreground'}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.uppercase ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.uppercase ? 'text-success font-semibold' : 'text-slate-500'}>1 uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.lowercase ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.lowercase ? 'text-success font-semibold' : 'text-slate-500'}>1 lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordValidation.number ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.number ? 'text-success font-semibold' : 'text-slate-500'}>1 number</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {passwordValidation.special ? <Check className="w-3.5 h-3.5 text-success animate-pulse" /> : <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className={passwordValidation.special ? 'text-success font-semibold' : 'text-slate-500'}>1 special character</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="btn-premium py-2.5 px-5 text-xs uppercase tracking-widest font-bold"
              >
                {actionLoading ? 'Updating...' : 'Save Password'}
              </button>
            </form>
          </div>

          {/* Audit Logs Trail */}
          <div className="glass-card p-6 border-border/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Security Audit Log
            </h3>
            <p className="text-xs text-muted-foreground">Chronological history of security and session modifications.</p>

            <div className="max-h-56 overflow-y-auto border border-border rounded-xl divide-y divide-border/50">
              {logs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex justify-between gap-4 bg-background/20 hover:bg-background/40 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-foreground block">{log.action}</span>
                    <span className="text-muted-foreground text-[9px] block font-mono">{log.user_agent ? log.user_agent.substring(0, 50) + '...' : 'Unknown Agent'}</span>
                  </div>
                  <div className="text-right space-y-1 text-[10px] text-muted-foreground font-mono">
                    <span className="block">{log.ip_address}</span>
                    <span className="block text-[9px] text-muted-foreground/60">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-xs font-medium">No recent log actions recorded.</div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-error/5 border border-error/20 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Terminating your account will wipe your credential tokens, profile data, and all submitted tickets.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-error/10 hover:bg-error/15 border border-error/30 text-error text-xs rounded-xl font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Terminate My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecurityPage;
