import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  ChevronLeft, 
  Printer, 
  Download, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Gavel,
  FileWarning,
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';

export const TermsOfServicePage = () => {
  const [activeSection, setActiveSection] = useState('authority');

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'authority', title: '1. Statutory Authority & Jurisdiction', icon: Gavel },
    { id: 'eligibility', title: '2. User Eligibility & Representation', icon: Scale },
    { id: 'conduct', title: '3. Acceptable Use & Integrity Standard', icon: ShieldCheck },
    { id: 'penalties', title: '4. False Claims & Malicious Filings', icon: FileWarning },
    { id: 'protection', title: '5. Anti-Retaliation & Whistleblower Shield', icon: EyeOff },
    { id: 'appeals', title: '6. Finality of Appellate Decisions', icon: CheckCircle2 }
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
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Terms</span>
              </button>
              <Link
                to="/terms"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
              >
                <span>Citizen Charter</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Scale size={13} />
              <span>Institutional Legal Framework & Obligations</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white uppercase">
              Terms of Service. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400">
                Statutory Redressal Code.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              These binding terms govern the submission, investigation, arbitration, and resolution of digital grievances lodged within the ResolveNow administrative ecosystem.
            </p>
          </div>

          {/* Main Legal Content with Sidebar Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Navigation List (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-mono uppercase text-slate-400 font-bold px-3 mb-2">
                Table of Contents
              </div>
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-800/90 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                    <span className="text-xs font-mono font-bold">{sec.title}</span>
                  </button>
                );
              })}

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs font-mono text-amber-300/90 space-y-2 mt-4">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Important Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                  Lodging a grievance creates an official administrative record. All submissions are timestamped and legally admissible under Indian Evidence Act §65B.
                </p>
              </div>
            </div>

            {/* Detailed Clause Content (8 cols) */}
            <div className="lg:col-span-8">
              <MotionCard className="p-6 sm:p-8 border border-white/10 bg-slate-900/80 backdrop-blur-md space-y-6">
                
                {activeSection === 'authority' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Gavel size={20} className="text-amber-400" />
                      <span>1. Statutory Authority & Jurisdiction</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      ResolveNow operates as the recognized digital dispute resolution repository under Section 5(1) of the University Grants Commission (Redressal of Grievances of Students) Regulations, 2023 and the Administrative Reforms directives of the Ministry of Personnel, Public Grievances and Pensions.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      All orders, summons, and findings generated by designated Redressal Officers and the Appellate Ombudsman carry binding institutional effect across enrolled students, faculty members, administrative staff, and contractor personnel.
                    </p>
                  </motion.div>
                )}

                {activeSection === 'eligibility' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Scale size={20} className="text-amber-400" />
                      <span>2. User Eligibility & Representation</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Any bona fide student, faculty member, researcher, or permanent employee of the affiliated institution may lodge complaints concerning academic irregularity, evaluation discrepancies, facility failure, hostel allocation, administrative delay, or discriminatory practices.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Complaints must be filed directly by the aggrieved party. Representation through legal attorneys is precluded during initial departmental mediation, except in proceedings before the Appellate Ombudsman Tribunal where legal advisors may assist upon prior written notice.
                    </p>
                  </motion.div>
                )}

                {activeSection === 'conduct' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck size={20} className="text-amber-400" />
                      <span>3. Acceptable Use & Integrity Standard</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Grievants and respondents must maintain professional decorum at all times within the portal communication logs. Submissions must not contain profane, threatening, defamatory, or racially discriminatory language.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Uploaded files (PDF, PNG, JPG) must be authentic and unaltered. Uploading malware, unauthorized security payloads, or forging digital receipts constitutes cybercrime actionable under Sections 43 & 66 of the Information Technology Act, 2000.
                    </p>
                  </motion.div>
                )}

                {activeSection === 'penalties' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileWarning size={20} className="text-rose-400" />
                      <span>4. False Claims & Malicious Filings</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      The grievance redressal apparatus exists to uphold genuine justice. Falsification of documents, fabrication of events, or intentional malicious character assassination aimed at harassing faculty or peers is strictly prohibited.
                    </p>
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono space-y-1">
                      <div className="font-bold">Disciplinary Repercussions:</div>
                      <div>• Suspension of portal access credentials for up to 2 academic terms</div>
                      <div>• Formal referral to the University Disciplinary Committee for academic probation</div>
                      <div>• Liability for administrative costs incurred during fraudulent investigation</div>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'protection' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <EyeOff size={20} className="text-emerald-400" />
                      <span>5. Anti-Retaliation & Whistleblower Shield</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      ResolveNow guarantees absolute non-retaliation. It is a severe disciplinary offense for any professor, administrator, or staff member to penalize, grade-dock, threaten, or intimidate any student for lodging a grievance in good faith.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Anonymous filings routed through the Whistleblower Vault undergo metadata scrubbing (IP addresses and browser footprints are stripped prior to departmental receipt) guaranteeing whistleblower confidentiality.
                    </p>
                  </motion.div>
                )}

                {activeSection === 'appeals' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-cyan-400" />
                      <span>6. Finality of Appellate Decisions</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Resolutions issued by the Appellate Ombudsman Tribunal represent the final institutional remedy. Once an appeal is formally determined and signed by the Chief Ombudsman, the case is marked permanently redressed on the public ledger.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Nothing contained within these Terms precludes any citizen from exercising subsequent statutory legal remedies available under the High Court writ jurisdiction or statutory consumer redressal tribunals.
                    </p>
                  </motion.div>
                )}

              </MotionCard>
            </div>

          </div>

        </div>
      </div>
    </AuroraBackground>
  );
};

export default TermsOfServicePage;
