/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import type { Metadata } from 'next';
import { Cinzel, Geist_Mono, Inter } from 'next/font/google';
import Script from 'next/script';

import { Analytics } from '@vercel/analytics/next';
import { getLocale, getMessages, getTimeZone, getTranslations } from 'next-intl/server';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import Providers from '@frontend/components/providers/Providers';
import { Toaster } from '@frontend/components/ui/sonner';
import { clientMessages } from '@frontend/constants/client-messages';
import { SITE_URL } from '@frontend/constants/site';

import './globals.css';

// Cloudflare Web Analytics (cookieless visit counts). The token is public: it only identifies the
// site. Production only, so local runs, previews and the e2e suite don't count as visits. Same for
// Vercel Web Analytics, whose script is served same-origin from /_vercel/insights (covered by the CSP).
const CLOUDFLARE_BEACON_TOKEN = '356fc3bfc2dd43c4b8f065945a42eb32';
const isProduction = process.env.VERCEL_ENV === 'production';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo');
  const locale = await getLocale();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: '%s · RPG World' },
    description: t('description'),
    applicationName: 'RPG World',
    // No title or url here: pages that don't set their own openGraph inherit this object as
    // is, and a fixed one would label every shared link as the home page. Crawlers fall back
    // to the page's <title> and to the URL being shared.
    openGraph: {
      type: 'website',
      siteName: 'RPG World',
      description: t('description'),
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      description: t('description'),
      images: ['/og-image.jpg'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Only what client components read goes to the browser on every page
  const messages = clientMessages(await getMessages());
  const timeZone = await getTimeZone();
  const t = await getTranslations('common');

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${cinzel.variable} ${geistMono.variable} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <a
          href="#main-content"
          className="bg-primary text-primary-on focus-ring sr-only z-[100] rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('skipToContent')}
        </a>
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          <GlobalHeader />
          {/* The page's only main landmark; pages and layouts below use plain divs */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex min-h-[calc(100vh-var(--header-height)+20px)] flex-1 flex-col outline-none"
          >
            {children}
          </main>
          <Footer />
        </Providers>
        <Toaster />
        {isProduction ? (
          <>
            <Script
              src="https://static.cloudflareinsights.com/beacon.min.js"
              data-cf-beacon={JSON.stringify({ token: CLOUDFLARE_BEACON_TOKEN })}
              strategy="afterInteractive"
            />
            <Analytics />
          </>
        ) : null}
      </body>
    </html>
  );
}
