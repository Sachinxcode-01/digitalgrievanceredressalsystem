import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * 21st.dev Elegant Floating Shape
 * Floating rounded capsule geometry with backdrop blur, glass border,
 * inner radial sheen, and organic drift physics.
 */
export const ElegantFloatingShape = ({
  className = '',
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-indigo-500/[0.15]',
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -80,
        rotate: rotate - 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.2,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <motion.div
        animate={{
          y: [0, 16, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 12 + delay * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={`
            absolute inset-0 rounded-full
            bg-gradient-to-r to-transparent ${gradient}
            backdrop-blur-[2px] border border-white/[0.12]
            shadow-[0_8px_32px_0_rgba(99,102,241,0.12)]
            after:absolute after:inset-0 after:rounded-full
            after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]
          `}
        />
      </motion.div>
    </motion.div>
  );
};

/**
 * 21st.dev Interactive Cursor Spotlight
 * Smoothly follows pointer movement without blocking any interactions.
 */
export const InteractiveSpotlight = ({
  size = 750,
  color = 'rgba(99, 102, 241, 0.12)',
}) => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 28, stiffness: 220 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{
        background: `radial-gradient(${size}px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), ${color}, transparent 65%)`,
      }}
      ref={(node) => {
        if (!node) return;
        const unsubX = smoothX.on('change', (latest) => {
          node.style.setProperty('--mouse-x', `${latest}px`);
        });
        const unsubY = smoothY.on('change', (latest) => {
          node.style.setProperty('--mouse-y', `${latest}px`);
        });
        return () => {
          unsubX();
          unsubY();
        };
      }}
    />
  );
};

/**
 * 21st.dev Clean Modern Cyber Grid & Dot Matrix
 */
export const ModernTechGrid = ({
  className = '',
  pattern = 'grid', // 'grid' | 'dots' | 'hybrid'
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {/* Precision 32px Grid Lines */}
      {(pattern === 'grid' || pattern === 'hybrid') && (
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_25%,#000_60%,transparent_100%)]"
        />
      )}

      {/* Modern Subtle Dot Grid */}
      {(pattern === 'dots' || pattern === 'hybrid') && (
        <div
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_50%,transparent_100%)] opacity-80"
        />
      )}

      {/* Top Atmospheric Horizon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
    </div>
  );
};

/**
 * Modern 21st.dev Aurora & Floating Geometric Background
 * Default high-end backdrop used across the system.
 */
export const AuroraBackground = ({
  children,
  className = '',
  showShapes = true,
  showGrid = true,
  showSpotlight = true,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-start min-h-screen bg-[#030712] text-slate-100 transition-colors duration-500 overflow-x-hidden ${className}`}
    >
      {/* 21st.dev Background Scene Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep ambient gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#030712] to-indigo-950/40" />

        {/* Dynamic Subtle Tech Grid */}
        {showGrid && <ModernTechGrid pattern="hybrid" />}

        {/* 21st.dev Signature Floating Geometric Shapes */}
        {showShapes && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Top-Left Indigo Prism */}
            <ElegantFloatingShape
              delay={0.2}
              width={540}
              height={130}
              rotate={14}
              gradient="from-indigo-500/[0.14] via-blue-500/[0.08]"
              className="left-[-12%] md:left-[-5%] top-[8%] md:top-[12%]"
            />

            {/* Top-Right Violet Capsule */}
            <ElegantFloatingShape
              delay={0.4}
              width={460}
              height={110}
              rotate={-18}
              gradient="from-violet-500/[0.14] via-purple-500/[0.07]"
              className="right-[-8%] md:right-[2%] top-[14%] md:top-[18%]"
            />

            {/* Mid-Left Cyan Beam Capsule */}
            <ElegantFloatingShape
              delay={0.6}
              width={340}
              height={85}
              rotate={-8}
              gradient="from-cyan-500/[0.13] via-teal-500/[0.06]"
              className="left-[4%] md:left-[8%] top-[45%] md:top-[50%]"
            />

            {/* Mid-Right Rose Accent Capsule */}
            <ElegantFloatingShape
              delay={0.5}
              width={280}
              height={75}
              rotate={22}
              gradient="from-rose-500/[0.12] via-pink-500/[0.06]"
              className="right-[3%] md:right-[10%] top-[55%] md:top-[58%]"
            />

            {/* Lower Emerald Security Capsule */}
            <ElegantFloatingShape
              delay={0.8}
              width={380}
              height={90}
              rotate={-12}
              gradient="from-emerald-500/[0.10] via-cyan-500/[0.05]"
              className="left-[12%] md:left-[18%] bottom-[8%] md:bottom-[12%]"
            />
          </div>
        )}

        {/* Soft Multi-Stop Radial Orbs (GPU accelerated) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-indigo-600/15 to-purple-600/10 rounded-full blur-[160px] animate-pulse pointer-events-none" />
        <div className="absolute top-2/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/12 to-blue-600/10 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/10 to-indigo-600/8 rounded-full blur-[150px] pointer-events-none" />

        {/* Interactive Smooth Cursor Spotlight */}
        {showSpotlight && <InteractiveSpotlight size={700} color="rgba(99, 102, 241, 0.10)" />}

        {/* Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712]/90 pointer-events-none" />
      </div>

      {/* Main Content Container with Above-Backdrop Elevation */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">{children}</div>
    </div>
  );
};

/**
 * Dynamic Mesh Gradient Background
 */
export const MeshGradientBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-[#030712] overflow-hidden ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-600/25 to-purple-600/20 blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -60, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-cyan-500/20 to-blue-600/20 blur-[140px] pointer-events-none"
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
      <ModernTechGrid pattern="grid" />
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

/**
 * 21st.dev Interactive Spotlight Canvas Effect
 */
export const SpotlightBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-[#030712] text-slate-100 overflow-hidden ${className}`}>
      <ModernTechGrid pattern="hybrid" />
      <InteractiveSpotlight size={800} color="rgba(99, 102, 241, 0.14)" />
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

/**
 * Grid Pattern Overlay
 */
export const GridPatternBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-[#030712] text-slate-100 ${className}`}>
      <ModernTechGrid pattern="grid" />
      <div className="relative z-10 w-full min-h-screen">{children}</div>
    </div>
  );
};

export default AuroraBackground;
