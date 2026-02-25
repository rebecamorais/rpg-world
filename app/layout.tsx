import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import GlobalHeader from '@/frontend/components/GlobalHeader';
import Providers from '@/frontend/components/Providers';
import { Toaster } from '@/frontend/components/ui/sonner';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <Providers>
          <GlobalHeader />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
