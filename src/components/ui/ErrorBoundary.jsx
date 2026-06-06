import React from 'react';
import { ShieldAlert, RefreshCw, Home, LogOut } from 'lucide-react';
// RainbowButton removed
import { supabase } from '../../lib/supabase';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Critical Runtime Boundary Caught Exception:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1c] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] flex items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="glass-card max-w-lg w-full p-8 md:p-12 text-center relative z-10 border border-error/20 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-error/10 border border-error/30 flex items-center justify-center mb-6 shadow-lg shadow-error/20">
              <ShieldAlert className="text-error w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">System Interrupt</h1>
            <p className="text-slate-400 mb-8 leading-relaxed max-w-sm">
              We encountered a critical runtime exception while rendering this sequence. Please initiate a reload to restore nominal functions.
            </p>
            
            <div className="w-full flex flex-col sm:flex-row justify-center gap-4 mb-8">
               <button 
                 onClick={this.handleReload} 
                 className="w-full sm:w-auto px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer"
               >
                 <RefreshCw size={16} />
                 Reboot Interface
               </button>
               <button 
                 onClick={() => window.location.href = '/'}
                 className="w-full sm:w-auto px-12 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white"
               >
                 Return to Landing
               </button>
               <button 
                 onClick={async () => {
                   await supabase.auth.signOut();
                   localStorage.removeItem('demo-session');
                   window.location.href = '/login';
                 }}
                 className="w-full sm:w-auto px-8 py-4 rounded-xl border border-red-500/10 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500"
               >
                 Terminate Session
               </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="w-full mt-6 text-left bg-black/40 p-4 rounded-xl border border-white/5 overflow-x-auto max-h-48 custom-scrollbar">
                <p className="text-error font-mono text-xs mb-2 font-bold">{this.state.error.toString()}</p>
                <pre className="text-slate-500 font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
