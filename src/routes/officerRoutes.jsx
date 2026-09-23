import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { Layout } from '../app/layouts/Layout';

const OfficerDashboard = React.lazy(() => import('../pages/dashboard/OfficerDashboardPage').then(m => ({ default: m.OfficerDashboardPage })));
const OfficerGrievanceQueuePage = React.lazy(() => import('../pages/officer/OfficerGrievanceQueuePage').then(m => ({ default: m.OfficerGrievanceQueuePage })));
const GrievanceDetailsPage = React.lazy(() => import('../pages/grievances/GrievanceDetailsPage').then(m => ({ default: m.GrievanceDetailsPage })));

const OFFICER_ROLES = ['officer', 'faculty', 'staff', 'admin', 'super admin'];

export const getOfficerRoutes = ({ user, logout, theme, setTheme }) => (
  <>
    <Route
      path="/officer/dashboard"
      element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={OFFICER_ROLES} fallback={<Navigate to="/dashboard" />}>
            <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
              <OfficerDashboard />
            </Layout>
          </RoleGuard>
        </ProtectedRoute>
      }
    />
    <Route
      path="/officer/queue"
      element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={OFFICER_ROLES} fallback={<Navigate to="/dashboard" />}>
            <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
              <OfficerGrievanceQueuePage />
            </Layout>
          </RoleGuard>
        </ProtectedRoute>
      }
    />
    <Route
      path="/officer/grievance/:id"
      element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={OFFICER_ROLES} fallback={<Navigate to="/dashboard" />}>
            <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
              <GrievanceDetailsPage />
            </Layout>
          </RoleGuard>
        </ProtectedRoute>
      }
    />
  </>
);
