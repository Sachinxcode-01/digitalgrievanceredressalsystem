import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, Languages, Type, Sliders, ChevronDown, Check } from 'lucide-react';
import { getLanguage, setLanguage, useTranslation } from '../../utils/i18n';

export const AccessibilityDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('dg_theme') || 'midnight';
    } catch {
      return 'midnight';
    }
  });
  const [fontScale, setFontScale] = useState(() => {
    try {
      return localStorage.getItem('dg_font_scale') || 'normal';
    } catch {
      return 'normal';
    }
  });
  const [lang, setLang] = useState(getLanguage());
  const { t } = useTranslation();

  useEffect(() => {
    document.documentElement.classList.remove('theme-midnight', 'theme-high-contrast');
    if (theme === 'midnight') {
      document.documentElement.classList.add('theme-midnight');
    } else if (theme === 'high-contrast') {
      document.documentElement.classList.add('theme-high-contrast');
    }
    try {
      localStorage.setItem('dg_theme', theme);
    } catch (e) {
      console.debug('theme store', e);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.removeAttribute('data-font-scale');
    if (fontScale !== 'normal') {
      document.documentElement.setAttribute('data-font-scale', fontScale);
    }
    try {
      localStorage.setItem('dg_font_scale', fontScale);
    } catch (e) {
      console.debug('font scale store', e);
    }
  }, [fontScale]);

  const applyTheme = (th) => {
    setTheme(th);
  };

  const applyFontScale = (scale) => {
    setFontScale(scale);
  };

  const handleLangChange = (newLang) => {
    setLanguage(newLang);
    setLang(newLang);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="hud-pill p-4 rounded-3xl mb-3 w-72 space-y-4 text-left shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sliders size={13} />
                </div>
                <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-white">Display & Access HUD</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* 1. Theme Palette Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Theme Palette</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTheme('midnight')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    theme === 'midnight'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Moon size={13} />
                  <span>Midnight</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('light')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Sun size={13} />
                  <span>Crystal</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('high-contrast')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    theme === 'high-contrast'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Eye size={13} />
                  <span>AAA Cyber</span>
                </button>
              </div>
            </div>

            {/* 2. Language Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Language / भाषा</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLangChange('en')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Languages size={13} />
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('hi')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    lang === 'hi'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-black'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                </button>
              </div>
            </div>

            {/* 3. Typography Size Scaling */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">Font Scaling</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyFontScale('normal')}
                  className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    fontScale === 'normal'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => applyFontScale('large')}
                  className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    fontScale === 'large'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  110%
                </button>
                <button
                  type="button"
                  onClick={() => applyFontScale('accessibility')}
                  className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    fontScale === 'accessibility'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  125%
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button Pill */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="hud-pill px-3.5 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg hover:border-indigo-500/50 transition-colors"
        title="Accessibility & Theme Controls"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <Sliders size={14} className="text-indigo-400" />
        <span className="font-mono text-[11px] tracking-wider uppercase">HUD</span>
      </motion.button>
    </div>
  );
};

export default AccessibilityDock;
