import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

/**
 * Route protection wrapper component.
 * Blocks rendering of child routes if the user is unauthenticated.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="w-12 h-12 border-4 border-b-cyan-400 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}></div>
        </div>
        <p className="mt-6 text-sm text-slate-400 font-mono tracking-widest uppercase animate-pulse">
          Decrypting Identity...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save path for post-auth redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
