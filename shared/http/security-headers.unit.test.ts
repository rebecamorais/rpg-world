import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, securityHeaders } from './security-headers';

const directive = (csp: string, name: string) =>
  csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `)) ?? '';

const prod = { supabaseUrl: 'https://abc.supabase.co', isDev: false, vercelEnv: 'production' };
const localBuild = { supabaseUrl: 'http://127.0.0.1:54321', isDev: false, vercelEnv: undefined };

describe('buildContentSecurityPolicy', () => {
  it('lets the browser talk to Supabase over HTTP and WebSocket', () => {
    const csp = buildContentSecurityPolicy(prod);
    expect(directive(csp, 'connect-src')).toContain('https://abc.supabase.co');
    expect(directive(csp, 'connect-src')).toContain('wss://abc.supabase.co');
  });

  it('allows the Turnstile script and iframe', () => {
    const csp = buildContentSecurityPolicy(prod);
    expect(directive(csp, 'script-src')).toContain('https://challenges.cloudflare.com');
    expect(directive(csp, 'frame-src')).toContain('https://challenges.cloudflare.com');
  });

  it('forbids framing, plugins and foreign form targets', () => {
    const csp = buildContentSecurityPolicy(prod);
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'form-action')).toBe("form-action 'self'");
  });

  it("only allows 'unsafe-eval' in development (React needs it for debugging)", () => {
    expect(directive(buildContentSecurityPolicy(prod), 'script-src')).not.toContain('unsafe-eval');
    expect(directive(buildContentSecurityPolicy({ ...prod, isDev: true }), 'script-src')).toContain(
      "'unsafe-eval'",
    );
  });

  it('upgrades insecure requests only on Vercel deployments, which are always https', () => {
    expect(buildContentSecurityPolicy(prod)).toContain('upgrade-insecure-requests');
    expect(buildContentSecurityPolicy({ ...prod, vercelEnv: 'preview' })).toContain(
      'upgrade-insecure-requests',
    );
    // `next build && next start` on a machine talking to the local http Supabase
    expect(buildContentSecurityPolicy(localBuild)).not.toContain('upgrade-insecure-requests');
  });

  it('allows the Vercel toolbar only on preview deployments', () => {
    const preview = buildContentSecurityPolicy({ ...prod, vercelEnv: 'preview' });
    expect(directive(preview, 'script-src')).toContain('https://vercel.live');
    expect(directive(preview, 'frame-src')).toContain('https://vercel.live');
    expect(directive(preview, 'connect-src')).toContain('https://vercel.live');
    expect(directive(preview, 'connect-src')).toContain('wss://ws-us3.pusher.com');
    expect(directive(preview, 'font-src')).toContain('https://assets.vercel.com');

    expect(buildContentSecurityPolicy(prod)).not.toContain('vercel.live');
    expect(buildContentSecurityPolicy(localBuild)).not.toContain('vercel.live');
  });

  it('works without a Supabase URL', () => {
    const csp = buildContentSecurityPolicy({ ...prod, supabaseUrl: undefined });
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self'");
  });
});

describe('securityHeaders', () => {
  it('sets the baseline hardening headers', () => {
    const headers = Object.fromEntries(securityHeaders(prod).map((h) => [h.key, h.value]));
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Content-Security-Policy']).toBe(buildContentSecurityPolicy(prod));
  });
});
