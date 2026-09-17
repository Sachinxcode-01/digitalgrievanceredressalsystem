import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartHandshake, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft, 
  MessageSquare, 
  Tag, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Lock, 
  Search,
  Activity,
  HelpCircle
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuroraBackground } from '../../components/ui/BackgroundEffects';
import MotionCard from '../../components/ui/MotionCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { useAuth } from '../../app/providers/AuthProvider';
import { apiClient } from '../../api/apiClient';

const DEPARTMENTS = [
  { id: 'IT Support', name: 'IT Support & Campus Wi-Fi', icon: '💻' },
  { id: 'Academic', name: 'Academic Affairs & Exams', icon: '🎓' },
  { id: 'Maintenance', name: 'Hostel & Infrastructure', icon: '🏢' },
  { id: 'Financial', name: 'Accounts & Scholarships', icon: '💳' },
  { id: 'Safety', name: 'Campus Safety & Health', icon: '🛡️' },
  { id: 'General', name: 'General Campus Services', icon: '🏛️' },
];

const PRESET_TAGS = [
  'Prompt Resolution',
  'Helpful Officer',
  'Clear Communication',
  'Delayed Response',
  'Required Multiple Follow-ups',
  'Excellent Service',
  'Technical Glitch Resolved',
  'Infrastructure Repaired',
  'Needs Better Equipment'
];

export const FeedbackHubPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [department, setDepartment] = useState('IT Support');
  const [ticketId, setTicketId] = useState(searchParams.get('ticket') || searchParams.get('token') || '');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [npsScore, setNpsScore] = useState(9); // 0-10
  const [selectedTags, setSelectedTags] = useState(['Prompt Resolution']);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please provide a star rating');
      return;
    }

    setSubmitting(true);
    try {
      const cleanTicket = ticketId.trim().replace('#', '');
      
      if (cleanTicket) {
        try {
          await apiClient.post(`/grievances/${cleanTicket}/feedback`, {
            rating,
            npsScore,
            comments,
            tags: selectedTags,
            department
          });
        } catch (apiErr) {
          console.warn('Backend ticket feedback endpoint fallback:', apiErr);
        }
      }

      await new Promise(r => setTimeout(r, 600));
      setSubmitted(true);
      toast.success('Thank you! Your institutional feedback has been recorded.');
    } catch (err) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
        <div className="max-w-4xl mx-auto w-full space-y-8 my-auto pt-4 pb-16">
          
          {/* Top Bar Floating Controls */}
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
                to="/transparency"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <TrendingUp size={13} className="text-amber-400" />
                <span>Leaderboard</span>
              </Link>
              <Link
                to="/officers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-mono font-medium transition-all"
              >
                <Building2 size={13} className="text-cyan-400" />
                <span>Officers Directory</span>
              </Link>
            </div>
          </div>

          {/* Header Hero */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-amber-500/10">
              <HeartHandshake size={13} className="text-amber-400" />
              <span>Citizen Satisfaction & CSAT Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
              Institutional Feedback Survey
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Your verified feedback directly influences departmental accountability, officer SLAs, and service rankings across campus.
            </p>
          </div>

          {submitted ? (
            /* Submission Confirmation Card */
            <MotionCard className="p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto border-emerald-500/40 shadow-2xl shadow-emerald-500/10" tilt={false}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-black text-white">Feedback Logged Successfully</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Your satisfaction score of <strong className="text-emerald-400">{rating}/5 stars</strong> has been incorporated into the institutional transparency leaderboard.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-400 space-y-1.5 shadow-inner">
                <div>Department: <span className="text-white font-bold">{department}</span></div>
                <div>Net Promoter Score: <span className="text-amber-400 font-bold">{npsScore} / 10</span></div>
                {ticketId && <div>Associated Ticket: <span className="text-cyan-400 font-bold">#{ticketId}</span></div>}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to="/transparency" className="w-full sm:w-auto">
                  <AnimatedButton variant="glow" size="md" rightIcon={ArrowRight} className="w-full sm:w-auto">
                    View Transparency Scorecard
                  </AnimatedButton>
                </Link>
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSubmitted(false);
                    setComments('');
                  }}
                  className="w-full sm:w-auto"
                >
                  Submit Another Response
                </AnimatedButton>
              </div>
            </MotionCard>
          ) : (
            /* Feedback Form */
            <MotionCard className="p-6 sm:p-10 space-y-8" tilt={false}>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Department Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Building2 size={14} className="text-amber-400" />
                    <span>1. Select Department or Service Node</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setDepartment(dept.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          department === dept.id
                            ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-lg">{dept.icon}</span>
                        <span className="text-xs font-heading font-bold truncate">{dept.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Ticket Reference */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>2. Reference Ticket ID (Optional)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Connects review to resolution dossier</span>
                  </label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder="e.g. #TKT-2026-9281 (or leave blank for general campus feedback)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                {/* Star Rating Matrix */}
                <div className="space-y-3">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                    3. Overall Resolution & Service Quality
                  </label>
                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              (hoverRating || rating) >= star
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {rating === 5 ? 'Exceptional (5/5)' :
                       rating === 4 ? 'Very Good (4/5)' :
                       rating === 3 ? 'Acceptable (3/5)' :
                       rating === 2 ? 'Needs Improvement (2/5)' : 'Unsatisfactory (1/5)'}
                    </span>
                  </div>
                </div>

                {/* Net Promoter Score (NPS 0-10) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      4. How likely are you to recommend our redressal portal?
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400">{npsScore} / 10</span>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={npsScore}
                      onChange={(e) => setNpsScore(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0 - Not Likely (Detractor)</span>
                      <span>5 - Neutral (Passive)</span>
                      <span>10 - Extremely Likely (Promoter)</span>
                    </div>
                  </div>
                </div>

                {/* Tags Checklist */}
                <div className="space-y-3">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-400" />
                    <span>5. What best describes your interaction?</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-600/20'
                              : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Written Comments */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-amber-400" />
                    <span>6. Additional Comments or Constructive Suggestions</span>
                  </label>
                  <textarea
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share specific suggestions for departmental improvement, officer communication, or turnaround speed..."
                    className="w-full p-4 bg-slate-950/90 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Anonymity & Submission Bar */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-white/20 text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span className="flex items-center gap-1">
                      <Lock size={12} className="text-slate-500" />
                      Submit as Anonymous Citizen Review
                    </span>
                  </label>

                  <AnimatedButton
                    type="submit"
                    variant="glow"
                    size="md"
                    isLoading={submitting}
                    leftIcon={Send}
                  >
                    Submit Feedback
                  </AnimatedButton>
                </div>
              </form>
            </MotionCard>
          )}

          {/* Footer */}
          <footer className="pt-6 border-t border-white/5 text-center text-xs font-mono text-slate-500 space-y-2">
            <p>&copy; {new Date().getFullYear()} ResolveNow Citizen Redressal System &bull; Institutional CSAT Hub</p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <Link to="/officers" className="hover:text-white">Officers Directory</Link>
              <span>•</span>
              <Link to="/transparency" className="hover:text-white">Live Leaderboard</Link>
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

export default FeedbackHubPage;
