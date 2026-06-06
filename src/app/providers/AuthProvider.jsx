import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken, getAccessToken } from '../../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup silent refresh timer
  const setupRefreshTimer = useCallback((token) => {
    if (!token) return;
    
    // JWT contains an 'exp' field which is unix timestamp in seconds
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTimeMs = payload.exp * 1000;
      const timeBeforeExpMs = expTimeMs - Date.now() - 60000; // Refresh 1 minute before expiry

      if (timeBeforeExpMs > 0) {
        const timer = setTimeout(async () => {
          try {
            const res = await apiClient.post('/auth/refresh-token');
            const { token: newToken } = res.data;
            setAccessToken(newToken);
            setupRefreshTimer(newToken);
          } catch (err) {
            console.warn('Silent refresh failed:', err.message);
            handleLogoutState();
          }
        }, timeBeforeExpMs);

        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Error parsing token exp:', e);
    }
  }, []);

  const handleLoginState = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    setupRefreshTimer(token);
    
    // Store user data in localStorage for hydration of basic profile info
    localStorage.setItem('user_session', JSON.stringify({ user: userData }));
    localStorage.setItem('has_active_session', 'true');
  }, [setupRefreshTimer]);

  const handleLogoutState = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user_session');
    localStorage.removeItem('has_active_session');
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    const hydrateSession = async () => {
      // Check if localStorage indicates we have an active session before making API call
      const hasActiveSession = localStorage.getItem('has_active_session');
      const cachedSession = localStorage.getItem('user_session');
      
      if (cachedSession) {
        try {
          const { user } = JSON.parse(cachedSession);
          setUser(user);
          setIsAuthenticated(true);
        } catch (e) {
          console.error('Failed to parse cached session:', e);
        }
      }

      if (hasActiveSession) {
        try {
          const res = await apiClient.post('/auth/refresh-token');
          const { token } = res.data;
          
          // Decode payload to extract user details
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userData = {
            id: payload.id,
            email: payload.email,
            mobileNumber: payload.phone,
            role: payload.role,
            fullName: payload.full_name
          };

          handleLoginState(token, userData);
        } catch (err) {
          console.warn('Initial session hydration failed:', err.message);
          handleLogoutState();
        }
      }
      setLoading(false);
    };

    hydrateSession();

    // Listen to session expired event from axios interceptor
    const handleExpiredEvent = () => {
      handleLogoutState();
    };

    window.addEventListener('auth_session_expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpiredEvent);
    };
  }, [handleLoginState, handleLogoutState]);

  // Auth Operations
  const register = async (fullName, email, mobileNumber, password, role) => {
    const res = await apiClient.post('/auth/register', {
      fullName,
      email,
      mobileNumber,
      password,
      role
    });
    return res.data;
  };

  const login = async (identifier, password, loginType = 'password', rememberMe = false) => {
    const payload = {};
    if (identifier.includes('@')) {
      payload.email = identifier;
    } else {
      payload.phone = identifier;
    }
    payload.password = password;
    payload.loginType = loginType;
    payload.rememberMe = rememberMe;

    const res = await apiClient.post('/auth/login', payload);
    
    if (res.data.requiresOtp || res.data.requiresActivation) {
      return res.data;
    }

    const { token, user: userData } = res.data;
    handleLoginState(token, userData);
    return res.data;
  };

  const loginWithGoogle = async (credential, rememberMe = false) => {
    const res = await apiClient.post('/auth/google', { credential, rememberMe });
    const { token, user: userData } = res.data;
    handleLoginState(token, userData);
    return res.data;
  };

  const verifyOtp = async (identifier, otp, purpose, rememberMe = false) => {
    const payload = { otp, purpose, rememberMe };
    if (identifier.includes('@')) {
      payload.email = identifier;
    } else {
      payload.phone = identifier;
    }

    const res = await apiClient.post('/auth/verify-otp', payload);
    const { token, user: userData } = res.data;
    if (token && userData) {
      handleLoginState(token, userData);
    }
    return res.data;
  };

  const resendOtp = async (identifier, purpose) => {
    const payload = { purpose };
    if (identifier.includes('@')) {
      payload.email = identifier;
    } else {
      payload.phone = identifier;
    }
    const res = await apiClient.post('/auth/resend-otp', payload);
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, password, resetCode) => {
    const res = await apiClient.post('/auth/reset-password', {
      email,
      password,
      resetCode
    });
    return res.data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed on server:', err.message);
    } finally {
      handleLogoutState();
    }
  };

  // User Profile Settings
  const getProfile = async () => {
    const res = await apiClient.get('/user/profile');
    // Update local user state if changed
    if (res.data?.account) {
      const act = res.data.account;
      const prof = res.data.profile;
      setUser(prev => {
        const updated = {
          ...prev,
          email: act.email,
          mobileNumber: act.mobile_number,
          role: act.role,
          fullName: prof.fullName
        };
        localStorage.setItem('user_session', JSON.stringify({ user: updated }));
        return updated;
      });
    }
    return res.data;
  };

  const updateProfile = async (fullName, profilePicture, notificationPreferences) => {
    const res = await apiClient.put('/user/profile', {
      fullName,
      profilePicture,
      notificationPreferences
    });
    // Update active name in session
    if (res.data?.profile?.fullName) {
      setUser(prev => {
        const updated = { ...prev, fullName: res.data.profile.fullName };
        localStorage.setItem('user_session', JSON.stringify({ user: updated }));
        return updated;
      });
    }
    return res.data;
  };

  const updateAccount = async (email, mobileNumber) => {
    const res = await apiClient.put('/user/account', {
      email,
      mobileNumber
    });
    return res.data;
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await apiClient.post('/user/change-password', {
      oldPassword,
      newPassword
    });
    return res.data;
  };

  const deleteAccount = async () => {
    const res = await apiClient.delete('/user/account');
    handleLogoutState();
    return res.data;
  };

  // Session Management
  const getSessions = async () => {
    const res = await apiClient.get('/sessions');
    return res.data;
  };

  const revokeSession = async (sessionId) => {
    const res = await apiClient.delete(`/sessions/${sessionId}`);
    // If the active session is revoked, logout occurs automatically from API interceptor or response code check
    if (res.data.logoutRequired) {
      handleLogoutState();
    }
    return res.data;
  };

  const revokeAllSessions = async () => {
    const res = await apiClient.delete('/sessions/all');
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        register,
        login,
        loginWithGoogle,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        getProfile,
        updateProfile,
        updateAccount,
        changePassword,
        deleteAccount,
        getSessions,
        revokeSession,
        revokeAllSessions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
