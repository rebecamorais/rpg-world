import { safeRedirectPath } from '@backend/shared/infrastructure/helpers/safe-redirect-path';

/** Read by the proxy when the person arrives at /characters signed in (see proxy.ts). */
export const NEXT_COOKIE = 'rw_next';

/**
 * The cookie that remembers where to go after signing in, from the login or sign-up page's
 * `?next=`: only same-site paths, for 30 minutes. Null when there's nothing (safe) to remember.
 */
export function nextCookie(search: string, origin: string): string | null {
  const next = new URLSearchParams(search).get('next');
  const path = safeRedirectPath(next, origin, '');
  if (!next || !path) return null;
  return `${NEXT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=1800; SameSite=Lax`;
}

/** Called by the (prebuilt) login and sign-up pages once they load in the browser. */
export function rememberNext() {
  const cookie = nextCookie(window.location.search, window.location.origin);
  if (cookie) document.cookie = cookie;
}
