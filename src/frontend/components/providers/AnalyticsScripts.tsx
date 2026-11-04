'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { Analytics } from '@vercel/analytics/next';

// Cloudflare Web Analytics (cookieless visit counts). The token is public: it only identifies the
// site.
const CLOUDFLARE_BEACON_TOKEN = '356fc3bfc2dd43c4b8f065945a42eb32';

// Pages whose address carries a credential. The scripts are not loaded there at all, so the token
// never depends on what a third-party script strips. The path may come with or without the
// language segment (the proxy rewrites to /<locale>/...), so the end is what counts.
const NO_ANALYTICS_SUFFIX = '/delete-account';

export function isAnalyticsPath(pathname: string | null): boolean {
  return !pathname?.replace(/\/$/, '').endsWith(NO_ANALYTICS_SUFFIX);
}

/**
 * Cloudflare and Vercel analytics, off on the pages of `NO_ANALYTICS_SUFFIX`. A client component
 * reading the pathname, so the root layout stays static. `enabled` is production only (decided on
 * the server: VERCEL_ENV isn't available in the browser).
 */
export function AnalyticsScripts({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  if (!enabled || !isAnalyticsPath(pathname)) return null;

  return (
    <>
      <Script
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={JSON.stringify({ token: CLOUDFLARE_BEACON_TOKEN })}
        strategy="afterInteractive"
      />
      <Analytics />
    </>
  );
}
