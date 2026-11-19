import { type NextRequest, NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';

import { PATHNAME_HEADER } from './shared/http/pathname-header';
import { safeRedirectPath } from './src/backend/shared/infrastructure/helpers/safe-redirect-path';
import { NEXT_COOKIE } from './src/frontend/lib/post-login-next';
import { LOCALIZED_PATHS, routing, withoutLocale } from './src/i18n/routing';

// The app: one address per page, the language from the cookie (/pt/x saves it and goes to /x)
const handleAppI18n = createMiddleware(routing);
// The public pages: English plain, Portuguese under /pt, so search engines index both. A plain
// path opened in Portuguese (cookie or browser) goes to its /pt address. The hreflang links come
// from the pages' metadata and the sitemap, not from a Link header.
const handlePublicI18n = createMiddleware({
  ...routing,
  localePrefix: 'as-needed',
  alternateLinks: false,
});

function handleI18n(request: NextRequest) {
  return LOCALIZED_PATHS.has(withoutLocale(request.nextUrl.pathname))
    ? handlePublicI18n(request)
    : handleAppI18n(request);
}

// Signed in, these pages only send you on: straight to the characters
const SIGNED_OUT_ONLY = new Set(['/login', '/register']);
const IMAGES_HOST = 'images.rpgworldapp.com';

/**
 * Runs before every page:
 * 1. Refreshes an expired Supabase session. Server Components cannot write cookies, so this is the
 *    only place the refreshed JWT reaches the browser. Route protection stays in the layouts.
 * 2. Picks the language (NEXT_LOCALE cookie, else Accept-Language) and rewrites the page to
 *    /<locale>/... internally, so the public pages can be prebuilt per language. The app's URLs
 *    never show the language; the public pages have one address per language (LOCALIZED_PATHS).
 */
export async function proxy(request: NextRequest) {
  // Avatars served on their own host (next.config.ts rewrites it to /api/images): never localized
  if (request.headers.get('host') === IMAGES_HOST) return NextResponse.next();

  // The path asked for, for Server Components (layouts don't get it): the dashboard sends someone
  // who hasn't picked a username to /choose-username and back here afterwards
  request.headers.set(PATHNAME_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

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
  let target = data?.claims ? signedInRedirect(request) : null;
  // The JWT of a deleted account stays valid until it expires. The app already treats it as signed
  // out and sends it to /login, so bouncing it back from there would be a redirect loop.
  if (target && SIGNED_OUT_ONLY.has(withoutLocale(request.nextUrl.pathname))) {
    const { data: profile, error } = await supabaseAuth
      .from('profile')
      .select('id')
      .eq('id', data!.claims.sub)
      .maybeSingle();
    if (!error && !profile) target = null;
  }
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    // The remembered link is used once
    if (target !== '/characters') redirect.cookies.delete(NEXT_COOKIE);
    // Keeps the language cookie next-intl may have just corrected
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response = redirect;
  }

  for (const { name, value, options } of refreshed) response.cookies.set(name, value, options);
  return response;
}

/**
 * Where a signed-in request goes instead: away from the sign-in pages, and from /characters (where
 * every sign-in flow lands) to the link the person opened before signing in, if one was kept.
 */
function signedInRedirect(request: NextRequest): string | null {
  const { pathname } = request.nextUrl;
  // /pt/login too: the sign-in pages have an address per language
  if (SIGNED_OUT_ONLY.has(withoutLocale(pathname))) return '/characters';
  if (pathname !== '/characters') return null;

  // Next already decodes cookie values
  const remembered = request.cookies.get(NEXT_COOKIE)?.value;
  if (!remembered) return null;
  const path = safeRedirectPath(remembered, request.nextUrl.origin, '');
  return path && path !== '/characters' ? path : null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_vercel|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2)$).*)',
  ],
};
