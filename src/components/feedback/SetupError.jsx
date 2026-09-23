import React from 'react';

/**
 * SetupError fallback component.
 * Displays when environment variables (e.g. Supabase credentials) are unconfigured.
 */
export const SetupError = () => (
  <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0f1d]">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="relative glass-card p-10 max-w-lg w-full z-10 text-center space-y-6 border border-rose-500/20 shadow-2xl rounded-2xl">
      <div className="w-16 h-16 bg-linear-to-tr from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/20">
        <span className="text-white text-3xl font-bold">!</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Configuration Required</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          The application is missing required Supabase credentials or backend configurations in your environment settings.
        </p>
      </div>
      <div className="pt-2">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors border border-slate-700"
        >
          Retry Connection
        </button>
      </div>
    </div>
  </div>
);

export default SetupError;
