import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-react';
import { apiClient, setClerkGetToken, setAccessToken } from '../../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set Clerk token fetch function in Axios client on mount/update
  useEffect(() => {
    setClerkGetToken(getToken);
  }, [getToken]);

  // Synchronize auth state (Clerk or local credentials session)
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      // Fast path: if user is already synced and active, do nothing
      if (user) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      // 1. Check for active local sandbox session first
      const hasLocalSession = localStorage.getItem('has_active_session') === 'true';
      if (hasLocalSession) {
        try {
          const refreshRes = await apiClient.post('/auth/refresh-token');
          const token = refreshRes.data.token;
          setAccessToken(token);
          
          const profileRes = await apiClient.get('/user/profile');
          const pData = profileRes.data;
          
          if (active) {
            setUser({
              id: pData.account.id,
              email: pData.account.email,
              mobileNumber: pData.account.mobile_number,
              role: pData.account.role,
              fullName: pData.profile.fullName
            });
            setLoading(false);
          }
          return;
        } catch (err) {
          console.log('Failed to restore local session, clearing local token:', err.message);
          setAccessToken(null);
          // Fall through to check Clerk
        }
      }

      // 2. Synchronize Clerk session if available
      if (isAuthLoaded && isUserLoaded) {
        if (isSignedIn && clerkUser) {
          try {
            console.log('[Clerk] Session is signed in. Syncing user with backend database...');
            const res = await apiClient.post('/auth/sync');
            if (active) {
              setUser(res.data.user);
            }
          } catch (err) {
            console.error('Failed to sync authenticated Clerk user with database:', err);
            if (active) {
              setUser(null);
            }
          }
        } else {
          if (active && user) {
            console.log('[Clerk] Session is signed out. Clearing user state.');
            setUser(null);
          }
        }
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [user, isSignedIn, clerkUser, isAuthLoaded, isUserLoaded]);

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
  const register = async (fullName, email, mobileNumber, password, role) => {
    const isSandbox = typeof email === 'string' && email.toLowerCase().trim().endsWith('@resolve.now');

    if (isSandbox) {
      const payload = {
        fullName,
        email: email.toLowerCase().trim(),
        mobileNumber,
        password,
        role
      };
      const response = await apiClient.post('/auth/register', payload);
      return {
        message: response.data.message || 'Registration successful. Please enter the OTP sent to verify your identity.',
        email,
        phone: mobileNumber
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

    // Clerk requires phone_number in E.164 format (+CountryCodeNumber).
    // Validate presence and basic format before calling Clerk's API.
    const trimmedPhone = (mobileNumber || '').trim();
    if (!trimmedPhone) {
      throw new Error('Mobile number is required for account verification. Please enter your phone number in international format (e.g. +919876543210).');
    }
    if (!/^\+[1-9]\d{6,14}$/.test(trimmedPhone)) {
      throw new Error('Invalid phone number format. Use international format starting with + (e.g. +919876543210).');
    }

    console.log('[Clerk] signUp.create() payload:', { firstName, lastName, username, emailAddress: email, phoneNumber: trimmedPhone });

    const res = await signUp.create({
      firstName,
      lastName,
      username,
      emailAddress: email,
      password: password,
      phoneNumber: trimmedPhone,
      unsafeMetadata: {
        fullName,
        role,
        mobileNumber: trimmedPhone
      }
    });

    console.log('[Clerk] signUp.create() status:', res.status, res);

    if (res.status === 'missing_requirements') {
      console.error('[Clerk] missing_requirements — missingFields:', res.missingFields, 'requiredFields:', res.requiredFields);
      throw new Error(`Registration incomplete — Clerk requires: ${res.missingFields?.join(', ') || 'unknown fields'}. Check Clerk dashboard field configuration.`);
    }

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

    return {
      message: 'Registration successful. Please enter the OTP sent to verify your identity.',
      email,
      phone: trimmedPhone
    };
  };

  const login = async (identifier, password, loginType = 'password', rememberMe = false) => {
    const isSandbox = typeof identifier === 'string' && identifier.toLowerCase().trim().endsWith('@resolve.now');

    if (isSandbox) {
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
        return {
          message: 'Login successful.',
          user: data.user
        };
      }
      throw new Error(data.message || 'Login failed.');
    }

    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

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
        message: 'Administrative accounts require a second factor. An OTP has been sent to your registered email/phone.' 
      };
    }

    if (res.status === 'complete') {
      await setSignInActive({ session: res.createdSessionId });
      
      const syncRes = await apiClient.post('/auth/sync');
      setUser(syncRes.data.user);
      return {
        message: 'Login successful.',
        user: syncRes.data.user
      };
    }

    throw new Error(`Login failed with status: ${res.status}`);
  };

  const loginWithGoogle = async () => {
    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');
    
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/dashboard',
      signUpRedirectUrl: '/dashboard'
    });
  };

  const verifyOtp = async (identifier, otp, purpose, rememberMe = false) => {
    const isSandbox = typeof identifier === 'string' && identifier.toLowerCase().trim().endsWith('@resolve.now');

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
        console.error('[Clerk] signUp object is stale/missing. Status:', signUp.status);
        throw new Error('Verification session expired. Please register again.');
      }

      console.log('[Clerk] signUp before attemptEmailAddressVerification — status:', signUp.status, 'emailVerification:', signUp.verifications?.emailAddress);

      const res = await signUp.attemptEmailAddressVerification({ code: otp });

      console.log('[Clerk] attemptEmailAddressVerification result — status:', res.status, 'createdSessionId:', res.createdSessionId);

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
      // Log the full object so we can see exactly what's missing
      console.error('[Clerk] Registration verification failed:', res.status, 'missingFields:', res.missingFields, res);
      throw new Error(`Verification failed with status: ${res.status}${
        res.missingFields?.length ? ` (missing: ${res.missingFields.join(', ')})` : ''
      }`);
    } else if (purpose === 'login' || purpose === 'mfa') {
      if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

      // Guard: if signIn object is stale (page refresh), surface a clear error.
      if (!signIn.status) {
        console.error('[Clerk] signIn object is stale/missing. Status:', signIn.status);
        throw new Error('Login session expired. Please sign in again.');
      }

      console.log('[Clerk] signIn before verification — status:', signIn.status,
        'firstFactorVerification:', signIn.firstFactorVerification,
        'secondFactorVerification:', signIn.secondFactorVerification);

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

      console.log('[Clerk] attemptFactor result — status:', res.status, res);

      if (res.status === 'complete') {
        await setSignInActive({ session: res.createdSessionId });
        const syncRes = await apiClient.post('/auth/sync');
        setUser(syncRes.data.user);
        return {
          message: 'Identity verified. Session authenticated.',
          user: syncRes.data.user
        };
      }
      console.error('[Clerk] Login verification failed:', res.status, res);
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
    const isSandbox = typeof identifier === 'string' && identifier.toLowerCase().trim().endsWith('@resolve.now');

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
    const isSandbox = typeof email === 'string' && email.toLowerCase().trim().endsWith('@resolve.now');

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
    const isSandbox = typeof email === 'string' && email.toLowerCase().trim().endsWith('@resolve.now');

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
    setAccessToken(null);
    setUser(null);
  };

  // User Profile Settings
  const getProfile = async () => {
    const res = await apiClient.get('/user/profile');
    return res.data;
  };

  const updateProfile = async (fullName, profilePicture, notificationPreferences) => {
    const res = await apiClient.put('/user/profile', {
      fullName,
      profilePicture,
      notificationPreferences
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
        isAuthenticated: !!user,
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
