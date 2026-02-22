import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import GlobalHeader from '@/frontend/components/GlobalHeader';
import LanguageProvider from '@/frontend/components/LanguageProvider';
import QueryProvider from '@/frontend/components/QueryProvider';
import { Toaster } from '@/frontend/components/ui/sonner';
import { TooltipProvider } from '@/frontend/components/ui/tooltip';
import { UserProvider } from '@/frontend/context/UserContext';

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
        <QueryProvider>
          <LanguageProvider>
            <UserProvider>
              <TooltipProvider>
                <GlobalHeader />
                {children}
              </TooltipProvider>
            </UserProvider>
          </LanguageProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
