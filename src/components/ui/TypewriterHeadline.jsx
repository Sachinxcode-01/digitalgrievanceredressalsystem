import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const TypewriterHeadline = ({
  words = ['Digital Grievance System', 'Smart Resolution Platform', 'Transparent SLA Tracking', 'AI-Powered Support'],
  typingSpeed = 80,
  deletingSpeed = 40,
  delayBetweenWords = 2000,
  className = '',
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetWord = words[currentWordIndex];

    let timer;
    if (!isDeleting && currentText !== targetWord) {
      timer = setTimeout(() => {
        setCurrentText(targetWord.substring(0, currentText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && currentText === targetWord) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetweenWords);
    } else if (isDeleting && currentText !== '') {
      timer = setTimeout(() => {
        setCurrentText(targetWord.substring(0, currentText.length - 1));
      }, deletingSpeed);
    } else if (isDeleting && currentText === '') {
      // Schedule via setTimeout so the state transition happens outside the effect
      // body, avoiding the cascading-render pattern flagged by react-hooks/set-state-in-effect.
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, 0);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-sm font-black">
        {currentText}
      </span>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-block w-1.5 h-8 md:h-10 lg:h-12 bg-cyan-400 ml-1.5 rounded-sm shadow-glow"
      />
    </span>
  );
};

export default TypewriterHeadline;
