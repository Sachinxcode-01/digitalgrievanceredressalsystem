import React from 'react';
import { motion } from 'framer-motion';

/**
 * 21st.dev Inspired Aurora Background Effect
 */
export const AuroraBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 transition-bg overflow-hidden ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`
            [--white-gradient:repeat-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeat-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeat-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-40
          `}
        />
        
        {/* Soft Radial Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

/**
 * Dynamic Mesh Gradient Background
 */
export const MeshGradientBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-slate-950 overflow-hidden ${className}`}>
      {/* Animated Mesh Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/20 blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -60, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-cyan-500/25 to-blue-600/20 blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 30, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-[40%] right-[30%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

/**
 * 21st.dev Interactive Spotlight Canvas Effect
 */
export const SpotlightBackground = ({ children, className = '' }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative min-h-screen bg-slate-950 overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.12), transparent 40%)`,
        }}
      />
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

/**
 * Grid Pattern Overlay
 */
export const GridPatternBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-slate-950 text-slate-100 ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};
