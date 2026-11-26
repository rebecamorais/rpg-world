'use client';

import { useEffect } from 'react';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { fontVariables } from '@frontend/lib/fonts';
import { THEME_SCRIPT } from '@frontend/lib/theme';

import { common as enCommon, errorPage as enErrorPage } from '../messages/en.json';
import { common as ptCommon, errorPage as ptErrorPage } from '../messages/pt.json';
import './globals.css';

const LANGUAGES = [
  { lang: 'en', page: enErrorPage, retry: enCommon.retry },
  { lang: 'pt', page: ptErrorPage, retry: ptCommon.retry },
] as const;

/** The id Next gives a server error, the same one in the server logs. */
function digestOf(error: unknown): string | undefined {
  if (!(error instanceof Error) || !('digest' in error)) return undefined;
  return typeof error.digest === 'string' && error.digest ? error.digest : undefined;
}

/**
 * The root layout (app/[locale]/layout.tsx) itself failed: what it loads is gone, the language and
 * the translations with it. Like global-not-found, this page brings its own document, styles,
 * fonts and theme, and says it in English and Portuguese at once. A Client Component, so the copy
 * comes straight from the message files (only the keys it reads), not from next-intl.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = digestOf(error);

  useEffect(() => {
    // Still in the browser's console, for whoever is debugging
    console.error(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the chosen theme from its cookie before first paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <title>{`${enErrorPage.title} · ${ptErrorPage.title}`}</title>
      </head>
      <body
        className={`${fontVariables} bg-background text-foreground flex min-h-screen flex-col antialiased`}
      >
        <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8 text-center">
          <AppIcon name="TriangleAlert" size={40} className="text-muted-foreground" aria-hidden />
          {LANGUAGES.map(({ lang, page, retry: retryLabel }) => (
            <section key={lang} lang={lang} className="flex max-w-lg flex-col items-center gap-3">
              <h1 className="text-title">{page.title}</h1>
              <p className="text-muted-foreground">{page.description}</p>
              <Button onClick={() => retry()}>
                <AppIcon name="RotateCcw" size={16} aria-hidden />
                {retryLabel}
              </Button>
            </section>
          ))}
          {digest && <p className="text-caption text-muted-foreground font-mono">{digest}</p>}
        </main>
      </body>
    </html>
  );
}
