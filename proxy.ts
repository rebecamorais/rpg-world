import { type NextRequest, NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';

import { routing } from './src/i18n/routing';

const handleI18n = createMiddleware(routing);

// Signed in, these pages only send you on: straight to the characters
const SIGNED_OUT_ONLY = new Set(['/login', '/register']);
const IMAGES_HOST = 'images.rpgworldapp.com';

/**
 * Runs before every page:
 * 1. Refreshes an expired Supabase session. Server Components cannot write cookies, so this is the
 *    only place the refreshed JWT reaches the browser. Route protection stays in the layouts.
 * 2. Picks the language (NEXT_LOCALE cookie, else Accept-Language) and rewrites the page to
 *    /<locale>/... internally, so the public pages can be prebuilt per language with clean URLs.
 */
export async function proxy(request: NextRequest) {
  // Avatars served on their own host (next.config.ts rewrites it to /api/images): never localized
  if (request.headers.get('host') === IMAGES_HOST) return NextResponse.next();

  // Optimization: only refresh the session if there is one; no round trip for anonymous visitors
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  if (!hasSession) return handleI18n(request);

  // Refreshed first, written into the request too: the language rewrite copies the request
  // headers, so the Server Components of this same request read the new session
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          refreshed.push(...cookiesToSet);
        },
      },
    },
  );

  // Refreshes an expired token and verifies it locally (cached JWKS): no Auth round trip while
  // the token is valid
  const { data } = await supabaseAuth.auth.getClaims();

  let response = handleI18n(request);
  if (data?.claims && SIGNED_OUT_ONLY.has(request.nextUrl.pathname)) {
    const redirect = NextResponse.redirect(new URL('/characters', request.url));
    // Keeps the language cookie next-intl may have just corrected
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  }

  for (const { name, value, options } of refreshed) response.cookies.set(name, value, options);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2)$).*)',
  ],
};
