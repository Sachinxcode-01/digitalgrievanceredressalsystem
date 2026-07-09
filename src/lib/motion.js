/**
 * Shared Framer Motion animation system for ResolveNow.
 *
 * Import these variants/transitions instead of re-declaring inline animations, so
 * motion feels consistent across every page (auth, dashboards, grievance flow, admin).
 *
 * Usage:
 *   import { fadeInUp, staggerContainer, staggerItem, EASE } from '@/lib/motion';
 *   <motion.div variants={staggerContainer} initial="hidden" animate="show"> ... </motion.div>
 */

// Premium easing curve (matches the CSS cubic-bezier used in index.css)
export const EASE = [0.22, 1, 0.36, 1];
export const EASE_OUT = [0.16, 1, 0.3, 1];

// ── Basic entrances ────────────────────────────────────────────────
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE } }
};

// ── Staggered lists / grids ────────────────────────────────────────
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

// Alias for list rows / timeline steps
export const listItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } }
};

// ── Page transitions ───────────────────────────────────────────────
export const pageTransition = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } }
};

// ── Modal / dialog ─────────────────────────────────────────────────
export const modalOverlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18 } }
};

// ── Reusable interaction props (spread onto motion elements) ────────
export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.25, ease: EASE } },
  whileTap: { scale: 0.995 }
};

export const buttonTap = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 }
};

// Micro-interaction for icons (nudge on hover of parent group)
export const iconPop = {
  whileHover: { scale: 1.12, rotate: 3 },
  whileTap: { scale: 0.9 }
};
