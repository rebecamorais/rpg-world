/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { type LocaleParams, routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

import { AnalyticsScripts } from '@frontend/components/providers/AnalyticsScripts';
import Providers from '@frontend/components/providers/Providers';
import { Toaster } from '@frontend/components/ui/sonner';
import { clientMessages } from '@frontend/constants/client-messages';
import { SITE_URL } from '@frontend/constants/site';
import { fontVariables } from '@frontend/lib/fonts';
import { THEME_SCRIPT } from '@frontend/lib/theme';

import '../globals.css';

// Cloudflare and Vercel Web Analytics (AnalyticsScripts). Production only, so local runs, previews and
// the e2e suite don't count as visits. Vercel's script is served same-origin from /_vercel/insights
// (covered by the CSP).
const isProduction = process.env.VERCEL_ENV === 'production';

/** Every page exists once per language; the proxy picks which one a visitor gets. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

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
  params,
}: Readonly<LocaleParams & { children: React.ReactNode }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Lets the pages below render statically, without reading the locale from the request
  setRequestLocale(locale);

  // Only what client components read goes to the browser on every page
  const messages = clientMessages(await getMessages());
  const t = await getTranslations('common');

  return (
    // The inline script below may set data-session before React hydrates
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Prebuilt pages render signed out for everyone. With a session cookie, hide the
            signed-out buttons until the header confirms the session (no flash of "Sign in"). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(/(?:^|;\\s*)sb-/.test(document.cookie))document.documentElement.dataset.session='pending'`,
          }}
        />
        {/* Sets the chosen theme from its cookie before first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${fontVariables} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <a
          href="#main-content"
          className="bg-primary text-primary-on focus-ring sr-only z-[100] rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('skipToContent')}
        </a>
        {/* Header, main and footer come from the (public) and (app) layouts */}
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
        <Toaster />
        <AnalyticsScripts enabled={isProduction} />
      </body>
    </html>
  );
}
