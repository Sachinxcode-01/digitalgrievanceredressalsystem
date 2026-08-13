import React from 'react';
import { motion } from 'framer-motion';

// Detect reduced-motion preference once at module level
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const AnimatedSection = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  id,
  ...props
}) => {
  const directionVariants = {
    up:    { hidden: { opacity: 0, y: 35 },  visible: { opacity: 1, y: 0 } },
    down:  { hidden: { opacity: 0, y: -35 }, visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: -35 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 35 },  visible: { opacity: 1, x: 0 } },
  };

  // If user prefers no motion, skip animations entirely
  if (prefersReducedMotion) {
    return (
      <section id={id} className={className} {...props}>
        {children}
      </section>
    );
  }

  const selectedVariant = directionVariants[direction] || directionVariants.up;

  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.32, 0.72, 0, 1],
      }}
      variants={selectedVariant}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default AnimatedSection;
