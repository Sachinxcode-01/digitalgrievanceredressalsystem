# Phase 9 Research: Institutional SSO Integration

## Current Implementations
- Uses Supabase Auth for OTP and Magic Links.
- Supabase Auth supports generic OAuth providers natively out of the box.
- The `LoginPage.jsx` already contains UI buttons and logic for `handleSocialLogin('google')` and `handleSocialLogin('azure')`.
- The `App.jsx` already listens to `supabase.auth.onAuthStateChange` to automatically handle callback tokens and session management.

## Findings
- Code-level implementation for OAuth is already complete.
- The remaining tasks are purely administrative and documentary:
  1. We need to document how an administrator enables Google/Azure providers in their Supabase Dashboard.
  2. The OAuth Redirect URIs need to be defined in the documentation so the deployment works properly in production.
