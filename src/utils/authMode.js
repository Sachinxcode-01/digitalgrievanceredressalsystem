/**
 * Auth-mode helpers.
 *
 * The app supports two authentication backends:
 *   - Clerk (default) for real users (Google/Microsoft SSO, email, MFA).
 *   - A local Express/JWT + OTP flow for "sandbox" accounts used in local
 *     development and QA, so testers don't need provisioned Clerk users.
 *
 * A sandbox account is identified purely by its email domain. Configure the
 * domain(s) via VITE_SANDBOX_EMAIL_DOMAINS (comma-separated), e.g.
 * "@resolve.now,@sandbox.test". Defaults to "@resolve.now".
 *
 * IMPORTANT: never hardcode personal/individual email addresses here. Add extra
 * test accounts through the env variable instead.
 */
export const SANDBOX_DOMAINS = (import.meta.env.VITE_SANDBOX_EMAIL_DOMAINS || '@resolve.now')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/**
 * Returns true when the given email belongs to a sandbox domain and should be
 * routed through the local Express/JWT + OTP auth flow instead of Clerk.
 * @param {string} email
 * @returns {boolean}
 */
export const isSandboxAccount = (email) => {
  if (typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return SANDBOX_DOMAINS.some((domain) => normalized.endsWith(domain));
};
