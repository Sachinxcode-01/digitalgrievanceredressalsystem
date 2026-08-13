import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const HeroTypewriter = ({ 
  phrases = ["Submit. Track. Resolve. Transparently."],
  className = "" 
}) => {
  const textRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Blinking Cursor Animation
    gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });

    const targetText = phrases[0] || "Submit. Track. Resolve. Transparently.";
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        if (textRef.current) {
          textRef.current.textContent = targetText.slice(0, currentIndex);
        }
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 60);

    return () => clearInterval(typeInterval);
  }, [phrases]);

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <span 
        ref={textRef} 
        className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent font-black tracking-tight"
      >
        Submit. Track. Resolve. Transparently.
      </span>
      <span 
        ref={cursorRef} 
        className="inline-block w-1 md:w-1.5 h-7 md:h-12 bg-cyan-400 ml-1 rounded-full shadow-[0_0_10px_#22d3ee]" 
      />
    </span>
  );
};

export default HeroTypewriter;
