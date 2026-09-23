import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes';

/**
 * Enterprise Application Entry Point.
 * Composes application-wide providers and modular routing.
 */
export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
