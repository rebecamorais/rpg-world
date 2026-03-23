/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { getLocale, getMessages, getTimeZone } from 'next-intl/server';

import GlobalHeader from '@frontend/components/GlobalHeader';
import Providers from '@frontend/components/Providers';
import { Toaster } from '@frontend/components/ui/sonner';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RPG World',
  description: 'Gestão de fichas de personagens para RPG',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          <GlobalHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
