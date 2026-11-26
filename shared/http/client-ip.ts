import type { NextRequest } from 'next/server';

/**
 * The IP of whoever sent the request, for per-IP limits. Vercel overwrites `x-forwarded-for` (and
 * sets `x-real-ip`) with the client it saw, so a value sent by the client doesn't survive there;
 * the first entry is the client, any later ones are proxies. Without either header there is no
 * IP: callers skip the per-IP check rather than counting every such request as one client.
 */
export function clientIp(req: Pick<NextRequest, 'headers'>): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return req.headers.get('x-real-ip')?.trim() || undefined;
}
