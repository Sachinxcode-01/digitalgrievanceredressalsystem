import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  ChevronLeft, 
  Building2, 
  Headphones, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';

export const ContactSupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general_support',
    ticketId: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const offices = [
    {
      name: 'Central Grievance Redressal Cell',
      location: 'Administrative Block, Level 2, Room 204',
      hours: 'Mon – Fri: 09:00 AM – 05:30 PM',
      email: 'grievance-desk@resolvenow.gov.in',
      phone: '+91 (011) 2670-4001',
      badge: 'Main Headquarters'
    },
    {
      name: 'Academic & Examination Helpline',
      location: 'Examination Wing, North Campus Block B',
      hours: 'Mon – Sat: 10:00 AM – 04:00 PM',
      email: 'exams-appeals@resolvenow.gov.in',
      phone: '+91 (011) 2670-4008',
      badge: 'Academic Disputes'
    },
    {
      name: 'Hostel & Student Welfare Directorate',
      location: 'Student Affairs Complex, Wing C',
      hours: '24/7 Rapid Response Desk',
      email: 'welfare-support@resolvenow.gov.in',
      phone: '+91 (011) 2670-4020',
      badge: 'Hostel & Amenities'
    },
    {
      name: 'Anti-Ragging & Equal Opportunity Cell',
      location: 'Vigilance & Equity Bureau, Ground Floor',
      hours: '24/7 Toll-Free Emergency Line',
      email: 'anti-ragging@resolvenow.gov.in',
      phone: '1800-180-5522',
      badge: 'Zero Tolerance'
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
                to="/emergency"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-mono font-bold transition-all"
              >
                <ShieldAlert size={14} />
                <span>Emergency SOS</span>
              </Link>
              <Link
                to="/public-status"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
              >
                <span>Track Ticket</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Headphones size={13} />
              <span>Official Helpdesk & Support Bureau</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white uppercase">
              We Are Here To Assist. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                Direct Contact Channels.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Need technical assistance with your ticket, institutional policy clarifications, or urgent redressal escalation? Reach out through our dedicated communication lines.
            </p>
          </div>

          {/* Emergency Ribbon */}
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-rose-300 text-xs sm:text-sm">
              <AlertTriangle size={20} className="text-rose-400 shrink-0" />
              <span>
                <strong>Facing immediate safety, harassment, or ragging issues?</strong> Do not wait for standard ticketing. Use the emergency hotline immediately.
              </span>
            </div>
            <a 
              href="tel:18001805522" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shrink-0 transition-colors shadow-lg shadow-rose-600/20"
            >
              <Phone size={14} />
              <span>Toll Free: 1800-180-5522</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Contact Information & Physical Desks (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={18} className="text-cyan-400" />
                  <span>Campus Grievance Offices</span>
                </h2>
                <span className="text-xs font-mono text-slate-400">Walk-in & In-person</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offices.map((office, idx) => (
                  <MotionCard key={idx} className="p-5 border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                        {office.badge}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-white">{office.name}</h3>
                    
                    <div className="space-y-1.5 text-xs text-slate-300 font-sans">
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                        <span>{office.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-emerald-400 shrink-0" />
                        <span>{office.hours}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <a href={`mailto:${office.email}`} className="hover:text-cyan-400 transition-colors">{office.email}</a>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a href={`tel:${office.phone}`} className="hover:text-cyan-400 transition-colors">{office.phone}</a>
                      </div>
                    </div>
                  </MotionCard>
                ))}
              </div>

              {/* Service Level Commitments Card */}
              <MotionCard className="p-5 border border-white/10 bg-slate-900/60 backdrop-blur-md space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Clock size={14} />
                  <span>Support Inquiries SLA & Turnaround Times</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-slate-400">Inquiry Response</div>
                    <div className="text-white font-bold text-sm mt-0.5">&lt; 4 Hours</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-slate-400">Technical Bugs</div>
                    <div className="text-white font-bold text-sm mt-0.5">Same Day Fix</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-slate-400">Formal Escalations</div>
                    <div className="text-white font-bold text-sm mt-0.5">&lt; 24 Hours</div>
                  </div>
                </div>
              </MotionCard>
            </div>

            {/* Direct Query Submission Form (5 cols) */}
            <div className="lg:col-span-5">
              <MotionCard className="p-6 sm:p-7 border border-white/10 bg-slate-900/80 backdrop-blur-md space-y-5">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={16} className="text-cyan-400" />
                    <span>Send Helpdesk Message</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Direct dispatcher to support officers and ombudsman staff
                  </p>
                </div>

                {submitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="font-heading font-bold text-white text-base">Message Dispatched</h4>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Your query has been logged into the support desk queue. A support coordinator will reply to <strong>{formData.email}</strong> within 4 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors mt-2"
                    >
                      Send Another Inquiry
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Aditi Roy"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="aditi@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Phone (Optional)</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Inquiry Type</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                        >
                          <option value="general_support">General Information</option>
                          <option value="ticket_followup">Ticket Follow-up / Status</option>
                          <option value="appeal_guidance">Appellate Guidance</option>
                          <option value="tech_issue">Technical / Portal Glitch</option>
                          <option value="confidential">Confidential Reporting</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Ticket ID (If any)</label>
                        <input
                          type="text"
                          value={formData.ticketId}
                          onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                          placeholder="e.g. TKT-2026-X9B2"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase text-slate-400 font-semibold">Inquiry Details</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please describe your question or issue in detail..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-sans focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <span>Transmitting Inquiry...</span>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Dispatch Inquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </MotionCard>
            </div>

          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default ContactSupportPage;
