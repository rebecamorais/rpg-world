import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, securityHeaders } from './security-headers';

const directive = (csp: string, name: string) =>
  csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `)) ?? '';

const prod = { supabaseUrl: 'https://abc.supabase.co', isDev: false };

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

  it('upgrades insecure requests only in production', () => {
    expect(buildContentSecurityPolicy(prod)).toContain('upgrade-insecure-requests');
    expect(buildContentSecurityPolicy({ ...prod, isDev: true })).not.toContain(
      'upgrade-insecure-requests',
    );
  });

  it('works without a Supabase URL', () => {
    const csp = buildContentSecurityPolicy({ supabaseUrl: undefined, isDev: false });
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
