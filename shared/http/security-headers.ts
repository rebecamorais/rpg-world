/**
 * Security headers sent with every response (wired in `next.config.ts`).
 *
 * The CSP follows the "without nonces" approach from the Next.js CSP guide: nonces would force
 * every page into dynamic rendering. Inline scripts (Next.js bootstrap) and inline styles
 * (Tailwind/Radix) therefore need 'unsafe-inline'.
 */

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const GITHUB_SPONSORS_ORIGIN = 'https://github.com';

export interface SecurityHeadersOptions {
  /** `NEXT_PUBLIC_SUPABASE_URL`: the browser client calls Auth/Storage/Realtime there. */
  supabaseUrl: string | undefined;
  isDev: boolean;
}

function supabaseOrigins(supabaseUrl: string | undefined): string[] {
  if (!supabaseUrl) return [];
  const url = new URL(supabaseUrl);
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return [url.origin, `${wsProtocol}//${url.host}`];
}

export function buildContentSecurityPolicy({ supabaseUrl, isDev }: SecurityHeadersOptions) {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-eval' is only needed by React's dev tooling
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      TURNSTILE_ORIGIN,
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Avatars can be any http(s) URL the user typed in the profile; in dev the image proxy may
    // run on another localhost port over plain http
    'img-src': ["'self'", 'blob:', 'data:', 'https:', ...(isDev ? ['http:'] : [])],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...supabaseOrigins(supabaseUrl)],
    'frame-src': [TURNSTILE_ORIGIN, GITHUB_SPONSORS_ORIGIN],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (!isDev) policy.push('upgrade-insecure-requests');

  return policy.join('; ');
}

export function securityHeaders(options: SecurityHeadersOptions) {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(options) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Legacy equivalent of frame-ancestors 'none' for older browsers
    { key: 'X-Frame-Options', value: 'DENY' },
  ];
}
