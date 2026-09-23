import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const LandingPage = React.lazy(() => import('../pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const PublicStatusPage = React.lazy(() => import('../pages/public/PublicTrackingPage').then(m => ({ default: m.PublicStatusPage })));
const StatusPage = React.lazy(() => import('../pages/public/StatusPage').then(m => ({ default: m.StatusPage })));
const PublicTransparencyPage = React.lazy(() => import('../pages/public/PublicTransparencyPage').then(m => ({ default: m.PublicTransparencyPage })));
const PublicHashVerificationPage = React.lazy(() => import('../pages/public/PublicHashVerificationPage'));
const KnowledgeBasePage = React.lazy(() => import('../pages/public/KnowledgeBasePage'));
const PrivacyPolicyPage = React.lazy(() => import('../pages/public/PrivacyPolicyPage'));
const CitizenCharterPage = React.lazy(() => import('../pages/public/CitizenCharterPage'));
const FeedbackHubPage = React.lazy(() => import('../pages/public/FeedbackHubPage'));
const OfficerDirectoryPage = React.lazy(() => import('../pages/public/OfficerDirectoryPage'));
const WhistleblowerPortalPage = React.lazy(() => import('../pages/public/WhistleblowerPortalPage'));
const EmergencySafetyPage = React.lazy(() => import('../pages/public/EmergencySafetyPage'));

export const getPublicRoutes = () => (
  <>
    <Route path="/" element={<LandingPage />} />
    <Route path="/public-status" element={<PublicStatusPage />} />
    <Route path="/track" element={<Navigate to="/public-status" replace />} />
    <Route path="/status" element={<StatusPage />} />
    <Route path="/system-status" element={<Navigate to="/status" replace />} />
    <Route path="/transparency" element={<PublicTransparencyPage />} />
    <Route path="/leaderboard" element={<PublicTransparencyPage />} />
    <Route path="/scorecard" element={<PublicTransparencyPage />} />
    <Route path="/verify-hash" element={<PublicHashVerificationPage />} />
    <Route path="/verify-proof" element={<PublicHashVerificationPage />} />
    <Route path="/proof" element={<Navigate to="/verify-proof" replace />} />
    <Route path="/hash-inspector" element={<PublicHashVerificationPage />} />
    <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
    <Route path="/help" element={<Navigate to="/knowledge-base" replace />} />
    <Route path="/faq" element={<Navigate to="/knowledge-base" replace />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
    <Route path="/terms" element={<CitizenCharterPage />} />
    <Route path="/citizen-charter" element={<Navigate to="/terms" replace />} />
    <Route path="/charter" element={<Navigate to="/terms" replace />} />
    <Route path="/feedback" element={<FeedbackHubPage />} />
    <Route path="/csat" element={<Navigate to="/feedback" replace />} />
    <Route path="/survey" element={<Navigate to="/feedback" replace />} />
    <Route path="/officers" element={<OfficerDirectoryPage />} />
    <Route path="/directory" element={<Navigate to="/officers" replace />} />
    <Route path="/contact" element={<Navigate to="/officers" replace />} />
    <Route path="/whistleblower" element={<WhistleblowerPortalPage />} />
    <Route path="/confidential" element={<Navigate to="/whistleblower" replace />} />
    <Route path="/vault" element={<Navigate to="/whistleblower" replace />} />
    <Route path="/emergency" element={<EmergencySafetyPage />} />
    <Route path="/safety" element={<Navigate to="/emergency" replace />} />
    <Route path="/sos" element={<Navigate to="/emergency" replace />} />
  </>
);
