import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { AppIcon } from '@frontend/components/ui/icon';
import { fontVariables } from '@frontend/lib/fonts';

import './globals.css';

export const metadata: Metadata = { title: 'Page not found · Página não encontrada' };

/**
 * The 404 for any URL no route matches. The root layout is app/[locale], which a 404 can't
 * compose with, so this page brings its own document, styles and fonts. It doesn't know the
 * visitor's language, so it says it in both.
 */
export default async function GlobalNotFound() {
  const [en, pt] = await Promise.all([
    getTranslations({ locale: 'en', namespace: 'notFound' }),
    getTranslations({ locale: 'pt', namespace: 'notFound' }),
  ]);

  return (
    <html lang="en">
      <body
        className={`${fontVariables} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <header className="border-border bg-card flex h-[var(--header-height)] items-center border-b px-4 sm:px-8">
          <Link href="/" className="focus-ring rounded-md" aria-label={en('home')}>
            <AppIcon name="dice-fire" variant="game" size={40} className="text-primary-flare" />
          </Link>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8 text-center">
          {[en, pt].map((t, index) => (
            <section key={index} lang={index === 0 ? 'en' : 'pt'} className="flex flex-col gap-3">
              <h1 className="text-title">{t('title')}</h1>
              <p className="text-muted-foreground">{t('description')}</p>
              <Link href="/" className="text-primary-flare underline">
                {t('home')}
              </Link>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}
