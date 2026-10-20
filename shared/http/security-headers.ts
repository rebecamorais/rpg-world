/**
 * Security headers sent with every response (wired in `next.config.ts`).
 *
 * The CSP follows the "without nonces" approach from the Next.js CSP guide: nonces would force
 * every page into dynamic rendering. Inline scripts (Next.js bootstrap) and inline styles
 * (Tailwind/Radix) therefore need 'unsafe-inline'.
 */

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const GITHUB_SPONSORS_ORIGIN = 'https://github.com';
// Cloudflare Web Analytics (cookieless visit counts): Cloudflare injects the beacon script, which
// reports back to cloudflareinsights.com
const CLOUDFLARE_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';
const CLOUDFLARE_INSIGHTS_REPORT = 'https://cloudflareinsights.com';

// Sources the Vercel toolbar (comments, feedback) loads on preview deployments
const VERCEL_TOOLBAR = {
  'script-src': ['https://vercel.live'],
  'style-src': ['https://vercel.live'],
  'img-src': ['https://vercel.live', 'https://vercel.com'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'frame-src': ['https://vercel.live'],
};

export interface SecurityHeadersOptions {
  /** `NEXT_PUBLIC_SUPABASE_URL`: the browser client calls Auth/Storage/Realtime there. */
  supabaseUrl: string | undefined;
  isDev: boolean;
  /** `VERCEL_ENV`: set on Vercel deployments (always https), undefined elsewhere. */
  vercelEnv: string | undefined;
}

function supabaseOrigins(supabaseUrl: string | undefined): string[] {
  if (!supabaseUrl) return [];
  const url = new URL(supabaseUrl);
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return [url.origin, `${wsProtocol}//${url.host}`];
}

export function buildContentSecurityPolicy({
  supabaseUrl,
  isDev,
  vercelEnv,
}: SecurityHeadersOptions) {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // 'unsafe-eval' is only needed by React's dev tooling
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      TURNSTILE_ORIGIN,
      CLOUDFLARE_INSIGHTS_SCRIPT,
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Avatars can be any http(s) URL the user typed in the profile; in dev the image proxy may
    // run on another localhost port over plain http
    'img-src': ["'self'", 'blob:', 'data:', 'https:', ...(isDev ? ['http:'] : [])],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...supabaseOrigins(supabaseUrl), CLOUDFLARE_INSIGHTS_REPORT],
    'frame-src': [TURNSTILE_ORIGIN, GITHUB_SPONSORS_ORIGIN],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  if (vercelEnv === 'preview') {
    for (const [name, sources] of Object.entries(VERCEL_TOOLBAR)) {
      directives[name].push(...sources);
    }
  }

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  // Only where the site is known to be served over https: a local `next start` talks to the
  // local Supabase over plain http
  if (vercelEnv) policy.push('upgrade-insecure-requests');

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
