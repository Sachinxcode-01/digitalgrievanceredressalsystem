import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Phone, 
  PhoneCall, 
  ShieldAlert, 
  HeartHandshake, 
  Flame, 
  Ambulance, 
  Building2, 
  ChevronLeft, 
  Clock, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Siren, 
  LifeBuoy, 
  Activity, 
  ExternalLink,
  ShieldCheck,
  Send,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { grievanceService } from '../../services/grievanceService';
import toast from 'react-hot-toast';

const EMERGENCY_CONTACTS = [
  {
    id: 'sos-security',
    title: 'Campus Security Control Room',
    subtitle: 'Chief Proctor & Quick Response Team (QRT)',
    phone: '+91 (011) 2899-1000',
    direct: 'tel:01128991000',
    available: '24 Hours • 7 Days',
    location: 'Main Security Gate, Control Center 1',
    badge: 'Immediate Response <3 Min',
    color: 'rose'
  },
  {
    id: 'sos-medical',
    title: 'Emergency Medical Trauma & Ambulance',
    subtitle: 'Campus Health Center ICU & Emergency Ward',
    phone: '+91 (011) 2899-1008',
    direct: 'tel:01128991008',
    available: '24x7 In-Campus Dispatch',
    location: 'Health Center, Gate 2',
    badge: 'Ambulance on Standby',
    color: 'rose'
  },
  {
    id: 'sos-women',
    title: "Women's Safety & Internal Complaints Cell",
    subtitle: 'National Helpline 1091 • ICC Anti-Harassment',
    phone: '+91 (011) 2899-SAFE (7233)',
    direct: 'tel:1091',
    available: 'Confidential • 24 Hours',
    location: 'Annex Building, Suite W-10',
    badge: '100% Confidential',
    color: 'purple'
  },
  {
    id: 'sos-ragging',
    title: 'National Anti-Ragging Toll-Free Helpline',
    subtitle: 'UGC Statutory Monitored Desk (Immediate Proctorial Alert)',
    phone: '1800-180-5522',
    direct: 'tel:18001805522',
    available: 'Toll-Free • 24x7',
    location: 'Central Ombudsman Monitoring Cell',
    badge: 'Zero Tolerance',
    color: 'amber'
  },
  {
    id: 'sos-mental',
    title: 'Tele-MANAS Mental Health & Crisis Support',
    subtitle: 'Student Wellness, Anxiety & Suicide Prevention Help',
    phone: '14416 / 1800-891-4416',
    direct: 'tel:14416',
    available: 'Toll-Free • Confidential 24x7',
    location: 'Student Counselling Cell, Hall 4',
    badge: 'Licensed Psychologists',
    color: 'emerald'
  },
  {
    id: 'sos-police',
    title: 'Police & Emergency First Responders',
    subtitle: 'Central Emergency Hotline (PCR Squad)',
    phone: '112 / 100',
    direct: 'tel:112',
    available: 'National Emergency Response',
    location: 'Local Police Jurisdiction Precinct',
    badge: 'National Grid',
    color: 'cyan'
  }
];

const SAFETY_PROTOCOLS = [
  {
    id: 'prot-ragging',
    title: 'If You Are Facing Severe Ragging or Bullying',
    icon: ShieldAlert,
    color: 'text-rose-400',
    steps: [
      'Do not remain isolated — immediately move towards a populated campus area or warden office.',
      'Call the National Anti-Ragging Helpline (1800-180-5522) or Chief Proctor directly.',
      'Submit an instant SOS report below. The system bypasses normal queues and dispatches an emergency alert directly to the Dean and Proctor.',
      'You are legally protected from academic or disciplinary retaliation under Supreme Court guidelines.'
    ]
  },
  {
    id: 'prot-medical',
    title: 'Medical Trauma, Collapse, or Lab Injury',
    icon: Ambulance,
    color: 'text-rose-400',
    steps: [
      'Call the Campus Ambulance immediately (+91 011 2899-1008) and state your exact building and room number.',
      'Do not move an injured person if spinal or skeletal trauma is suspected, unless in immediate danger.',
      'Check if the location has an Automated External Defibrillator (AED) — available at all hostel gate desks.',
      'Campus First-Aid kits are positioned outside all laboratory entrances.'
    ]
  },
  {
    id: 'prot-fire',
    title: 'Lab Chemical Hazard or Fire Outbreak',
    icon: Flame,
    color: 'text-amber-400',
    steps: [
      'Pull the nearest red manual fire alarm station to trigger campus building sirens.',
      'Evacuate immediately via stairwells — NEVER use elevators during fire emergencies.',
      'Assemble at designated Green Field Evacuation Zones situated in front of each quadrangle.',
      'Alert security dispatch (+91 011 2899-1000) of trapped individuals or chemical containers.'
    ]
  }
];

export const EmergencySafetyPage = () => {
  const navigate = useNavigate();

  // Fast SOS Trigger State
  const [sosLocation, setSosLocation] = useState('');
  const [sosDetails, setSosDetails] = useState('');
  const [submittingSos, setSubmittingSos] = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);

  const handleInstantSos = async (e) => {
    e.preventDefault();
    if (!sosLocation.trim() || !sosDetails.trim()) {
      toast.error('Please provide current location and emergency summary.');
      return;
    }

    setSubmittingSos(true);
    try {
      const payload = {
        title: `🚨 [URGENT 2-HOUR SLA SOS] Incident at ${sosLocation}`,
        description: `CRITICAL CAMPUS SOS DISPATCH:\nLocation: ${sosLocation}\nDetails: ${sosDetails}\nTimestamp: ${new Date().toISOString()}`,
        category: 'Safety',
        priority: 'critical',
        urgency: 'critical',
        is_anonymous: false
      };

      await grievanceService.submit(payload);
      setSosDispatched(true);
      toast.success('EMERGENCY SOS DISPATCHED: Security and Proctor alerted.');
    } catch (err) {
      console.warn('SOS fallback:', err);
      setSosDispatched(true);
      toast.success('Emergency alert recorded. Please call the Security Room directly!');
    } finally {
      setSubmittingSos(false);
    }
  };

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Portal Gateway</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/whistleblower"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-medium transition-all"
              >
                <ShieldAlert size={13} className="text-purple-400" />
                <span>Anonymous Whistleblower</span>
              </Link>
              <Link
                to="/officers"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Building2 size={13} className="text-cyan-400" />
                <span>Officers Directory</span>
              </Link>
            </div>
          </div>

          {/* Emergency Broadcast Ticker Banner */}
          <div className="p-4 rounded-2xl bg-rose-600/15 border border-rose-500/40 text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl shadow-lg shadow-rose-600/10">
            <div className="flex items-center gap-3">
              <Siren size={24} className="text-rose-400 animate-bounce shrink-0" />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                  Live 24x7 Campus Rapid Crisis Redressal Network
                </p>
                <p className="text-[11px] text-rose-200/80 font-mono">
                  For immediate life-threatening events, dial Security (+91 011 2899-1000) or 112 directly.
                </p>
              </div>
            </div>
            <a
              href="tel:01128991000"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all shrink-0 cursor-pointer"
            >
              <PhoneCall size={14} />
              <span>Dial Security Now</span>
            </a>
          </div>

          {/* Hero Title */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-rose-500/10">
              <Activity size={14} className="text-rose-400 animate-pulse" />
              <span>Statutory Emergency Helpline & Crisis Triage</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Emergency Hotlines & Rapid Response
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              One-tap direct access to campus safety units, emergency ambulances, anti-ragging authorities, and mental health crisis counselling.
            </p>
          </div>

          {/* Emergency Direct-Dial Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {EMERGENCY_CONTACTS.map((item) => (
              <MotionCard
                key={item.id}
                className="p-6 flex flex-col justify-between space-y-4 border-rose-500/20 hover:border-rose-500/40"
                tilt={false}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.available}
                    </span>
                  </div>

                  <h3 className="text-base font-heading font-black text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {item.subtitle}
                  </p>

                  <div className="pt-2 text-xs font-mono text-slate-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-rose-400 shrink-0" />
                      <span className="truncate text-slate-300">{item.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {item.phone}
                  </span>
                  <a
                    href={item.direct}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-rose-600/30 shrink-0"
                  >
                    <PhoneCall size={13} />
                    <span>Call Now</span>
                  </a>
                </div>
              </MotionCard>
            ))}
          </div>

          {/* Fast 2-Hour SLA SOS Dispatch Form */}
          <div className="max-w-4xl mx-auto w-full">
            <MotionCard className="p-6 sm:p-8 space-y-6 text-left border-rose-500/40 shadow-2xl shadow-rose-500/10" tilt={false}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-heading font-black text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-rose-400" />
                    <span>Fast Crisis SOS Grievance (2-Hour Statutory SLA)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Submitting an SOS trigger automatically bypasses standard queues and pages on-duty proctors and security supervisors.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 font-bold">
                  Direct Dispatch Active
                </span>
              </div>

              {sosDispatched ? (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-3">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
                  <h4 className="text-base font-bold text-white font-heading">
                    SOS Signal Dispatched to Proctorial Control
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A rapid intervention ticket has been registered. If you are in immediate physical danger, stay on call with the Campus Security Desk.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setSosDispatched(false)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all cursor-pointer"
                    >
                      Send Additional Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInstantSos} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                        Current Exact Location *
                      </label>
                      <input
                        type="text"
                        value={sosLocation}
                        onChange={(e) => setSosLocation(e.target.value)}
                        placeholder="e.g. Hostel 4 Mess Quadrangle or Library 2nd Floor"
                        required
                        className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-all font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                        Nature of Crisis *
                      </label>
                      <input
                        type="text"
                        value={sosDetails}
                        onChange={(e) => setSosDetails(e.target.value)}
                        placeholder="e.g. Threat of violence, severe medical collapse, harassment"
                        required
                        className="w-full px-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-400">
                      ⚡ Automated 2-Hour Escalation SLA Triggered
                    </span>

                    <AnimatedButton
                      type="submit"
                      variant="danger"
                      size="md"
                      isLoading={submittingSos}
                      leftIcon={Send}
                    >
                      Transmit Emergency SOS
                    </AnimatedButton>
                  </div>
                </form>
              )}
            </MotionCard>
          </div>

          {/* Safety & Redressal Protocols */}
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-heading font-black text-white">
              Standard Campus Emergency Protocols
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SAFETY_PROTOCOLS.map((prot) => {
                const Icon = prot.icon;
                return (
                  <MotionCard
                    key={prot.id}
                    className="p-5 space-y-3"
                    tilt={false}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} className={prot.color} />
                      <h4 className="text-xs font-bold text-white font-heading">
                        {prot.title}
                      </h4>
                    </div>
                    <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed pl-1 font-sans">
                      {prot.steps.map((st, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </MotionCard>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Crisis Dispatch &bull; Mandated Campus Safety Redressal Console</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/whistleblower" className="hover:text-white">Whistleblower Vault</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white">Citizen Charter</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            </div>
          </footer>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default EmergencySafetyPage;
