import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, Ticket, Landmark, Award, CheckCircle2, 
  MessageSquare, Mail, MapPin, Sparkles, Cpu, Layers, Lock, KeyRound, Bot, 
  Clock, Search, LayoutDashboard, BarChart3, UploadCloud, Bell, FileSpreadsheet, 
  History, Users, Building2, School, Home, Building, HelpCircle, AlertCircle,
  TrendingUp, Database, Code2, Server, Terminal, Check, Mic, Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import toast from 'react-hot-toast';

import AnimatedNavbar from '../../components/ui/AnimatedNavbar';
import CounterCard from '../../components/ui/CounterCard';
import GlassPanel from '../../components/ui/GlassPanel';
import { AuroraBackground, ElegantFloatingShape } from '../../components/ui/BackgroundEffects';
import ProcessFlowDiagram from '../../components/ui/ProcessFlowDiagram';
import DashboardPreviewMock from '../../components/ui/DashboardPreviewMock';
import { AiSandboxDemo } from '../../components/ui/AiSandboxDemo';

// Newly created components
import HeroTypewriter from '../../components/ui/HeroTypewriter';
import AnimatedSection from '../../components/ui/AnimatedSection';
import FeatureCard from '../../components/ui/FeatureCard';
import ResponsiveTextBlock from '../../components/ui/ResponsiveTextBlock';
import MotionButton from '../../components/ui/MotionButton';
import FAQAccordion from '../../components/ui/FAQAccordion';
import LandingGrid from '../../components/ui/LandingGrid';

export const LandingPage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const userRole = user?.role || 'student';
  const dashboardLink = (userRole === 'admin' || userRole === 'super admin') ? '/admin/dashboard' : '/dashboard';

  // 16 Core Features
  const coreFeatures = [
    { icon: Lock, title: 'Secure Login & OTP', desc: 'Encrypted multi-factor authentication with 6-digit one-time passcode verification.', badge: 'Security' },
    { icon: KeyRound, title: 'Google/Microsoft Auth', desc: 'Seamless single sign-on integration for institutional single-identity login.', badge: 'Auth' },
    { icon: Mic, title: 'AI Voice-to-Text Studio', desc: 'Real-time live speech dictation and audio upload transcription in 10+ regional languages.', badge: 'Voice AI' },
    { icon: Globe, title: 'Multilingual Auto-Translation', desc: 'Instant AI translation between English, Hindi, Tamil, Telugu, Marathi, and regional languages.', badge: 'Translation' },
    { icon: Cpu, title: 'AI Grievance Triage', desc: 'Gemini-powered semantic classification, sentiment analysis, and urgency scoring.', badge: 'AI Engine' },
    { icon: Bot, title: 'ResolveBot Assistant', desc: 'Streaming AI chatbot for instant resolution recommendations and guidance.', badge: 'Assistant' },
    { icon: Layers, title: 'Smart Auto-Routing', desc: 'Dynamic dispatch to correct administrative terminals and department heads.', badge: 'Routing' },
    { icon: Clock, title: 'SLA Tracking', desc: 'Strict 24h-48h resolution timers with automated escalation alerts.', badge: 'SLA Timer' },
    { icon: Search, title: 'Public Ticket Tracking', desc: 'Instant progress verification using cryptographic reference ticket keys.', badge: 'Public Portal' },
    { icon: LayoutDashboard, title: 'Student Dashboard', desc: 'Unified citizen portal to submit tickets, track progress, and give feedback.', badge: 'Portal' },
    { icon: BarChart3, title: 'Admin Analytics', desc: 'Real-time department workload charts, compliance stats, and KPI reporting.', badge: 'Analytics' },
    { icon: UploadCloud, title: 'File Uploads', desc: 'Secure evidence attachments up to 5MB (PDFs, images, documents).', badge: 'Storage' },
    { icon: Bell, title: 'Email Notifications', desc: 'Automated SMTP email dispatch for filing, status updates, and resolutions.', badge: 'Alerts' },
    { icon: FileSpreadsheet, title: 'Reports & Feedback', desc: 'One-click CSV/Excel/PDF export dossier generation and 5-star rating surveys.', badge: 'Exports' },
    { icon: History, title: 'Audit Logs', desc: 'Immutable security log history tracking all status modifications and access.', badge: 'Compliance' },
    { icon: Users, title: 'Role-Based Access', desc: 'Granular clearances for Students, Officers, Admins, and Super Administrators.', badge: 'Clearance' },
  ];

  // 10 Use Cases
  const useCases = [
    { icon: School, title: 'Colleges & Universities', desc: 'Centralized redressal for campus-wide academic & facility grievances.' },
    { icon: Home, title: 'Hostels & Residences', desc: 'Maintenance, dining hall, and security issue resolution.' },
    { icon: Building2, title: 'Departments', desc: 'Streamlined departmental ticket routing and internal officer assignment.' },
    { icon: Building, title: 'Offices & Corporate', desc: 'Employee HR, IT helpdesk, and workplace infrastructure support.' },
    { icon: Landmark, title: 'Public Institutions', desc: 'Citizen grievance redressal for civic bodies and public services.' },
    { icon: HelpCircle, title: 'Student Support Systems', desc: 'Dedicated helpline and guidance for counseling and admissions.' },
    { icon: Cpu, title: 'IT & Helpdesk Complaints', desc: 'Wi-Fi disconnections, lab equipment, and portal account access.' },
    { icon: AlertCircle, title: 'Maintenance Complaints', desc: 'Plumbing, electrical, elevator, and HVAC repairs.' },
    { icon: Award, title: 'Academic Complaints', desc: 'Exam schedules, grading queries, and course registration issues.' },
    { icon: Ticket, title: 'Fee & Finance Complaints', desc: 'Tuition receipt verification, scholarship status, and refund tracking.' },
  ];

  // 8 Benefits
  const benefits = [
    { title: 'Faster Complaint Resolution', desc: 'AI triage and auto-routing reduce resolution timelines by over 70%.' },
    { title: 'Transparent Live Tracking', desc: 'Cryptographic ticket keys allow real-time status visibility without guesswork.' },
    { title: 'Reduced Manual Work', desc: 'Eliminates manual paper logs, spreadsheet tracking, and misrouted emails.' },
    { title: 'Higher Accountability', desc: 'SLA countdown timers enforce strict officer deadlines and auto-escalation.' },
    { title: 'Department Insights', desc: 'Comprehensive analytics expose bottleneck sectors and resource needs.' },
    { title: 'Secure Data Handling', desc: 'Row-level security policies (RLS) and AES-256 payload encryption.' },
    { title: 'Automated Notifications', desc: 'Instant email alerts dispatched on submission, reassignment, and sign-off.' },
    { title: 'Improved Satisfaction', desc: 'Direct feedback surveys ensure continuous institutional governance quality.' },
  ];

  // 12 FAQs
  const faqs = [
    { q: "What is ResolveNow?", a: "ResolveNow is an AI-powered enterprise digital grievance redressal system designed for colleges, universities, offices, and institutions. It automates complaint submission, Gemini AI classification, SLA tracking, departmental auto-routing, and verified resolution." },
    { q: "Who can use this system?", a: "Students, employees, citizens, department officers, administrators, and executive leadership. Each user role has a tailored interface with role-based access control (RBAC)." },
    { q: "How does AI triage work?", a: "When a grievance is submitted, Gemini AI analyzes the narrative statement to detect subject categories, urgency priority, sentiment frustration index, and optional language translation in real time." },
    { q: "Can users track complaints publicly?", a: "Yes! Every grievance receives a unique reference key (e.g. #TKT-2026-8812). Users can enter this key on the Public Tracking page to verify real-time milestone progress." },
    { q: "How are grievances assigned to departments?", a: "The system uses category matching and AI confidence scores to auto-route grievances directly to the assigned department head or officer terminal immediately upon submission." },
    { q: "What is SLA tracking?", a: "SLA (Service Level Agreement) tracking calculates a 24h-48h resolution deadline for every ticket. If an officer fails to act within the due date, the system triggers automatic escalation alerts." },
    { q: "Is the system secure?", a: "Yes. ResolveNow incorporates ISO-27001 zero-trust guidelines, Supabase Row-Level Security (RLS) policies, multi-factor OTP verification, and immutable audit logs." },
    { q: "Can students upload supporting files?", a: "Yes, students can attach evidence documents, photos, or screenshots up to 5MB (PDF, PNG, JPG, WEBP, Word, TXT)." },
    { q: "Can admins generate export reports?", a: "Administrators can generate PDF executive dossiers, CSV data exports, and Excel spreadsheets with 1-click reporting buttons." },
    { q: "What happens after a grievance is resolved?", a: "The user receives an email notification with resolution notes, and is prompted to submit a 5-star rating and feedback survey to audit service quality." },
    { q: "Does it support email notifications?", a: "Yes, ResolveNow integrates automated SMTP email templates for submission receipts, status updates, officer reassignments, and ticket sign-offs." },
    { q: "Can it be deployed for colleges or offices?", a: "Yes! ResolveNow is fully customizable for universities, corporate offices, public sector bodies, hostels, and government agencies." }
  ];

  // Tech Stack Badges
  const techStack = [
    { name: 'React 18', icon: Code2, desc: 'Frontend UI' },
    { name: 'Vite', icon: Zap, desc: 'Build Engine' },
    { name: 'TailwindCSS', icon: Layers, desc: 'Styling System' },
    { name: 'Framer Motion', icon: Sparkles, desc: 'Animations' },
    { name: 'GSAP', icon: TrendingUp, desc: 'Physics' },
    { name: 'Node.js', icon: Server, desc: 'Backend Core' },
    { name: 'Express', icon: Terminal, desc: 'REST API' },
    { name: 'Supabase', icon: Database, desc: 'Database & RLS' },
    { name: 'Clerk', icon: ShieldCheck, desc: 'Authentication' },
    { name: 'Gemini AI', icon: Cpu, desc: 'AI Triage Engine' },
    { name: 'SMTP', icon: Mail, desc: 'Email Dispatch' },
  ];

  return (
    <AuroraBackground>
      <AnimatedNavbar user={user} onLogout={logout} />

      <div className="w-full flex flex-col items-center pt-32 pb-24 px-4 sm:px-6 space-y-32"
           style={{ willChange: 'auto' }}>
        
        {/* ========================================================================= */}
        {/* SECTION 1: HERO SECTION */}
        {/* ========================================================================= */}
        <AnimatedSection className="text-center max-w-5xl mx-auto space-y-8">
          {/* ── 21st.dev Hero-Scoped Floating Geometric Shapes ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            {/* Soft indigo radial orb centered behind the title text */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-225 h-125 bg-linear-to-b from-indigo-600/18 via-violet-600/8 to-transparent rounded-full blur-[120px]" />

            {/* Hero capsule shapes — scaled slightly smaller than global BG shapes */}
            <ElegantFloatingShape
              delay={0.15}
              width={480}
              height={100}
              rotate={10}
              gradient="from-indigo-400/[0.16] via-blue-400/[0.08]"
              className="left-[-18%] top-[10%]"
            />
            <ElegantFloatingShape
              delay={0.3}
              width={420}
              height={90}
              rotate={-14}
              gradient="from-violet-400/[0.15] via-purple-400/[0.07]"
              className="right-[-15%] top-[30%]"
            />
            <ElegantFloatingShape
              delay={0.5}
              width={260}
              height={65}
              rotate={20}
              gradient="from-cyan-400/[0.13] via-teal-400/[0.06]"
              className="right-[-5%] top-[6%]"
            />
            <ElegantFloatingShape
              delay={0.45}
              width={200}
              height={55}
              rotate={-22}
              gradient="from-rose-400/[0.11] via-pink-400/[0.05]"
              className="left-[5%] bottom-[0%]"
            />
          </div>

          {/* Hero Badge Pill — live indicator */}
          <div className="flex justify-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-xl shadow-indigo-500/10 backdrop-blur-sm"
            >
              {/* Animated live dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <Award size={12} className="text-indigo-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                National Redressal Architecture v2.0
              </span>
            </motion.div>
          </div>

          {/* Hero Titles */}
          <div className="space-y-4 relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-black tracking-tight leading-none uppercase bg-linear-to-br from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_80px_rgba(99,102,241,0.35)]"
            >
              ResolveNow
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-xl sm:text-3xl md:text-4xl font-heading font-extrabold text-slate-300 tracking-tight max-w-4xl mx-auto"
            >
              AI-Powered Digital Grievance Redressal System
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="pt-2"
            >
              <HeroTypewriter className="text-base sm:text-2xl md:text-3xl font-mono" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium relative z-10"
          >
            Empowering institutions and citizens with an advanced, zero-trust digital redressal framework. Secure, authoritative, and committed to institutional accountability.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-4 relative z-10"
          >
            <Link to={isAuthenticated ? "/submit-grievance" : "/register"}>
              <MotionButton variant="glow" size="lg" rightIcon={ArrowRight}>
                Submit Grievance
              </MotionButton>
            </Link>

            <Link to="/public-status">
              <MotionButton variant="secondary" size="lg" leftIcon={Ticket}>
                Track Complaint
              </MotionButton>
            </Link>

            <Link to="/admin-login">
              <MotionButton variant="outline" size="lg" leftIcon={ShieldCheck}>
                Admin Login
              </MotionButton>
            </Link>

            <Link to="/transparency">
              <MotionButton variant="outline" size="lg" leftIcon={Trophy} className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                Trust Leaderboard
              </MotionButton>
            </Link>

            <a href="#how-it-works">
              <MotionButton variant="ghost" size="lg">
                View How It Works
              </MotionButton>
            </a>
          </motion.div>

          {/* Dashboard Hero Preview & Command Operations Showcase */}
          <div className="pt-8 space-y-12">
            {/* Live Interactive Command Center HUD Preview */}
            <div className="relative rounded-3xl p-1 bg-linear-to-b from-indigo-500/30 via-white/5 to-transparent border border-white/10 shadow-2xl shadow-indigo-950/50 overflow-hidden group">
              <div className="relative rounded-[calc(1.5rem-2px)] overflow-hidden bg-slate-950">
                <img 
                  src="/images/hero-command-center.jpg" 
                  alt="ResolveNow Enterprise Incident Command Center" 
                  className="w-full h-auto max-h-130 object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
                
                {/* Floating Telemetry HUD Badges */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE COMMAND CENTER</span>
                  </div>
                  <div className="hidden sm:flex px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                    <span>99.4% SLA TIMELINESS</span>
                  </div>
                  <div className="hidden md:flex px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                    <span>INSTANT AUTO-RESOLUTION</span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                      National Redressal Architecture • Real-Time Operations
                    </span>
                    <h3 className="text-lg sm:text-2xl font-heading font-black text-white">
                      Automated Incident Ingestion & Officer Triage Command
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                      Unified civic command terminal featuring automated department queue load-balancing, multimodal voice transcription, and cryptographic ticket verification.
                    </p>
                  </div>

                  <Link to="/public-status">
                    <MotionButton variant="glow" size="sm" rightIcon={ArrowRight}>
                      Live Ticket HUD
                    </MotionButton>
                  </Link>
                </div>
              </div>
            </div>

            <DashboardPreviewMock />

            {/* Interactive Live AI Triage Sandbox */}
            <div className="pt-6">
              <AiSandboxDemo />
            </div>
          </div>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 2: ABOUT RESOLVENOW (Rich Asymmetric Visual Showcase) */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Futuristic Campus & Civic Infrastructure Image */}
            <div className="lg:col-span-6 relative group">
              <div className="relative rounded-3xl p-1.5 bg-linear-to-br from-cyan-500/30 via-indigo-500/20 to-transparent border border-white/15 shadow-2xl shadow-cyan-950/40 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950">
                  <img 
                    src="/images/about-institution-network.jpg" 
                    alt="ResolveNow Institutional Digital Redressal Infrastructure" 
                    className="w-full h-110 sm:h-120 object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Overlay Badge Pills */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold tracking-wider uppercase">
                      🏛️ Centralized Redressal Tower
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold tracking-wider uppercase">
                      Mesh Network
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-left space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Institutional Redressal Fabric:</span>
                      <span className="text-emerald-400 font-bold">100% Connected</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Direct fiber-speed routing connecting student affairs, academic departments, municipal offices, and leadership terminals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Narrative & Strategic Value */}
            <div className="lg:col-span-6 text-left space-y-6">
              <ResponsiveTextBlock
                eyebrow="About ResolveNow"
                title="Next-Generation Institutional Redressal Infrastructure"
                center={false}
              />

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                ResolveNow is a unified digital grievance redresal system engineered for colleges, universities, corporate enterprises, and civic bodies. It replaces lost paper folders, untracked complaints, and silent delays with an automated, auditable resolution lifecycle with zero margin for bureaucratic stagnation.
              </p>

              {/* 3 Core Architecture Highlights */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AI-Driven Urgency & Auto-Triage</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Gemini AI analyzes natural language, evaluates citizen frustration scores, and auto-dispatches tickets to the exact designated terminal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Enforced 24h-48h SLA Escalation Timers</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Automated countdown clocks notify officers and trigger supervisor escalations if complaints approach deadline breach.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Public Cryptographic Milestone Ledger</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Users track resolution milestones publicly via reference ticket keys without login, preventing tampering or silent ticket dismissal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Spec Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                  <span className="text-slate-400 block uppercase text-[9px]">Target Sector</span>
                  <span className="font-bold text-white">Higher Ed & Offices</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                  <span className="text-slate-400 block uppercase text-[9px]">AI Engine</span>
                  <span className="font-bold text-indigo-400">Gemini 1.5 Pro</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                  <span className="text-slate-400 block uppercase text-[9px]">Security</span>
                  <span className="font-bold text-emerald-400">ISO-27001 RLS</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10">
                  <span className="text-slate-400 block uppercase text-[9px]">Compliance</span>
                  <span className="font-bold text-cyan-400">48-Hour SLA</span>
                </div>
              </div>
            </div>

          </div>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 3: WHY RESOLVENOW IS IMPORTANT */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Problem vs. Solution"
            title="Why ResolveNow Is Essential"
          />

          <LandingGrid cols={3}>
            {[
              { title: "Manual Handling Is Slow", desc: "Traditional paper files and generic emails take weeks to reach officers, leading to lost tickets and frustration." },
              { title: "Zero Tracking Transparency", desc: "Users have no visibility into who is processing their complaint or when a resolution will be dispatched." },
              { title: "Departmental Delays", desc: "Without strict SLA countdown timers, complaints stall between departments without officer accountability." },
              { title: "Admin Analytics Gap", desc: "Leadership lacks real-time statistics to identify recurring campus bottlenecks or poor departmental compliance." },
              { title: "AI Urgency Triage", desc: "Gemini AI evaluates frustration indexes and urgency levels to elevate critical incidents immediately." },
              { title: "SLA Resolution Discipline", desc: "Enforces strict 24h-48h resolution timers with automated escalation alerts to senior directorates." }
            ].map((item, idx) => (
              <GlassPanel key={idx} doubleBezel className="p-6 text-left space-y-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-heading font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </GlassPanel>
            ))}
          </LandingGrid>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 3B: AI MULTIMODAL INTAKE & VERIFIED TRACKING SHOWCASE */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Multimodal AI Architecture"
            title="Intelligent Voice Triage & Verifiable Milestone Ledger"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Feature highlights */}
            <div className="lg:col-span-5 text-left space-y-5 order-2 lg:order-1">
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Next-Gen Citizen Ingestion
                </span>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                  Speak, Transcribe, Triage & Track in Seconds
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  ResolveNow eliminates typing hurdles with our high-fidelity Voice Studio. Citizens can record audio in Hindi, English, Tamil, Telugu, and 8+ Indian regional dialects. Gemini Multimodal parses acoustics, extracts grievance intent, computes an automated urgency index, and mints a verifiable tracking timeline.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                  <span>Real-time audio waveform recording & noise reduction</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                  <span>Automated 1-10 Urgency & Frustration scoring</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Sub-minute auto-resolution for standard questions</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                  <span>Cryptographic hash verification of every ticket milestone</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link to="/submit-grievance">
                  <MotionButton variant="glow" size="md" leftIcon={Mic}>
                    Try Voice Intake Studio
                  </MotionButton>
                </Link>
                <Link to="/public-status">
                  <MotionButton variant="outline" size="md" leftIcon={Search}>
                    Verify Ticket Ledger
                  </MotionButton>
                </Link>
              </div>
            </div>

            {/* Right Column: Holographic Tablet Image */}
            <div className="lg:col-span-7 order-1 lg:order-2 group">
              <div className="relative rounded-3xl p-1.5 bg-linear-to-bl from-indigo-500/30 via-emerald-500/20 to-transparent border border-white/15 shadow-2xl shadow-indigo-950/40 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950">
                  <img 
                    src="/images/ai-voice-triage-flow.jpg" 
                    alt="AI Speech Wave Analysis and Verified Blockchain Ticket Timeline" 
                    className="w-full h-95 sm:h-112.5 object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Floating HUD chips */}
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono font-bold text-white">Live Voice Triage Engine: ACTIVE</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      Urgency: 8.5/10 Critical
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 4: HOW IT WORKS (8-Step Clean Aligned Cards) */}
        {/* ========================================================================= */}
        <AnimatedSection id="how-it-works" className="w-full max-w-5xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Lifecycle Journey"
            title="8-Step Animated Workflow"
          />

          <LandingGrid cols={2}>
            {[
              { num: '01', title: 'User Submits Grievance', desc: 'Fills narrative details, attaches supporting evidence files, and optionally pins location coordinates.' },
              { num: '02', title: 'Gemini AI Triage Analysis', desc: 'AI evaluates category, sentiment frustration score, urgency priority, and optional English translation.' },
              { num: '03', title: 'Smart Auto-Routing', desc: 'Dispatches complaint directly to the responsible department head or officer terminal.' },
              { num: '04', title: 'SLA Due Date Calculation', desc: 'Calculates 24h-48h resolution timer with countdown alerts.' },
              { num: '05', title: 'Automated Email Dispatch', desc: 'Sends SMTP confirmation with cryptographic tracking ticket ID to the user.' },
              { num: '06', title: 'Real-Time Public Tracking', desc: 'User verifies resolution milestones on the status portal without logging in.' },
              { num: '07', title: 'Officer Resolution Sign-Off', desc: 'Officer investigates, attaches resolution notes, and updates ticket status.' },
              { num: '08', title: 'User Feedback Rating', desc: 'User rates resolution quality on a 5-star scale to complete the audit trail.' },
            ].map((st, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 text-left space-y-2 hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs shrink-0">
                    {st.num}
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{st.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-11">{st.desc}</p>
              </div>
            ))}
          </LandingGrid>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 5: CORE FEATURES (14 Cards) */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="System Capabilities"
            title="14 Core Enterprise Features"
          />

          <LandingGrid cols={4}>
            {coreFeatures.map((feat, idx) => (
              <FeatureCard
                key={idx}
                icon={feat.icon}
                title={feat.title}
                description={feat.desc}
                badge={feat.badge}
              />
            ))}
          </LandingGrid>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 6: USE CASES (10 Cards) */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Deployment Domains"
            title="Versatile Institutional Use Cases"
          />

          <LandingGrid cols={5}>
            {useCases.map((uc, idx) => (
              <GlassPanel key={idx} className="p-5 text-left space-y-2" intensity="medium">
                <uc.icon size={20} className="text-indigo-400 mb-2" />
                <h4 className="text-xs font-bold text-white uppercase">{uc.title}</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">{uc.desc}</p>
              </GlassPanel>
            ))}
          </LandingGrid>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 7: PROCESS FLOW DIAGRAM */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl">
          <ProcessFlowDiagram />
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 8: BENEFITS (8 Cards) */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Value Proposition"
            title="Key Institutional Benefits"
          />

          <LandingGrid cols={4}>
            {benefits.map((b, idx) => (
              <GlassPanel key={idx} doubleBezel className="p-6 text-left space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Check size={14} />
                </div>
                <h4 className="text-xs font-bold text-white uppercase">{b.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{b.desc}</p>
              </GlassPanel>
            ))}
          </LandingGrid>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 9: DASHBOARD PREVIEW */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-6xl space-y-6">
          <ResponsiveTextBlock
            eyebrow="Product Interface"
            title="Experience the Command Terminals"
          />

          <DashboardPreviewMock />
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 10: TECHNOLOGY STACK BADGES */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-5xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Technical Architecture"
            title="Powered by Production Technologies"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            {techStack.map((tech, idx) => (
              <div key={idx} className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2.5 text-xs font-mono font-bold text-white shadow-md">
                <tech.icon size={16} className="text-indigo-400" />
                <span>{tech.name}</span>
                <span className="text-[9px] text-slate-500 font-normal">({tech.desc})</span>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 11: FAQ SECTION (12 Expandable Accordions) */}
        {/* ========================================================================= */}
        <AnimatedSection className="w-full max-w-4xl space-y-8">
          <ResponsiveTextBlock
            eyebrow="Knowledge Base"
            title="Frequently Asked Questions"
          />

          <FAQAccordion faqs={faqs} />
        </AnimatedSection>

        {/* ========================================================================= */}
        {/* SECTION 12: FOOTER */}
        {/* ========================================================================= */}
        <footer className="w-full max-w-6xl pt-12 border-t border-white/10 text-left space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  R
                </div>
                <span className="font-heading font-black text-base text-white uppercase tracking-wider">
                  ResolveNow
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                India's leading zero-trust AI digital grievance redressal system for institutions, colleges, and offices.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Quick Links</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link to="/public-status" className="hover:text-white">Track Ticket</Link></li>
                <li><Link to="/submit-grievance" className="hover:text-white">File Grievance</Link></li>
                <li><Link to="/officers" className="hover:text-white">Officers Directory</Link></li>
                <li><Link to="/whistleblower" className="hover:text-white">Whistleblower Vault</Link></li>
                <li><Link to="/emergency" className="hover:text-white">Emergency & Safety</Link></li>
                <li><Link to="/feedback" className="hover:text-white">CSAT & Feedback</Link></li>
                <li><Link to="/appeal" className="hover:text-white">File Formal Appeal</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Citizen Charter</Link></li>
                <li><Link to="/login" className="hover:text-white">Portal Sign In</Link></li>
                <li><Link to="/admin-login" className="hover:text-white">Admin Clearance</Link></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Support & Contact</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>New Delhi, Digital India</li>
                <li>support@resolvenow.gov.in</li>
                <li>Toll Free: 1800-REDRESS</li>
                <li>SLA Due: 24-48 Hours</li>
              </ul>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Project Credits</h4>
              <p className="text-slate-400 text-[11px]">
                Built with React 18, Vite, Framer Motion, GSAP, TailwindCSS, Supabase & Gemini AI.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ResolveNow Kernel v2.0 • ISO-27001 Certified</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/feedback" className="hover:text-slate-300 transition-colors">Feedback</Link>
              <span>•</span>
              <Link to="/appeal" className="hover:text-slate-300 transition-colors">Appeal</Link>
              <span>•</span>
              <Link to="/whistleblower" className="hover:text-slate-300 transition-colors">Whistleblower</Link>
              <span>•</span>
              <Link to="/emergency" className="hover:text-slate-300 transition-colors">Emergency</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">Charter</Link>
              <span>•</span>
              <p>© {new Date().getFullYear()} Government of Digital India. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </AuroraBackground>
  );
};

export default LandingPage;
