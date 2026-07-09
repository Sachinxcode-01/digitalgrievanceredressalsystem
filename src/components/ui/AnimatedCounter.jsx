import React, { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { EASE_OUT } from '../../lib/motion';

/**
 * Counts up from 0 to `value` when scrolled into view. Great for dashboard stats.
 * Falls back gracefully to the final value if animation is unavailable.
 */
export const AnimatedCounter = ({
  value = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const format = (n) => `${prefix}${Number(n).toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    const target = Number(value) || 0;
    if (!node) return;
    if (!inView) return;

    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT,
      onUpdate(latest) {
        node.textContent = format(latest);
      }
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
};

export default AnimatedCounter;
