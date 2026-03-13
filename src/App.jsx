import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
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

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Show setup error immediately if env vars are missing
  if (isMisconfigured) return <SetupError />;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
          <Route 
            path="/login" 
            element={!session ? <LoginPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={session ? <Layout user={{...session.user, role: profile?.role || 'user'}} onLogout={handleLogout}>
              {profile?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
            </Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={session ? <Layout user={{...session.user, role: profile?.role || 'user'}} onLogout={handleLogout}>
              <ProfilePage />
            </Layout> : <Navigate to="/login" />} 
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
