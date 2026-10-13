/**
 * Returns `next` as a same-origin path, or `fallback` when it would leave the site.
 * Resolving against the origin (instead of string checks) also catches tricks the URL
 * parser normalizes, such as `//evil.com`, `/\evil.com` or embedded tabs.
 */
export function safeRedirectPath(next: string | null, origin: string, fallback: string): string {
  if (!next) return fallback;

  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
