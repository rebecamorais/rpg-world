import { type NextRequest, NextResponse } from 'next/server';

import { type CookieOptions, createServerClient } from '@supabase/ssr';

/**
 * This middleware exists solely to refresh expired Supabase sessions.
 * Route protection is handled at the layout level via app/(dashboard)/layout.tsx.
 *
 * Technical reason: Server Components cannot write cookies (read-only during render).
 * The Supabase client here is the only place that can write the refreshed JWT back
 * to the browser via HTTP response headers.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options }),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Optimization: Only refresh session if cookies are present.
  // This avoids a network round-trip to Supabase for anonymous users.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  if (hasSession) {
    await supabaseAuth.auth.getUser();
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
