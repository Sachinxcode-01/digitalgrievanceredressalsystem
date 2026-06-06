import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './app/layouts/Layout';
import { isMisconfigured } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './app/providers/AuthProvider';
import { ProtectedRoute } from './app/routes/ProtectedRoute';
import { RoleGuard } from './app/routes/RoleGuard';

// --- Lazy Load Pages for Code Splitting ---
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = React.lazy(() => import('./pages/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const UserDashboard = React.lazy(() => import('./pages/dashboard/UserDashboardPage').then(m => ({ default: m.UserDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboardPage').then(m => ({ default: m.AdminDashboard })));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PublicStatusPage = React.lazy(() => import('./pages/public/PublicTrackingPage').then(m => ({ default: m.PublicStatusPage })));
const LandingPage = React.lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const StatusPage = React.lazy(() => import('./pages/public/StatusPage').then(m => ({ default: m.StatusPage })));
const AdminHealthPage = React.lazy(() => import('./pages/analytics/AdminHealthPage').then(m => ({ default: m.AdminHealthPage })));

// --- New Clerk Auth Pages ---
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOtpPage = React.lazy(() => import('./pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const SessionsPage = React.lazy(() => import('./pages/settings/SessionsPage'));
const AccountSecurityPage = React.lazy(() => import('./pages/settings/AccountSecurityPage'));

// --- Administrative Views ---
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAuditPage = React.lazy(() => import('./pages/admin/AdminAuditPage'));
const SuperAdminSystemPage = React.lazy(() => import('./pages/admin/SuperAdminSystemPage'));
const AdminCompliancePage = React.lazy(() => import('./pages/admin/AdminCompliancePage'));
const AdminRolesPage = React.lazy(() => import('./pages/admin/AdminRolesPage'));
const AdminGrievancesPage = React.lazy(() => import('./pages/admin/AdminGrievancesPage').then(m => ({ default: m.AdminGrievancesPage })));
const AdminGrievanceDetailsPage = React.lazy(() => import('./pages/admin/AdminGrievanceDetailsPage').then(m => ({ default: m.AdminGrievanceDetailsPage })));

// --- Grievance Workflow Pages ---
const SubmitGrievancePage = React.lazy(() => import('./pages/grievances/SubmitGrievancePage').then(m => ({ default: m.SubmitGrievancePage })));
const MyGrievancesPage = React.lazy(() => import('./pages/grievances/MyGrievancesPage').then(m => ({ default: m.MyGrievancesPage })));
const GrievanceDetailsPage = React.lazy(() => import('./pages/grievances/GrievanceDetailsPage').then(m => ({ default: m.GrievanceDetailsPage })));

// --- Loading Fallback Spinner ---
const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">Loading Secure Module...</p>
  </div>
);

// --- Setup Error Screen ---
const SetupError = () => (
  <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0f1d]">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="glass-card p-10 max-w-lg w-full z-10 text-center space-y-6">
      <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
        <span className="text-white text-3xl font-bold">!</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Configuration Required</h1>
        <p className="text-slate-400 text-sm">The application is missing required Supabase credentials in your environment configurations.</p>
      </div>
    </div>
  </div>
);

function AppContent() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  if (isMisconfigured) return <SetupError />;

  if (loading) return <PageLoader />;

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Roots */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/public-status" element={<PublicStatusPage />} />
              <Route path="/track" element={<Navigate to="/public-status" replace />} />
              <Route path="/status" element={<StatusPage />} />
              
              {/* Auth Gates */}
              <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
              <Route path="/admin" element={!isAuthenticated ? <AdminLoginPage /> : <Navigate to="/admin/dashboard" />} />
              <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />
              <Route path="/verify-otp" element={!isAuthenticated ? <VerifyOtpPage /> : <Navigate to="/dashboard" />} />
              <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
              <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />

              {/* Student/Citizen console */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['student', 'faculty', 'staff', 'admin', 'super admin']} fallback={<Navigate to="/login" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <UserDashboard sessionUser={user} userProfile={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
                />

              {/* Administrative Command Center */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminDashboard sessionUser={user} userProfile={user} onLogout={logout} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />
              {/* Admin Diagnostics Dashboard */}
              <Route 
                path="/admin/health" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminHealthPage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Users Panel */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminUsersPage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Audit Firewall Panel */}
              <Route 
                path="/admin/audit" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminAuditPage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />

              {/* Super Admin Restricted Systems Config */}
              <Route 
                path="/admin/system" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <SuperAdminSystemPage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Compliance Dashboard */}
              <Route 
                path="/admin/compliance" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminCompliancePage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Roles & Permissions Management */}
              <Route 
                path="/admin/roles" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminRolesPage />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                } 
              />
              
              {/* Profile Page Configurations */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                      <ProfilePage sessionUser={user} userProfile={user} />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Session Revocations Dashboard */}
              <Route 
                path="/sessions" 
                element={
                  <ProtectedRoute>
                    <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                      <SessionsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Account Security Settings Panel */}
              <Route 
                path="/security" 
                element={
                  <ProtectedRoute>
                    <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                      <AccountSecurityPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* ── Grievance Workflow — Citizen ── */}
              <Route
                path="/grievances/submit"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['student', 'faculty', 'staff', 'admin', 'super admin']} fallback={<Navigate to="/login" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <SubmitGrievancePage sessionUser={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['student', 'faculty', 'staff', 'admin', 'super admin']} fallback={<Navigate to="/login" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <MyGrievancesPage sessionUser={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances/:id"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['student', 'faculty', 'staff', 'admin', 'super admin']} fallback={<Navigate to="/login" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <GrievanceDetailsPage sessionUser={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              {/* ── Grievance Workflow — Admin ── */}
              <Route
                path="/admin/grievances"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminGrievancesPage user={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/grievances/:id"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin', 'super admin']} fallback={<Navigate to="/dashboard" />}>
                      <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
                        <AdminGrievanceDetailsPage user={user} />
                      </Layout>
                    </RoleGuard>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
