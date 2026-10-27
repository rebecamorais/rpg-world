import { Cinzel, Geist_Mono, Inter } from 'next/font/google';

// The site's fonts, shared by the root layout and the global 404 (which skips the layouts)
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

/** Class names that define the --font-* variables globals.css reads. */
export const fontVariables = `${inter.variable} ${cinzel.variable} ${geistMono.variable}`;
