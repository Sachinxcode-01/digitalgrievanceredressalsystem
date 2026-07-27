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
export const SANDBOX_DOMAINS = (import.meta.env.VITE_SANDBOX_EMAIL_DOMAINS || '@resolve.now,@resolvenow.demo,@demo.com,@gmail.com,@test.com')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/**
 * Returns true when the given email belongs to a sandbox/demo account or should
 * route through local Express/JWT authentication instead of Clerk.
 * @param {string} email
 * @returns {boolean}
 */
export const isSandboxAccount = (email) => {
  if (!email || typeof email !== 'string') return true;
  const normalized = email.toLowerCase().trim();
  if (normalized.includes('demo') || normalized.includes('admin') || normalized.includes('student') || normalized.includes('officer')) {
    return true;
  }
  return SANDBOX_DOMAINS.some((domain) => normalized.endsWith(domain));
};
