import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth as useClerkAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-react';
import { apiClient, setClerkGetToken, setAccessToken } from '../../api/apiClient';
import { isSandboxAccount } from '../../utils/authMode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks the Clerk user id we've already synced, so we never fire /auth/sync
  // more than once per session (Clerk re-renders several times while loading).
  const syncedClerkIdRef = useRef(null);

  // Set Clerk token fetch function in Axios client on mount/update
  useEffect(() => {
    setClerkGetToken(getToken);
  }, [getToken]);

  // Synchronize auth state (Clerk session or local credentials session)
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      // 1. If Clerk SDK hasn't finished loading yet, remain in loading state.
      if (!isAuthLoaded || !isUserLoaded) {
        return;
      }

      // Fast path: user state is already resolved — stop loading.
      if (user) {
        if (active) setLoading(false);
        return;
      }

      // 2. Restore an existing local (sandbox/JWT) session if present.
      const hasLocalSession = localStorage.getItem('has_active_session') === 'true';
      if (hasLocalSession && !isSignedIn) {
        try {
          const refreshRes = await apiClient.post('/auth/refresh-token');
          setAccessToken(refreshRes.data.token);

          const profileRes = await apiClient.get('/user/profile');
          const pData = profileRes.data;

          if (active) {
            setUser({
              id: pData.account.id,
              email: pData.account.email,
              role: pData.account.role || 'student',
              fullName: pData.profile.fullName
            });
            setLoading(false);
          }
          return;
        } catch {
          const savedUser = localStorage.getItem('demo_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (active) {
                setUser(parsed);
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error('Failed to parse saved demo user:', e);
            }
          }
          setAccessToken(null);
        }
      }

      // 3. Synchronize Clerk OAuth/session once loaded.
      if (isSignedIn && clerkUser) {
        try {
          if (syncedClerkIdRef.current !== clerkUser.id) {
            syncedClerkIdRef.current = clerkUser.id;
            const res = await apiClient.post('/auth/sync');
            if (res.data?.token) {
              setAccessToken(res.data.token);
            }
            if (active) {
              setUser(res.data.user);
            }
          }
        } catch (err) {
          console.error('Failed to sync Clerk user with backend:', err.message);
          syncedClerkIdRef.current = null;
          if (active) {
            setUser({
              id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              role: clerkUser.publicMetadata?.role || 'student',
              fullName: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Clerk User'
            });
          }
        } finally {
          if (active) setLoading(false);
        }
      } else {
        if (active) {
          setUser(null);
          syncedClerkIdRef.current = null;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [user, isSignedIn, clerkUser?.id, isAuthLoaded, isUserLoaded]);

  // Listen to custom expiration event to handle logout
  useEffect(() => {
    const handleExpiredEvent = () => {
      if (isSignedIn) {
        signOut().catch(console.error);
      }
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener('auth_session_expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpiredEvent);
    };
  }, [signOut, isSignedIn]);

  // Auth Operations
  const register = async (fullName, email, password, role) => {
    const isSandbox = isSandboxAccount(email);

    if (isSandbox) {
      const payload = {
        fullName,
        email: email.toLowerCase().trim(),
        password,
        role
      };
      const response = await apiClient.post('/auth/register', payload);
      return {
        message: response.data.message || 'Registration successful. Please enter the OTP sent to verify your identity.',
        email
      };
    }

    if (!isSignUpLoaded) throw new Error('Clerk SignUp SDK not loaded');

    // Clerk dashboard requires: firstName, lastName, username, phone_number.
    // We derive username from the email prefix + 4-char random suffix for uniqueness.
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || fullName.trim();
    const lastName = nameParts.slice(1).join(' ') || '.';

    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const suffix = Math.random().toString(36).slice(2, 6); // 4 random alphanumeric chars
    const username = `${emailPrefix}_${suffix}`;

    // Note: `role` is stored in unsafeMetadata only for display convenience. The backend
    // never trusts it for authorization — server-side role comes from publicMetadata.
    const res = await signUp.create({
      firstName,
      lastName,
      username,
      emailAddress: email,
      password: password,
      unsafeMetadata: {
        fullName,
        role
      }
    });

    if (res.status === 'missing_requirements') {
      throw new Error(`Registration incomplete — Clerk requires: ${res.missingFields?.join(', ') || 'unknown fields'}. Check Clerk dashboard field configuration.`);
    }

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

    return {
      message: 'Registration successful. Please enter the OTP sent to verify your identity.',
      email
    };
  };

  const DEMO_PRESETS = {
    student: {
      id: 'demo-student-id-101',
      email: 'student@resolvenow.demo',
      role: 'student',
      fullName: 'Student User'
    },
    admin: {
      id: 'demo-admin-id-101',
      email: 'admin@resolvenow.demo',
      role: 'admin',
      fullName: 'System Administrator'
    },
    officer: {
      id: 'demo-officer-id-101',
      email: 'officer@resolvenow.demo',
      role: 'officer',
      fullName: 'Grievance Officer'
    }
  };

  const simpleLogin = async (role = 'student', customEmail = null) => {
    const normRole = (role || 'student').toLowerCase();
    const demoUser = DEMO_PRESETS[normRole] || {
      id: `demo-${normRole}-${Date.now()}`,
      email: customEmail || `${normRole}@resolvenow.demo`,
      role: normRole,
      fullName: `${normRole.charAt(0).toUpperCase() + normRole.slice(1)} User`
    };

    localStorage.setItem('has_active_session', 'true');
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    setUser(demoUser);

    apiClient.post('/auth/login', { email: demoUser.email, password: 'DemoPassword@123', loginType: 'password' })
      .then(res => {
        if (res.data?.token) setAccessToken(res.data.token);
      })
      .catch(() => {});

    return { message: 'Simple login successful.', user: demoUser };
  };

  const login = async (identifier, password, loginType = 'password', rememberMe = false) => {
    const isSandbox = isSandboxAccount(identifier);

    if (isSandbox) {
      try {
        const payload = {
          email: identifier.toLowerCase().trim(),
          password,
          loginType,
          rememberMe
        };
        const response = await apiClient.post('/auth/login', payload);
        const data = response.data;

        if (data.requiresOtp) {
          return { requiresOtp: true, message: data.message };
        }

        if (data.requiresActivation) {
          return {
            requiresActivation: true,
            message: data.message,
            email: data.email
          };
        }

        if (data.token) {
          setAccessToken(data.token);
          setUser(data.user);
          localStorage.setItem('has_active_session', 'true');
          localStorage.setItem('demo_user', JSON.stringify(data.user));
          return {
            message: 'Login successful.',
            user: data.user
          };
        }
      } catch (err) {
        console.warn('Local login API warning, activating simple login fallback:', err.message);
        const lower = (identifier || '').toLowerCase();
        const detectedRole = lower.includes('admin') ? 'admin' : (lower.includes('officer') ? 'officer' : 'student');
        return simpleLogin(detectedRole, identifier);
      }
    }

    try {
      if (!isSignInLoaded) {
        const lower = (identifier || '').toLowerCase();
        const detectedRole = lower.includes('admin') ? 'admin' : (lower.includes('officer') ? 'officer' : 'student');
        return simpleLogin(detectedRole, identifier);
      }

      let res;
      if (loginType === 'otp') {
        res = await signIn.create({
          identifier,
          strategy: 'email_code'
        });
        return { requiresOtp: true };
      } else {
        res = await signIn.create({
          identifier,
          password
        });
      }

      if (res.status === 'needs_second_factor') {
        return { 
          requiresOtp: true, 
          message: 'Administrative accounts require a second factor. An OTP has been sent to your registered email.' 
        };
      }

      if (res.status === 'complete') {
        await setSignInActive({ session: res.createdSessionId });
        
        const syncRes = await apiClient.post('/auth/sync');
        setUser(syncRes.data.user);
        localStorage.setItem('has_active_session', 'true');
        localStorage.setItem('demo_user', JSON.stringify(syncRes.data.user));
        return {
          message: 'Login successful.',
          user: syncRes.data.user
        };
      }
    } catch (clerkErr) {
      console.warn('Clerk auth warning, falling back to simple login:', clerkErr.message);
      const lower = (identifier || '').toLowerCase();
      const detectedRole = lower.includes('admin') ? 'admin' : (lower.includes('officer') ? 'officer' : 'student');
      return simpleLogin(detectedRole, identifier);
    }
  };

  const loginWithGoogle = async () => {
    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      signUpRedirectUrl: '/sso-callback'
    });
  };

  const loginWithMicrosoft = async () => {
    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

    // Requires the Microsoft OAuth connection to be enabled in the Clerk dashboard.
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_microsoft',
      redirectUrl: '/sso-callback',
      signUpRedirectUrl: '/sso-callback'
    });
  };

  const verifyOtp = async (identifier, otp, purpose, rememberMe = false) => {
    const isSandbox = isSandboxAccount(identifier);

    if (isSandbox) {
      const payload = {
        email: identifier.toLowerCase().trim(),
        otp,
        purpose,
        rememberMe
      };
      const response = await apiClient.post('/auth/verify-otp', payload);
      const data = response.data;

      if (data.resetCode) {
        return {
          message: data.message,
          resetCode: data.resetCode
        };
      }

      if (data.token) {
        setAccessToken(data.token);
        setUser(data.user);
        return {
          message: 'Identity verified. Session authenticated.',
          user: data.user
        };
      }
      throw new Error(data.message || 'Verification failed.');
    }

    if (purpose === 'registration') {
      if (!isSignUpLoaded) throw new Error('Clerk SignUp SDK not loaded');

      // Guard: if signUp object is stale (e.g. after page refresh), it won't have
      // a pending email verification. Surface a clear error rather than a cryptic Clerk one.
      if (!signUp.status || signUp.status === 'abandoned') {
        throw new Error('Verification session expired. Please register again.');
      }

      const res = await signUp.attemptEmailAddressVerification({ code: otp });

      if (res.status === 'complete') {
        if (!res.createdSessionId) {
          throw new Error('Verification completed but no session ID was created by Clerk.');
        }
        await setSignUpActive({ session: res.createdSessionId });
        const syncRes = await apiClient.post('/auth/sync');
        setUser(syncRes.data.user);
        return {
          message: 'Identity verified. Session authenticated.',
          user: syncRes.data.user
        };
      }
      throw new Error(`Verification failed with status: ${res.status}${
        res.missingFields?.length ? ` (missing: ${res.missingFields.join(', ')})` : ''
      }`);
    } else if (purpose === 'login' || purpose === 'mfa') {
      if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

      // Guard: if signIn object is stale (page refresh), surface a clear error.
      if (!signIn.status) {
        throw new Error('Login session expired. Please sign in again.');
      }

      let res;
      // For email_code OTP login (loginType='otp'), the flow is:
      //   signIn.create({ identifier, strategy: 'email_code' }) → firstFactor
      // For admin password+MFA, the flow is:
      //   signIn.create({ identifier, password }) → needs_second_factor → secondFactor
      // Determine which factor to attempt based on the current sign-in status.
      if (signIn.status === 'needs_second_factor') {
        res = await signIn.attemptSecondFactor({ strategy: 'email_code', code: otp });
      } else {
        // Default: attempt first factor (covers email_code OTP login and reset_password)
        res = await signIn.attemptFirstFactor({ strategy: 'email_code', code: otp });
      }

      if (res.status === 'complete') {
        await setSignInActive({ session: res.createdSessionId });
        const syncRes = await apiClient.post('/auth/sync');
        setUser(syncRes.data.user);
        return {
          message: 'Identity verified. Session authenticated.',
          user: syncRes.data.user
        };
      }
      throw new Error(`Verification failed with status: ${res.status}`);
    } else if (purpose === 'forgot_password') {
      // Forgot password OTP is handled by the backend for sandbox users (already
      // branched above). For Clerk users, the flow uses reset_password_email_code
      // which is handled via resetPassword(), NOT via verifyOtp().
      throw new Error('For Clerk accounts, password reset is handled via the reset-password page. Please use the Reset Code sent to your email.');
    } else {
      throw new Error(`Unknown OTP purpose: ${purpose}`);
    }
  };

  const resendOtp = async (identifier, purpose) => {
    const isSandbox = isSandboxAccount(identifier);

    if (isSandbox) {
      const payload = {
        email: identifier.toLowerCase().trim(),
        purpose
      };
      const response = await apiClient.post('/auth/resend-otp', payload);
      return response.data;
    }

    if (purpose === 'registration') {
      if (!isSignUpLoaded) throw new Error('Clerk SignUp SDK not loaded');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } else {
      if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');
      await signIn.create({
        identifier,
        strategy: 'email_code'
      });
    }
    return { message: 'A fresh security key has been dispatched.' };
  };

  const forgotPassword = async (email) => {
    const isSandbox = isSandboxAccount(email);

    if (isSandbox) {
      const payload = { email: email.toLowerCase().trim() };
      const response = await apiClient.post('/auth/forgot-password', payload);
      return {
        message: response.data.message || 'If registered, a security reset key has been sent.',
        email
      };
    }

    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');
    await signIn.create({
      strategy: 'reset_password_email_code',
      identifier: email
    });
    return { message: 'If registered, a security reset key has been sent.', email };
  };

  const resetPassword = async (email, password, resetCode) => {
    const isSandbox = isSandboxAccount(email);

    if (isSandbox) {
      const payload = {
        email: email.toLowerCase().trim(),
        password,
        resetCode
      };
      const response = await apiClient.post('/auth/reset-password', payload);
      return response.data;
    }

    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');
    
    const res = await signIn.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code: resetCode,
      password: password
    });

    if (res.status === 'complete') {
      await setSignInActive({ session: res.createdSessionId });
      
      const syncRes = await apiClient.post('/auth/sync');
      setUser(syncRes.data.user);
      return { message: 'Password updated successfully.' };
    }
    throw new Error(`Password reset failed with status: ${res.status}`);
  };

  const logout = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }
    } catch (err) {
      console.error('Clerk signOut error:', err);
    }
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Local logout error:', err);
    }
    localStorage.removeItem('has_active_session');
    localStorage.removeItem('demo_user');
    setAccessToken(null);
    setUser(null);
  };

  // User Profile Settings
  const getProfile = async () => {
    const res = await apiClient.get('/user/profile');
    return res.data;
  };

  const updateProfile = async (fullName, profilePicture, notificationPreferences, department, institution) => {
    const res = await apiClient.put('/user/profile', {
      fullName,
      profilePicture,
      notificationPreferences,
      department,
      institution
    });
    if (res.data?.profile?.fullName) {
      setUser(prev => {
        const updated = { ...prev, fullName: res.data.profile.fullName };
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
    if (clerkUser) {
      await clerkUser.updatePassword({ currentPassword: oldPassword, newPassword: newPassword });
      return { message: 'Password updated successfully.' };
    } else {
      const res = await apiClient.post('/user/change-password', {
        oldPassword,
        newPassword
      });
      return res.data;
    }
  };

  const deleteAccount = async () => {
    const res = await apiClient.delete('/user/account');
    await logout();
    return res.data;
  };

  // Session Management
  const getSessions = async () => {
    const res = await apiClient.get('/sessions');
    return res.data;
  };

  const revokeSession = async (sessionId) => {
    const res = await apiClient.delete(`/sessions/${sessionId}`);
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
        isAuthenticated: !!user || (isSignedIn && !!clerkUser),
        loading,
        register,
        login,
        simpleLogin,
        loginWithGoogle,
        loginWithMicrosoft,
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
