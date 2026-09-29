import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Keyboard, 
  Volume2, 
  Sparkles, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Monitor, 
  FileText, 
  ExternalLink,
  Mail,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';

export const AccessibilityStatementPage = () => {
  const keyboardShortcuts = [
    { key: 'Cmd / Ctrl + K', action: 'Open Global Command Palette & Quick Search' },
    { key: 'Tab / Shift + Tab', action: 'Navigate forward/backward across interactive elements' },
    { key: 'Enter / Space', action: 'Activate buttons, expandable dossiers, and modals' },
    { key: 'Escape', action: 'Close open dialogs, menus, and side navigation drawers' },
    { key: 'Alt + 1', action: 'Jump directly to primary content landmark' },
    { key: 'Alt + 2', action: 'Open Accessibility Dock controls' }
  ];

  const features = [
    {
      title: 'WCAG 2.1 Level AA Compliance',
      description: 'Engineered in compliance with Web Content Accessibility Guidelines (WCAG 2.1 AA) ensuring sufficient color contrast, scalable typography, and semantic HTML5 structuring.',
      icon: ShieldCheck,
      color: 'text-emerald-400'
    },
    {
      title: 'Persistent Accessibility Dock',
      description: 'The floating dock located at the bottom-right corner allows on-the-fly toggling of high contrast mode, text scaling up to 150%, and dyslexic-friendly typeface overrides.',
      icon: Sliders,
      color: 'text-cyan-400'
    },
    {
      title: 'Screen Reader & ARIA Landmarks',
      description: 'Exhaustively tested with modern screen readers including NVDA, JAWS, and Apple VoiceOver, with dedicated ARIA-live regions for dynamic status changes.',
      icon: Volume2,
      color: 'text-indigo-400'
    },
    {
      title: 'Voice-Enabled AI Ombudsman',
      description: 'Users experiencing motor or visual impairments can interact directly with the AI Ombudsman widget using multi-lingual voice speech recognition and audio readout.',
      icon: Sparkles,
      color: 'text-amber-400'
    }
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-10 pt-4 pb-20">
          
          {/* Top Bar Floating Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
              >
                <Mail size={14} />
                <span>Contact Accessibility Officer</span>
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>File Grievance</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Eye size={13} />
              <span>Universal Inclusivity & Equal Access</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white uppercase">
              Accessibility Statement. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
                Empowering Every Citizen.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              ResolveNow is dedicated to ensuring digital grievance filing and institutional justice are universally barrier-free for all students, staff, and citizens with diverse abilities.
            </p>
          </div>

          {/* Core Accessibility Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <MotionCard key={idx} className="p-6 border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={20} className={feature.color} />
                  </div>
                  <h2 className="text-base font-heading font-bold text-white uppercase tracking-wide">
                    {feature.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </MotionCard>
              );
            })}
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Keyboard size={18} className="text-cyan-400" />
                <span>Keyboard Navigation Cheatsheet</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">Rapid Navigation</span>
            </div>

            <MotionCard className="p-6 border border-white/10 bg-slate-900/60 backdrop-blur-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {keyboardShortcuts.map((sc, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-300 font-sans">{sc.action}</span>
                    <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-white/20 text-cyan-300 text-[11px] font-mono font-bold whitespace-nowrap shadow-inner">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </MotionCard>
          </div>

          {/* Accessibility Standards Compliance Declaration */}
          <MotionCard className="p-6 sm:p-8 border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-white uppercase tracking-wider">
                  Technical Specifications & Compliance Audit
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Audited under GIGW (Guidelines for Indian Government Websites) & Section 508
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              The portal relies upon modern standard technologies: W3C Validated HTML5, Cascading Style Sheets (CSS3), and JavaScript with ARIA 1.2 landmark structuring. Compatibility extends across Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, NVDA 2024+, and Android/iOS native screen magnification engines.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-300">
                Experiencing difficulty accessing any section or document on this portal?
              </span>
              <a
                href="mailto:accessibility@resolvenow.gov.in"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
              >
                <span>Email Equal Opportunity Cell</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </MotionCard>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default AccessibilityStatementPage;
