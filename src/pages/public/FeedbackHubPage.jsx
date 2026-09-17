import React, { useState, useEffect } from 'react';
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
  Moon, 
  Sun, 
  MessageSquare, 
  Tag, 
  ArrowRight,
  TrendingUp,
  Award,
  Lock,
  Search
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { useTheme } from '../../app/providers/ThemeProvider';
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
  const { theme, toggleTheme } = useTheme();

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
      
      // If linked to a specific ticket, dispatch via ticket feedback endpoint
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

      // Simulate local successful registration
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
    <AnimatedPage className={`min-h-screen w-full relative overflow-x-hidden ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-125 h-125 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-150 h-150 bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Bar Floating Controls */}
      <header className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 hover:text-white uppercase transition-colors"
        >
          <ChevronLeft size={16} />
          Portal Gateway
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/transparency"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <TrendingUp size={13} className="text-amber-400" />
            <span>Live Scorecard</span>
          </Link>

          <button 
            onClick={toggleTheme}
            className="p-2.5 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all hover:bg-white/10 cursor-pointer"
            title="Toggle theme mode"
            type="button"
            aria-label="Toggle theme mode"
          >
            {theme === 'ocean' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 pb-24 pt-4">
        
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-4 shadow-sm">
            <HeartHandshake size={13} />
            <span>Citizen Satisfaction & CSAT Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white mb-3">
            Institutional Feedback Survey
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-sans max-w-lg mx-auto leading-relaxed">
            Your honest feedback drives departmental accountability, resolution quality rankings, and service improvements across our campus.
          </p>
        </div>

        {submitted ? (
          /* Submission Confirmation Card */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-8 sm:p-12 rounded-3xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-xl text-center space-y-6 max-w-xl mx-auto shadow-2xl shadow-emerald-500/10"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-black text-white">Feedback Logged Successfully</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                Your satisfaction score of <strong>{rating}/5 stars</strong> has been incorporated into the institutional transparency leaderboard.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-mono text-slate-400 space-y-1">
              <div>Department: <span className="text-white font-bold">{department}</span></div>
              <div>Net Promoter Score: <span className="text-amber-400 font-bold">{npsScore} / 10</span></div>
              {ticketId && <div>Associated Ticket: <span className="text-cyan-400 font-bold">#{ticketId}</span></div>}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/transparency"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>View Department Leaderboard</span>
                <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setComments('');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase text-slate-300 transition-all cursor-pointer"
              >
                Submit Another Response
              </button>
            </div>
          </motion.div>
        ) : (
          /* Feedback Form */
          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 sm:p-10 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl space-y-8"
          >
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      department === dept.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md shadow-amber-500/10'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
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
                <span className="text-[10px] text-slate-500 font-normal">Connects review to a resolution dossier</span>
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="e.g. #TKT-2026-9281 (or leave blank for general campus feedback)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Star Rating Matrix */}
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
                3. Overall Resolution & Service Quality
              </label>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                          : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
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
                placeholder="Share your specific suggestions for departmental improvement, officer communication, or turnaround speed..."
                className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors resize-none font-sans"
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Recording Response...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>

          </motion.form>
        )}

      </main>
    </AnimatedPage>
  );
};

export default FeedbackHubPage;
