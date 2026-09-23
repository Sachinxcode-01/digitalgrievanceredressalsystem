import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { Layout } from '../app/layouts/Layout';

const AdminDashboard = React.lazy(() => import('../pages/dashboard/AdminDashboardPage').then(m => ({ default: m.AdminDashboard })));
const AdminGrievancesPage = React.lazy(() => import('../pages/admin/AdminGrievancesPage').then(m => ({ default: m.AdminGrievancesPage })));
const AdminGrievanceDetailsPage = React.lazy(() => import('../pages/admin/AdminGrievanceDetailsPage').then(m => ({ default: m.AdminGrievanceDetailsPage })));
const AdminUsersPage = React.lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminAuditPage = React.lazy(() => import('../pages/admin/AdminAuditPage'));
const AdminHealthPage = React.lazy(() => import('../pages/analytics/AdminHealthPage').then(m => ({ default: m.AdminHealthPage })));
const SuperAdminSystemPage = React.lazy(() => import('../pages/admin/SuperAdminSystemPage'));
const AdminCompliancePage = React.lazy(() => import('../pages/admin/AdminCompliancePage'));
const AdminRolesPage = React.lazy(() => import('../pages/admin/AdminRolesPage'));
const PredictiveInsightsPage = React.lazy(() => import('../pages/analytics/PredictiveInsightsPage'));
const AdminDepartmentsPage = React.lazy(() => import('../pages/admin/AdminDepartmentsPage'));
const AdminReportsPage = React.lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminOfficersPage = React.lazy(() => import('../pages/admin/AdminOfficersPage'));

const ADMIN_ROLES = ['admin', 'super admin'];

export const getAdminRoutes = ({ user, logout, theme, setTheme }) => {
  const withAdminLayout = (Component) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={ADMIN_ROLES} fallback={<Navigate to="/dashboard" />}>
        <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
          <Component />
        </Layout>
      </RoleGuard>
    </ProtectedRoute>
  );

  return (
    <>
      <Route path="/admin/dashboard" element={withAdminLayout(AdminDashboard)} />
      <Route path="/admin/grievances" element={withAdminLayout(AdminGrievancesPage)} />
      <Route path="/admin/grievance/:id" element={withAdminLayout(AdminGrievanceDetailsPage)} />
      <Route path="/admin/users" element={withAdminLayout(AdminUsersPage)} />
      <Route path="/admin/audit" element={withAdminLayout(AdminAuditPage)} />
      <Route path="/admin/health" element={withAdminLayout(AdminHealthPage)} />
      <Route path="/admin/system" element={withAdminLayout(SuperAdminSystemPage)} />
      <Route path="/admin/compliance" element={withAdminLayout(AdminCompliancePage)} />
      <Route path="/admin/roles" element={withAdminLayout(AdminRolesPage)} />
      <Route path="/admin/insights" element={withAdminLayout(PredictiveInsightsPage)} />
      <Route path="/admin/predictive" element={<Navigate to="/admin/insights" replace />} />
      <Route path="/admin/departments" element={withAdminLayout(AdminDepartmentsPage)} />
      <Route path="/admin/reports" element={withAdminLayout(AdminReportsPage)} />
      <Route path="/admin/officers" element={withAdminLayout(AdminOfficersPage)} />
    </>
  );
};
