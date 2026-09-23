import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useTheme } from '../app/providers/ThemeProvider';
import { PageLoader } from '../components/feedback/PageLoader';
import { SetupError } from '../components/feedback/SetupError';
import { isMisconfigured } from '../lib/supabase';

// System UI Overlays
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { AccessibilityDock } from '../components/ui/AccessibilityDock';
import { CommandPalette } from '../components/ui/CommandPalette';
import { AiOmbudsmanWidget } from '../components/ui/AiOmbudsmanWidget';
import { PwaInstallPrompt } from '../components/ui/PwaInstallPrompt';

// Domain Route Modules
import { getPublicRoutes } from './publicRoutes';
import { getAuthRoutes } from './authRoutes';
import { getGrievanceRoutes } from './grievanceRoutes';
import { getOfficerRoutes } from './officerRoutes';
import { getAdminRoutes } from './adminRoutes';
import { getSettingsAndSystemRoutes } from './settingsRoutes';

/**
 * Enterprise Application Routing Orchestrator.
 * Aggregates all modular route domains with role guards and layout shells.
 */
export const AppRoutes = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (isMisconfigured) {
    return <SetupError />;
  }

  const routeContext = { user, logout, theme, setTheme };

  return (
    <Router>
      <OfflineBanner />
      <AccessibilityDock />
      <CommandPalette />
      <AiOmbudsmanWidget />
      <PwaInstallPrompt />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {getPublicRoutes()}
          {getAuthRoutes()}
          {getGrievanceRoutes(routeContext)}
          {getOfficerRoutes(routeContext)}
          {getAdminRoutes(routeContext)}
          {getSettingsAndSystemRoutes(routeContext)}
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
