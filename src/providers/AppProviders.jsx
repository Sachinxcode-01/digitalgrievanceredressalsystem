import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { AuthProvider } from '../app/providers/AuthProvider';
import { ThemeProvider } from '../app/providers/ThemeProvider';

const FALLBACK_CLERK_KEY = 'pk_test_Zml0dGluZy1veC00Ny5jbGVyay5hY2NvdW50cy5kZXYk';

class ClerkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasClerkError: false };
  }

  static getDerivedStateFromError(error) {
    console.warn('Clerk Provider failed to initialize or was blocked. Falling back to local auth mode:', error?.message);
    return { hasClerkError: true };
  }

  componentDidCatch(error, info) {
    console.error('Clerk SDK Error:', error, info);
  }

  render() {
    // If Clerk fails, still render children so local JWT session and offline mode work
    if (this.state.hasClerkError) {
      return this.props.fallbackChildren || this.props.children;
    }
    return this.props.children;
  }
}

/**
 * Enterprise Provider Hierarchy:
 * 1. Global ErrorBoundary (catches any unhandled top-level crashes)
 * 2. ClerkErrorBoundary & ClerkProvider (safe OAuth authentication)
 * 3. AuthProvider (Role-based access, local sessions, & Clerk sync)
 * 4. ThemeProvider (dark/light theme tokens)
 * 5. Toast Notifications
 */
export const AppProviders = ({ children }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || FALLBACK_CLERK_KEY;

  return (
    <ErrorBoundary>
      <ClerkErrorBoundary
        fallbackChildren={
          <AuthProvider>
            <ThemeProvider>
              <ToastContainer />
              {children}
            </ThemeProvider>
          </AuthProvider>
        }
      >
        <ClerkProvider
          publishableKey={publishableKey}
          signInUrl="/login"
          signUpUrl="/register"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <AuthProvider>
            <ThemeProvider>
              <ToastContainer />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </ClerkProvider>
      </ClerkErrorBoundary>
    </ErrorBoundary>
  );
};

const ToastContainer = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      style: {
        background: '#0f172a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      },
      success: {
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      },
      error: {
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
);

export default AppProviders;
