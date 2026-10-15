/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import type { Metadata } from 'next';
import { Cinzel, Geist_Mono, Inter } from 'next/font/google';

import { getLocale, getMessages, getTimeZone, getTranslations } from 'next-intl/server';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import Providers from '@frontend/components/providers/Providers';
import { Toaster } from '@frontend/components/ui/sonner';

import './globals.css';

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
    metadataBase: new URL('https://rpgworldapp.com'),
    title: { default: t('title'), template: '%s · RPG World' },
    description: t('description'),
    applicationName: 'RPG World',
    openGraph: {
      type: 'website',
      siteName: 'RPG World',
      title: t('title'),
      description: t('description'),
      url: '/',
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
      images: ['/logo/dice-fire.png'],
    },
    twitter: { card: 'summary', title: t('title'), description: t('description') },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
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
      </body>
    </html>
  );
}
