import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedSection = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  id,
  ...props
}) => {
  const directionVariants = {
    up: { hidden: { opacity: 0, y: 35 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -35 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -35 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 35 }, visible: { opacity: 1, x: 0 } },
  };

  const selectedVariant = directionVariants[direction] || directionVariants.up;

  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay: delay,
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
