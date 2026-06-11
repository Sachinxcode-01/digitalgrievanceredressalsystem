import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-react';
import { apiClient, setClerkGetToken } from '../../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signIn, isLoaded: isSignInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded, setActive: setSignUpActive } = useSignUp();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set Clerk token fetch function in Axios client on mount/update
  useEffect(() => {
    setClerkGetToken(getToken);
  }, [getToken]);

  // Synchronize Clerk auth state with local database user details
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && clerkUser) {
        try {
          // Call the backend sync endpoint
          const res = await apiClient.post('/auth/sync');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to sync authenticated Clerk user with database:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    if (isLoaded) {
      syncUser();
    }
  }, [isSignedIn, clerkUser, isLoaded]);

  // Listen to custom expiration event to handle logout
  useEffect(() => {
    const handleExpiredEvent = () => {
      signOut();
      setUser(null);
    };

    window.addEventListener('auth_session_expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('auth_session_expired', handleExpiredEvent);
    };
  }, [signOut]);

  // Auth Operations
  const register = async (fullName, email, mobileNumber, password, role) => {
    if (!isSignUpLoaded) throw new Error('Clerk SignUp SDK not loaded');

    const res = await signUp.create({
      emailAddress: email,
      password: password,
      unsafeMetadata: {
        fullName,
        role,
        mobileNumber
      }
    });

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

    return {
      message: 'Registration successful. Please enter the OTP sent to verify your identity.',
      email,
      phone: mobileNumber
    };
  };

  const login = async (identifier, password, loginType = 'password', rememberMe = false) => {
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
    if (purpose === 'registration') {
      if (!isSignUpLoaded) throw new Error('Clerk SignUp SDK not loaded');

      const res = await signUp.attemptEmailAddressVerification({ code: otp });
      if (res.status === 'complete') {
        await setSignUpActive({ session: res.createdSessionId });
        
        const syncRes = await apiClient.post('/auth/sync');
        setUser(syncRes.data.user);
        return {
          message: 'Identity verified. Session authenticated.',
          user: syncRes.data.user
        };
      }
      throw new Error(`Verification failed with status: ${res.status}`);
    } else {
      if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');

      let res;
      if (signIn.firstFactorVerification?.status === 'unverified') {
        res = await signIn.attemptFirstFactor({ strategy: 'email_code', code: otp });
      } else {
        res = await signIn.attemptSecondFactor({ code: otp });
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
    }
  };

  const resendOtp = async (identifier, purpose) => {
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
    if (!isSignInLoaded) throw new Error('Clerk SignIn SDK not loaded');
    await signIn.create({
      strategy: 'reset_password_email_code',
      identifier: email
    });
    return { message: 'If registered, a security reset key has been sent.', email };
  };

  const resetPassword = async (email, password, resetCode) => {
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
    await signOut();
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
