/**
 * Enterprise Production Lightweight Localization Engine (i18n)
 * Supports English and Hindi with reactive subscriptions and localStorage persistence.
 */

const translations = {
  en: {
    system_title: 'Digital Grievance Redressal System',
    track_ticket: 'Track Grievance Ticket',
    search_placeholder: 'Enter Ticket Reference ID (e.g. TKT-2026-XXXX)',
    status: 'Status',
    department: 'Department',
    category: 'Category',
    urgency: 'Priority',
    created_at: 'Registered On',
    sla_deadline: 'SLA Deadline',
    resolution_notes: 'Resolution Summary',
    appeal_ticket: 'Dispute / Appeal Resolution',
    appeal_reason: 'Reason for dispute / appeal',
    appeal_submit: 'Submit Formal Appeal',
    appeal_pending: 'Under Dispute Review',
    feedback_title: 'Citizen Satisfaction Feedback',
    feedback_placeholder: 'Share your experience regarding the resolution quality...',
    submit_feedback: 'Submit Feedback & Close',
    escalation_tier: 'Escalation Tier',
    status_submitted: 'Submitted',
    status_in_progress: 'In Progress',
    status_resolved: 'Resolved',
    status_closed: 'Closed',
    status_disputed: 'Disputed (Under Appeal)',
    status_escalated: 'Escalated',
    language_toggle: 'Language',
    verified_secure: 'End-to-End Cryptographically Verified'
  },
  hi: {
    system_title: 'डिजिटल शिकायत निवारण प्रणाली',
    track_ticket: 'शिकायत टिकट ट्रैक करें',
    search_placeholder: 'टिकट संदर्भ संख्या दर्ज करें (उदा. TKT-2026-XXXX)',
    status: 'स्थिति',
    department: 'विभाग',
    category: 'श्रेणी',
    urgency: 'प्राथमिकता',
    created_at: 'पंजीकरण तिथि',
    sla_deadline: 'एसएलए समय सीमा',
    resolution_notes: 'निवारण सारांश',
    appeal_ticket: 'समाधान पर अपील / विवाद दर्ज करें',
    appeal_reason: 'अपील / विवाद का कारण',
    appeal_submit: 'औपचारिक अपील जमा करें',
    appeal_pending: 'समीक्षाधीन अपील',
    feedback_title: 'नागरिक संतुष्टि प्रतिक्रिया (फीडबैक)',
    feedback_placeholder: 'समाधान की गुणवत्ता पर अपना अनुभव साझा करें...',
    submit_feedback: 'फीडबैक सबमिट करें और बंद करें',
    escalation_tier: 'एस्केलेशन स्तर',
    status_submitted: 'जमा किया गया',
    status_in_progress: 'प्रगति पर है',
    status_resolved: 'हल हो गया',
    status_closed: 'बंद किया गया',
    status_disputed: 'विवादित (अपील में)',
    status_escalated: 'उच्च स्तर पर भेजा गया',
    language_toggle: 'भाषा',
    verified_secure: 'क्रिप्टोग्राफिक रूप से सत्यापित और सुरक्षित'
  }
};

let currentLang = 'en';
try {
  const saved = localStorage.getItem('dg_lang');
  if (saved && (saved === 'en' || saved === 'hi')) {
    currentLang = saved;
  }
} catch {
  // SSR or test fallback
}

const listeners = new Set();

export const setLanguage = (lang) => {
  if (lang === 'en' || lang === 'hi') {
    currentLang = lang;
    try {
      localStorage.setItem('dg_lang', lang);
    } catch {
      // Ignored
    }
    listeners.forEach(fn => fn(currentLang));
  }
};

export const getLanguage = () => currentLang;

export const t = (key) => {
  const langDict = translations[currentLang] || translations.en;
  return langDict[key] || translations.en[key] || key;
};

export const useTranslation = () => {
  return {
    t,
    currentLang,
    setLanguage
  };
};

export default { t, setLanguage, getLanguage, useTranslation };
