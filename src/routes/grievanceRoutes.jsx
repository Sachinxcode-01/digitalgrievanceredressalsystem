import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { Layout } from '../app/layouts/Layout';

const UserDashboard = React.lazy(() => import('../pages/dashboard/UserDashboardPage').then(m => ({ default: m.UserDashboard })));
const SubmitGrievancePage = React.lazy(() => import('../pages/grievances/SubmitGrievancePage').then(m => ({ default: m.SubmitGrievancePage })));
const MyGrievancesPage = React.lazy(() => import('../pages/grievances/MyGrievancesPage').then(m => ({ default: m.MyGrievancesPage })));
const GrievanceDetailsPage = React.lazy(() => import('../pages/grievances/GrievanceDetailsPage').then(m => ({ default: m.GrievanceDetailsPage })));
const AppealGrievancePage = React.lazy(() => import('../pages/grievances/AppealGrievancePage'));
const StudentReportsPage = React.lazy(() => import('../pages/reports/StudentReportsPage').then(m => ({ default: m.StudentReportsPage })));

export const getGrievanceRoutes = ({ user, logout, theme, setTheme }) => (
  <>
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <UserDashboard />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/submit"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <SubmitGrievancePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/my-grievances"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <MyGrievancesPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/grievance/:id"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <GrievanceDetailsPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/appeal"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <AppealGrievancePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <StudentReportsPage />
          </Layout>
        </ProtectedRoute>
      }
    />
  </>
);
