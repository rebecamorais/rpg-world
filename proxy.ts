import { type NextRequest, NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';

import { routing } from './src/i18n/routing';

const handleI18n = createMiddleware(routing);

// Signed in, these pages only send you on: straight to the characters
const SIGNED_OUT_ONLY = new Set(['/login', '/register']);

/**
 * Runs before every page:
 * 1. Picks the language (NEXT_LOCALE cookie, else Accept-Language) and rewrites the page to
 *    /<locale>/... internally, so the public pages can be prebuilt per language with clean URLs.
 * 2. Refreshes an expired Supabase session. Server Components cannot write cookies, so this is the
 *    only place the refreshed JWT reaches the browser. Route protection stays in the layouts.
 */
export async function proxy(request: NextRequest) {
  let response = handleI18n(request);

  // Optimization: only refresh the session if there is one; no round trip for anonymous visitors
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  if (!hasSession) return response;

  const refreshed: { name: string; value: string; options: CookieOptions }[] = [];
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          refreshed.push(...cookiesToSet);
        },
      },
    },
  );

  // Refreshes an expired token and verifies it locally (cached JWKS): no Auth round trip while
  // the token is valid
  const { data } = await supabaseAuth.auth.getClaims();

  if (data?.claims && SIGNED_OUT_ONLY.has(request.nextUrl.pathname)) {
    response = NextResponse.redirect(new URL('/characters', request.url));
  }

  for (const { name, value, options } of refreshed) response.cookies.set(name, value, options);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2)$).*)',
  ],
};
