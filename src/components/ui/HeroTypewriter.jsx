import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const HeroTypewriter = ({
  phrases = ["Submit. Track. Resolve. Transparently."],
  className = ""
}) => {
  const textRef = useRef(null);
  const cursorRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targetText = phrases[0] || "Submit. Track. Resolve. Transparently.";

    if (prefersReducedMotion) {
      // Show full text immediately — no animation
      if (textRef.current) textRef.current.textContent = targetText;
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
      return;
    }

    // Start empty — prevents flash of hardcoded text
    if (textRef.current) textRef.current.textContent = '';

    // Blinking cursor
    tlRef.current = gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.55,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });

    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        if (textRef.current) {
          textRef.current.textContent = targetText.slice(0, currentIndex);
        }
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Slow cursor blink after done typing
        if (tlRef.current) {
          tlRef.current.timeScale(0.5);
        }
      }
    }, 55);

    return () => {
      clearInterval(typeInterval);
      if (tlRef.current) tlRef.current.kill();
    };
  }, [phrases]);

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <span
        ref={textRef}
        aria-live="polite"
        className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent font-black tracking-tight"
      />
      <span
        ref={cursorRef}
        aria-hidden="true"
        className="inline-block w-[3px] md:w-[4px] h-[1em] bg-cyan-400 ml-1 rounded-full shadow-[0_0_10px_#22d3ee] align-middle"
      />
    </span>
  );
};

export default HeroTypewriter;
