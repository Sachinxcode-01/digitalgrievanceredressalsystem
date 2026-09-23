import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { AuthRoute } from './guards/AuthRoute';

const LoginPage = React.lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = React.lazy(() => import('../pages/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const VerifyOtpPage = React.lazy(() => import('../pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage'));

/**
 * SSO / OAuth Callback Page.
 * Renders Clerk's AuthenticateWithRedirectCallback component to finish
 * the OAuth token exchange and seamlessly route to the target dashboard.
 */
const SsoCallbackPage = () => (
  <AuthenticateWithRedirectCallback
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/dashboard"
    continueSignUpUrl="/register"
  />
);

export const getAuthRoutes = () => (
  <>
    <Route
      path="/login"
      element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      }
    />
    <Route
      path="/admin-login"
      element={
        <AuthRoute redirectTo="/admin/dashboard">
          <AdminLoginPage />
        </AuthRoute>
      }
    />
    <Route path="/admin/login" element={<Navigate to="/admin-login" replace />} />
    <Route
      path="/register"
      element={
        <AuthRoute>
          <RegisterPage />
        </AuthRoute>
      }
    />
    <Route
      path="/verify-otp"
      element={
        <AuthRoute>
          <VerifyOtpPage />
        </AuthRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <AuthRoute>
          <ForgotPasswordPage />
        </AuthRoute>
      }
    />
    <Route
      path="/reset-password"
      element={
        <AuthRoute>
          <ResetPasswordPage />
        </AuthRoute>
      }
    />
    <Route path="/sso-callback" element={<SsoCallbackPage />} />
  </>
);
