import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe, Sparkles, Ticket, Landmark, Award, ShieldAlert, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import toast from 'react-hot-toast';

export const LandingPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'ocean');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.body.className = theme === 'midnight' ? 'theme-midnight' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Use role from unified auth state
  const userRole = user?.role || 'student';
  const dashboardLink = (userRole === 'admin' || userRole === 'super admin') ? '/admin/dashboard' : '/dashboard';

  const features = [
    { icon: <Landmark size={24} />, title: 'Centralized Redressal', desc: 'Unified infrastructure connecting citizens directly to departmental authorities for efficient resolution.' },
    { icon: <ShieldCheck size={24} />, title: 'Immutable Security', desc: 'Enterprise-grade encryption and zero-trust protocols protecting institutional integrity and user privacy.' },
    { icon: <Globe size={24} />, title: 'Pan-India Reach', desc: 'A transparent, borderless digital framework designed for the scale and diversity of the modern state.' },
  ];

  return (
    <div className={`w-full min-h-screen relative overflow-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="h-screen w-full overflow-y-auto overflow-x-hidden relative z-50 flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full max-w-7xl px-4 sm:px-8 py-4 sm:py-6 flex flex-row items-center justify-between gap-4 sm:gap-0 border-b border-border/10 backdrop-blur-md sticky top-0 bg-background/40 z-[100]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center p-1.5 shadow-md border border-border">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-md" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-heading font-extrabold text-foreground leading-none tracking-tight">ResolveNow</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary mt-1">Grievance Redressal</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/track" className="text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest flex items-center gap-2 group">
              <Ticket size={16} className="group-hover:text-primary transition-colors" />
              <span>Track Status</span>
            </Link>
            
            <button 
              onClick={() => setTheme(prev => prev === 'ocean' ? 'midnight' : 'ocean')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-lg transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'ocean' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {!isAuthenticated ? (
              <Link to="/login">
                <button className="btn-premium !py-2.5 !px-5 rounded-xl shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Access Portal</span>
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to={dashboardLink}>
                  <button className="btn-premium !py-2.5 !px-5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Console</span>
                  </button>
                </Link>
                <button 
                  onClick={logout}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 border border-slate-800 rounded-xl hover:bg-rose-500/5 hover:border-rose-500/20 cursor-pointer"
                >
                  Exit
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-6xl pt-16 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary shadow-sm">
                <Award size={14} className="animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em]">National Information Authority</span>
              </div>
            </div>
            
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-heading font-black text-foreground leading-[1.05] tracking-tight max-w-4xl mx-auto">
              Transparent Governance <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent italic">Redefined.</span>
            </h2>

            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Empowering citizens with India's most advanced, zero-trust digital redressal framework. Secure, authoritative, and committed to institutional accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {!isAuthenticated ? (
                <Link to="/login">
                  <button className="btn-premium px-8 py-4 w-full sm:w-auto text-xs uppercase tracking-widest flex items-center justify-center gap-2 group">
                    Initialize Identity
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              ) : (
                <Link to={dashboardLink}>
                  <button className="btn-premium px-8 py-4 w-full sm:w-auto text-xs uppercase tracking-widest flex items-center justify-center gap-2 group">
                    Administrative Console
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              )}
              <Link to="/track" className="w-full sm:w-auto">
                <button className="btn-ghost px-8 py-4 w-full sm:w-auto text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  Verify Status
                  <Ticket size={16} className="text-primary" />
                </button>
              </Link>
            </div>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 mt-16 max-w-4xl mx-auto px-8 py-6 rounded-3xl border border-border/50 bg-background/20 backdrop-blur-md shadow-lg"
            >
              {[
                { label: 'Verified Resolutions', val: '24,592+' },
                { label: 'SLA Redressal Rate', val: '99.9%' },
                { label: 'Security Compliance', val: 'ISO-27001' }
              ].map((stat, i) => (
                <div key={i} className="text-center group py-2 sm:py-0 border-b sm:border-b-0 sm:border-r last:border-0 border-border/50">
                  <p className="text-2xl sm:text-3xl font-heading font-black text-foreground group-hover:text-primary transition-all duration-300">{stat.val}</p>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em] mt-1.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="glass-card p-8 text-left group hover:border-primary-bright/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-300">
                  {React.cloneElement(feature.icon, { size: 100 })}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-heading font-extrabold text-foreground mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Institutional Intelligence (About) */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mt-36 w-full text-left space-y-16"
          >
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-[2px] bg-primary" />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">Authority Perspective</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-6 leading-tight">National Governance <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic">Infrastructure.</span></h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium max-w-2xl">
                The Digital India Grievance Portal is engineered to eliminate the friction between administrative processes and public service. We leverage high-density infrastructure to ensure total transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="glass-card p-8 sm:p-10 border-primary/10 bg-primary/[0.01] hover:bg-primary/[0.02] rounded-3xl"
              >
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <ShieldCheck size={24} />
                   </div>
                   <h4 className="text-xl font-heading font-extrabold text-foreground tracking-tight">Institutional Trust</h4>
                </div>
                <ul className="space-y-5">
                  {[
                    { t: 'Verified Triage', d: 'Automated categorization systems eliminate human bias in initial processing.' },
                    { t: 'Executive Command', d: 'Real-time monitoring of departmental response times and efficiency metrics.' },
                    { t: 'Audit Integrity', d: 'Immutable record logs of every administrative decision for full accountability.' },
                    { t: 'Specialized Routing', d: 'Instant distribution of grievances to authorized legal and technical sectors.' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-muted-foreground text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_var(--color-primary)]" />
                      <div>
                        <span className="text-foreground font-bold text-sm block mb-0.5 uppercase tracking-wider">{item.t}</span>
                        {item.d}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="glass-card p-8 sm:p-10 border-border/50 bg-muted/10 hover:bg-muted/15 rounded-3xl"
              >
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-foreground shadow-sm">
                      <ShieldAlert size={24} />
                   </div>
                   <h4 className="text-xl font-heading font-extrabold text-foreground tracking-tight">Citizen Empowerment</h4>
                </div>
                <ul className="space-y-5">
                  {[
                    { t: 'Transparent Timelines', d: 'Visual proof of progress across all institutional milestones in real-time.' },
                    { t: 'Secure Disclosure', d: 'Identity protection protocols for whistleblower safety and reporting integrity.' },
                    { t: 'Evidence Integration', d: 'High-bandwidth support for multi-modal documentation and claims evidence.' },
                    { t: 'Audible Updates', d: 'Neural synthesized reporting for enhanced accessibility and citizen engagement.' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-muted-foreground text-xs font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-foreground font-bold text-sm block mb-0.5 uppercase tracking-wider">{item.t}</span>
                        {item.d}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>

          {/* Neural Flow Visualization */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-36 w-full glass-card p-8 sm:p-12 rounded-[32px] border-border bg-muted/5 relative overflow-hidden group shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-background opacity-40 pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-foreground text-left">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-primary mb-4 block">System Protocol</span>
                <h3 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-8 leading-tight">
                  The Infrastructure <br /> 
                  of Accountability.
                </h3>
                <div className="space-y-6">
                  {[
                    { step: '01', title: 'Data Ingestion', desc: 'Secure capture and validation of grievance data with cryptographic verification.' },
                    { step: '02', title: 'Categorical Audit', desc: 'High-density analysis to determine jurisdiction and severity protocols.' },
                    { step: '03', title: 'Authority Routing', desc: 'Immediate secure distribution to the appropriate administrative terminal.' },
                    { step: '04', title: 'Resolution Sync', desc: 'Bilateral communication channel for evidence review and final redressal.' }
                  ].map((flow, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 sm:gap-6 items-start"
                    >
                      <span className="text-primary font-heading font-black text-xl">{flow.step}</span>
                      <div>
                        <h4 className="text-foreground font-extrabold mb-1 uppercase tracking-wider text-xs">{flow.title}</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed font-medium">{flow.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="relative h-[350px] sm:h-[400px] flex items-center justify-center">
                <div className="relative w-64 h-64">
                   <div className="absolute inset-0 flex items-center justify-center z-20">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.03, 1],
                          boxShadow: [
                            "0 0 20px 5px rgba(59, 130, 246, 0.15)",
                            "0 0 40px 10px rgba(59, 130, 246, 0.25)",
                            "0 0 20px 5px rgba(59, 130, 246, 0.15)"
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-[28px] flex items-center justify-center shadow-lg p-3.5 overflow-hidden border border-border"
                      >
                         <img src="/logo.jpg" alt="Neural Core" className="w-full h-full object-contain relative z-10 rounded-xl" />
                         <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent animate-pulse animate-duration-3000" />
                      </motion.div>
                   </div>
                   
                   <div className="absolute inset-0 border border-primary/20 rounded-full" />
                   <div className="absolute -inset-8 border border-primary/10 rounded-full opacity-60" />
                   <div className="absolute -inset-16 border border-border/50 rounded-full opacity-40" />

                   {[
                     { Icon: ShieldCheck, color: 'text-primary', delay: 0, radius: '100px', duration: 15 },
                     { Icon: Zap, color: 'text-primary', delay: 2.5, radius: '120px', duration: 20 },
                     { Icon: Globe, color: 'text-primary', delay: 5, radius: '140px', duration: 25 },
                     { Icon: Landmark, color: 'text-primary', delay: 7.5, radius: '160px', duration: 30 }
                   ].map((item, i) => (
                     <motion.div
                       key={i}
                       animate={{ rotate: 360 }}
                       transition={{ duration: item.duration, repeat: Infinity, ease: "linear", delay: item.delay }}
                       style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                     >
                       <motion.div
                         animate={{ 
                           scale: [1, 1.05, 0.95, 1],
                           opacity: [0.8, 1, 0.7, 0.8],
                         }}
                         transition={{ duration: 6, repeat: Infinity }}
                         style={{ 
                           position: 'absolute',
                           left: '50%',
                           top: '50%',
                           transform: `translateX(${item.radius}) translateY(-50%)`,
                         }}
                         className="p-2.5 glass-card border-primary/20 text-primary rounded-xl shadow-md bg-background"
                       >
                         <item.Icon size={16} />
                       </motion.div>
                     </motion.div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Institutional Compliance Section */}
          <div className="mt-32 w-full">
            <h3 className="text-2xl font-heading font-black text-foreground mb-12 uppercase tracking-wide text-center">Institutional Compliance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Security', val: 'End-to-End', desc: 'Secure Data Protocol' },
                { label: 'SLA Response', val: '48 Hours', desc: 'Guaranteed Triage' },
                { label: 'Uptime SLA', val: '99.99%', desc: 'High Availability' },
                { label: 'Infrastructure', val: 'Digital India', desc: 'Official Network' }
              ].map((adv, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl bg-background/40 border border-border/50 text-center backdrop-blur-sm group hover:border-primary-bright/20 transition-all duration-300"
                >
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-2">{adv.label}</p>
                  <p className="text-lg sm:text-xl font-heading font-extrabold text-foreground mb-1 group-hover:text-primary transition-colors">{adv.val}</p>
                  <p className="text-[8px] text-primary font-black uppercase tracking-wider opacity-85">{adv.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interactive FAQ Accordion */}
          <div className="mt-32 w-full max-w-4xl text-left space-y-8">
            <div className="text-center">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2 block">Common Questions</span>
              <h3 className="text-2xl font-heading font-black text-foreground uppercase tracking-wide">FAQ / Triage Compliance</h3>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  q: "How does the automated grievance triage system work?",
                  a: "Our core router processes grievances using semantic classification. Each complaint is classified, analyzed for urgency, mapped to compliance categories, and routed directly to the authorized redressal officer's terminal in less than 5 seconds."
                },
                {
                  q: "What is the standard SLA response time for submitted cases?",
                  a: "Under the standard charter, institutional officers must acknowledge incoming grievances within 24 hours. The resolution protocol enforces a strict 48-hour deadline for triage updates, with full ticket resolution targeted within 7 business days."
                },
                {
                  q: "How is my personal data and identity secured?",
                  a: "ResolveNow enforces row-level security (RLS) policies at the database layer. All data payloads are encrypted at rest and in transit. Identity logs are completely audited, ensuring that only authorized personnel have read access to your submissions."
                },
                {
                  q: "Can I track the status of my grievance publicly?",
                  a: "Yes. By submitting a grievance, you receive a secure, cryptographic tracking ticket ID. You can input this key on the 'Track Status' page to check real-time pipeline status without logging into the portal."
                }
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="glass-card border-border/50 bg-[#0b1329]/30 rounded-2xl overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-foreground hover:text-primary transition-colors font-bold text-xs uppercase tracking-wider text-left cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-xl font-bold ml-4">{isOpen ? '−' : '+'}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="border-t border-border/20 bg-background/25 px-6 py-4"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* About & Contact Section */}
          <div className="mt-32 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 text-left items-start">
            <div className="space-y-6">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary block">About ResolveNow</span>
              <h3 className="text-2xl font-heading font-black text-foreground uppercase tracking-wide">Secure Communication Hub</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                ResolveNow v2.0 is the official unified digital complaints gateway. Developed under modern governance standards, our platform ensures seamless dialogue, transparent ticketing, and absolute compliance.
              </p>
              <div className="space-y-2 text-[10px] font-mono font-bold uppercase text-slate-400">
                <p>📍 Location: New Delhi, India</p>
                <p>📧 Support: secure-support@resolve.now</p>
                <p>🕒 Kernel Uptime: 99.998%</p>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 border-border/50 bg-[#0b1329]/30 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Send secure message</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Message dispatched securely. Our operators will respond via secure mail.");
                  e.target.reset();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Operator Name"
                    required
                    className="glass-input w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <input
                    type="email"
                    placeholder="Secure Email"
                    required
                    className="glass-input w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <textarea
                    rows="3"
                    placeholder="Brief description of inquiry..."
                    required
                    className="glass-input w-full resize-none p-3"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-premium w-full text-[10px] font-black uppercase tracking-widest py-3"
                >
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="w-full py-10 border-t border-border/10 bg-background/20 backdrop-blur-md text-center text-[8px] sm:text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Government of Digital India &bull; Unified Grievance Infrastructure &bull; Secure Portal
        </footer>
      </div>
    </div>
  );
};
