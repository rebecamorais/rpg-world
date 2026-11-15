import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { AppIcon } from '@frontend/components/ui/icon';
import { fontVariables } from '@frontend/lib/fonts';
import { THEME_SCRIPT } from '@frontend/lib/theme';

import './globals.css';

export const metadata: Metadata = { title: 'Page not found · Página não encontrada' };

/**
 * The 404 for any URL no route matches. The root layout is app/[locale], which a 404 can't
 * compose with, so this page brings its own document, styles and fonts. It doesn't know the
 * visitor's language, so it says it in both. Signed in, the way out in the page is the app (the
 * characters), not the landing page; the logo goes home, as in the site's header.
 */
export default async function GlobalNotFound() {
  const [en, pt, user] = await Promise.all([
    getTranslations({ locale: 'en', namespace: 'notFound' }),
    getTranslations({ locale: 'pt', namespace: 'notFound' }),
    // A failed check is a signed-out visitor: the 404 must still render
    getApi()
      .then(({ authApi }) => authApi.getSessionUser())
      .catch(() => null),
  ]);
  const signedIn = Boolean(user);
  const home = signedIn ? '/characters' : '/';
  const homeLabel = signedIn ? 'characters' : 'home';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the chosen theme from its cookie before first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
              <Link href={home} className="text-primary-flare underline">
                {t(homeLabel)}
              </Link>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}
