import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export const MotionCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.15)', // Indigo glow
  tilt = true,
  onClick,
  hoverElevate = true,
  ...props
}) => {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });

    if (tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rX = ((y - centerY) / centerY) * -6; // max 6 deg tilt
      const rY = ((x - centerX) / centerX) * 6;
      setRotateX(rX);
      setRotateY(rY);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        y: hoverElevate && isHovered ? -4 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-slate-900/60 backdrop-blur-xl 
        border border-white/10 
        shadow-xl shadow-black/20
        transition-colors duration-300
        hover:border-indigo-500/30
        group cursor-pointer ${className}
      `}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Top Border Glow Effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card Content Layer */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default MotionCard;
