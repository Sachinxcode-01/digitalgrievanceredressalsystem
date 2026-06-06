import React from 'react';
import { motion } from 'framer-motion';
import { Activity, MapPin, Zap } from 'lucide-react';

export const NeuralHeatmap = ({ tickets }) => {
  // Simulate institutional zones
  const zones = [
    { name: 'Sector A (Academic)', x: '20%', y: '30%', intensity: 0.8, pulse: true },
    { name: 'Sector B (Finance)', x: '70%', y: '20%', intensity: 0.4, pulse: false },
    { name: 'Sector C (Hostel)', x: '40%', y: '70%', intensity: 0.9, pulse: true },
    { name: 'Sector D (Infrastructure)', x: '80%', y: '65%', intensity: 0.2, pulse: false },
  ];

  return (
    <div className="relative w-full aspect-video bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden group">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      {/* Background Neural Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <defs>
          <linearGradient id="neural-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,50 Q250,0 500,50 T1000,50" stroke="url(#neural-grad)" strokeWidth="0.5" fill="none" />
        <path d="M0,150 Q250,200 500,150 T1000,150" stroke="url(#neural-grad)" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Heatmap Nodes */}
      {zones.map((zone, i) => (
        <div 
          key={i} 
          className="absolute" 
          style={{ left: zone.x, top: zone.y }}
        >
          <div className="relative group/node">
            {/* Intensity Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                delay: i * 0.5 
              }}
              className={`absolute -inset-16 rounded-full blur-3xl ${zone.intensity > 0.7 ? 'bg-error/30' : 'bg-primary/20'}`}
            />

            {/* Core Node */}
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className={`relative z-10 w-4 h-4 rounded-full border-2 ${zone.intensity > 0.7 ? 'bg-error border-white/50' : 'bg-primary border-white/30'} cursor-help`}
            >
              {zone.pulse && (
                <div className="absolute inset-0 rounded-full bg-inherit animate-ping" />
              )}
            </motion.div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/node:opacity-100 transition-all translate-y-2 group-hover/node:translate-y-0 pointer-events-none">
              <div className="glass-card p-4 min-w-[200px] border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={12} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{zone.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Load Intensity</span>
                  <span className={`text-[10px] font-black ${zone.intensity > 0.7 ? 'text-error' : 'text-emerald-400'}`}>
                    {(zone.intensity * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${zone.intensity > 0.7 ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${zone.intensity * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Control Overlay */}
      <div className="absolute top-8 left-8 flex flex-col gap-4">
        <div className="glass-card !bg-black/40 !backdrop-blur-md px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Intensity Map</h3>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Global Institutional Pulse</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8">
        <div className="glass-card !bg-black/40 !backdrop-blur-md px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Critical Friction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Normal Ops</span>
          </div>
        </div>
      </div>

      {/* Aesthetic Border Scan */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-20 pointer-events-none"
      />
    </div>
  );
};
