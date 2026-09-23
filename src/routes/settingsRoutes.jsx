import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { Layout } from '../app/layouts/Layout';

const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = React.lazy(() => import('../pages/settings/SettingsPage'));
const SessionsPage = React.lazy(() => import('../pages/settings/SessionsPage'));
const AccountSecurityPage = React.lazy(() => import('../pages/settings/AccountSecurityPage'));
const MaintenancePage = React.lazy(() => import('../pages/public/MaintenancePage'));
const NotFoundPage = React.lazy(() => import('../pages/public/NotFoundPage'));

export const getSettingsAndSystemRoutes = ({ user, logout, theme, setTheme }) => (
  <>
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <SettingsPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/sessions"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <SessionsPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings/security"
      element={
        <ProtectedRoute>
          <Layout user={user} onLogout={logout} theme={theme} setTheme={setTheme}>
            <AccountSecurityPage />
          </Layout>
        </ProtectedRoute>
      }
    />

    {/* System Resilience, 404 & Maintenance Views */}
    <Route path="/maintenance" element={<MaintenancePage />} />
    <Route path="/500" element={<MaintenancePage />} />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </>
);
