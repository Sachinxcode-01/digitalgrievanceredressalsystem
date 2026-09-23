import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { PageLoader } from '../../components/feedback/PageLoader';

export const AuthenticatedRedirect = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  if (role === 'admin' || role === 'super admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === 'officer' || role === 'faculty' || role === 'staff') {
    return <Navigate to="/officer/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

/**
 * AuthRoute wrapper for login/signup pages.
 * Prevents authenticated users from viewing auth screens, routing them to their dashboard.
 */
export const AuthRoute = ({ children, redirectTo }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader message="Verifying Authentication..." />;
  if (isAuthenticated) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : <AuthenticatedRedirect />;
  }
  return children;
};

export default AuthRoute;
