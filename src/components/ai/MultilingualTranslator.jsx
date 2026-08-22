import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RefreshCw, Check, Copy, ArrowRightLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

export const MultilingualTranslator = ({ 
  text, 
  title = '',
  onApplyTranslation = null, 
  defaultTargetLanguage = 'English',
  className = '' 
}) => {
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultTargetLanguage);
  const [copied, setCopied] = useState(false);

  const LANGUAGES = [
    { code: 'English', label: 'English' },
    { code: 'Hindi', label: 'Hindi (हिंदी)' },
    { code: 'Tamil', label: 'Tamil (தமிழ்)' },
    { code: 'Telugu', label: 'Telugu (తెలుగు)' },
    { code: 'Bengali', label: 'Bengali (বাংলা)' },
    { code: 'Marathi', label: 'Marathi (मराठी)' },
    { code: 'Spanish', label: 'Spanish (Español)' },
    { code: 'French', label: 'French (Français)' },
    { code: 'German', label: 'German (Deutsch)' }
  ];

  const handleTranslate = async (overrideTarget = targetLang) => {
    if (!text || text.trim() === '') {
      toast.error('No text provided for translation.');
      return;
    }

    setIsTranslating(true);
    try {
      const fullContent = title ? `Title: ${title}\n\nDescription: ${text}` : text;
      const res = await grievanceService.translate(fullContent, overrideTarget);
      if (res && res.translated_text) {
        setTranslatedText(res.translated_text);
        setSourceLanguage(res.source_language || 'Auto-Detected');
        setShowTranslation(true);
        toast.success(`Translated to ${overrideTarget}!`);
      }
    } catch (err) {
      toast.error('Translation engine temporary fallback: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success('Translation copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-indigo-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Multilingual AI Engine
          </span>
          {sourceLanguage && showTranslation && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Source: {sourceLanguage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={targetLang}
            onChange={(e) => {
              const newLang = e.target.value;
              setTargetLang(newLang);
              if (showTranslation) {
                handleTranslate(newLang);
              }
            }}
            className="bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-mono font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-indigo-500/40"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (!showTranslation) {
                handleTranslate();
              } else {
                setShowTranslation(false);
              }
            }}
            disabled={isTranslating}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              showTranslation
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-white/10 hover:border-indigo-500/40'
            }`}
          >
            {isTranslating ? (
              <RefreshCw size={11} className="animate-spin text-indigo-400" />
            ) : (
              <ArrowRightLeft size={11} />
            )}
            <span>{showTranslation ? 'View Original' : `Translate to ${targetLang}`}</span>
          </button>
        </div>
      </div>

      {/* Translation Result Card */}
      <AnimatePresence>
        {showTranslation && translatedText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 relative shadow-lg">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-amber-400" />
                  <span className="text-[11px] font-heading font-extrabold text-indigo-200 uppercase tracking-wide">
                    AI Translation ({targetLang})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                    title="Copy translation"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>

                  {onApplyTranslation && (
                    <button
                      type="button"
                      onClick={() => onApplyTranslation(translatedText)}
                      className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all"
                    >
                      Apply to Form
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {translatedText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultilingualTranslator;
