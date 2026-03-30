import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { PublicStatusPage } from './pages/PublicStatusPage';
import { BackgroundGradientAnimationDemo } from './components/ui/demo';
import { supabase, isMisconfigured } from './lib/supabase';
import { Toaster } from 'react-hot-toast';

// --- Setup Error Screen ---
const SetupError = () => (
  <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0f1d]">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="glass-card p-10 max-w-lg w-full z-10 text-center space-y-6">
      <div className="w-16 h-16 bg-gradient-to-tr from-error/80 to-warning rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-error/30">
        <span className="text-white text-3xl font-bold">!</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">Configuration Required</h1>
        <p className="text-slate-400 text-sm">The app is missing required environment variables. Please add them to your Vercel project settings.</p>
      </div>
      <div className="text-left bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Steps to fix:</p>
        <div className="space-y-2 text-sm text-slate-300">
          <p><span className="text-primary font-bold">1.</span> Go to <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs">vercel.com</span> → Your Project</p>
          <p><span className="text-primary font-bold">2.</span> Open <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs">Settings → Environment Variables</span></p>
          <p><span className="text-primary font-bold">3.</span> Add these two variables:</p>
        </div>
        <div className="mt-3 space-y-2">
          <div className="bg-background/60 border border-white/10 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Key</p>
            <p className="font-mono text-xs text-primary">VITE_SUPABASE_URL</p>
          </div>
          <div className="bg-background/60 border border-white/10 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Key</p>
            <p className="font-mono text-xs text-primary">VITE_SUPABASE_ANON_KEY</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 pt-1"><span className="text-primary font-bold">4.</span> Redeploy the project after saving.</p>
      </div>
    </div>
  </div>
);

import { LandingPage } from './pages/LandingPage';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'ocean');

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  if (isMisconfigured) return <SetupError />;
  
  const fetchProfile = async (session) => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (data) {
      setProfile(data);
    } else {
      // Fallback: Use metadata from Auth if profile row doesn't exist yet
      setProfile({
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || 'New User',
        role: session.user.user_metadata?.role || 'user',
        notifications_enabled: true
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchProfile(session);
      } else {
        // Check for local guest session
        const stored = localStorage.getItem('demo-session');
        if (stored) {
          const mock = JSON.parse(stored);
          setSession(mock.session);
          setProfile(mock.profile);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        fetchProfile(session);
      } else if (!localStorage.getItem('demo-session')) {
        setProfile(null);
        setSession(null);
        setLoading(false);
      }
    });

    // Handle Mock/Demo Logins
    const handleDemo = (e) => {
      const { role, email, fullName } = e.detail;
      const mockSession = {
        user: { 
          id: 'demo-id-' + Math.random(), 
          email: email || `${role}@demo.internal`,
          user_metadata: { 
            full_name: fullName || (email ? email.split('@')[0] : `System ${role}`), 
            role 
          } 
        }
      };
      const profileData = {
        id: mockSession.user.id,
        full_name: mockSession.user.user_metadata.full_name,
        role: mockSession.user.user_metadata.role,
        notifications_enabled: true
      };

      setSession(mockSession);
      setProfile(profileData);
      localStorage.setItem('demo-session', JSON.stringify({ session: mockSession, profile: profileData }));
      setLoading(false);
    };

    window.addEventListener('demo-login', handleDemo);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('demo-login', handleDemo);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('demo-session');
      setSession(null);
      setProfile(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Initializing System...</p>
    </div>
  );

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1f2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route 
            path="/dashboard" 
            element={session ? <Layout user={{...session.user, role: profile?.role || 'user', notifications_enabled: profile?.notifications_enabled}} onLogout={handleLogout} theme={theme} setTheme={setTheme}>
              {profile?.role === 'admin' ? <AdminDashboard sessionUser={session.user} userProfile={profile} /> : <UserDashboard sessionUser={session.user} userProfile={profile} />}
            </Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={session ? <Layout user={{...session.user, role: profile?.role || 'user', notifications_enabled: profile?.notifications_enabled}} onLogout={handleLogout} theme={theme} setTheme={setTheme}>
              <ProfilePage sessionUser={session.user} userProfile={profile} />
            </Layout> : <Navigate to="/login" />} 
          />
          <Route path="/track" element={<PublicStatusPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
