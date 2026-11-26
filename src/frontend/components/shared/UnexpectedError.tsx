'use client';

import { useEffect, useRef } from 'react';

import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import { MainContent } from '@frontend/components/layout/PageFrame';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';

export interface ErrorBoundaryProps {
  /** What was thrown. From a Server Component, an Error with only a generic message and a digest. */
  error: unknown;
  /** Fetches and renders the segment again (Next's error.tsx prop). */
  retry: () => void;
}

/** The id Next gives a server error, the same one in the server logs. */
function digestOf(error: unknown): string | undefined {
  if (!(error instanceof Error) || !('digest' in error)) return undefined;
  return typeof error.digest === 'string' && error.digest ? error.digest : undefined;
}

/**
 * The page of an error.tsx: something failed that the page didn't handle. No technical detail;
 * a way to try again and to tell the team. The digest, when there is one, goes along as a
 * reference code, so a report can be matched to the server logs.
 * `main`: the error replaced the layout that holds the main landmark, so this one brings it.
 */
export function UnexpectedError({
  error,
  retry,
  main = false,
}: ErrorBoundaryProps & { main?: boolean }) {
  const t = useTranslations('errorPage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const digest = digestOf(error);

  useEffect(() => {
    // Still in the browser's console, for whoever is debugging
    console.error(error);
  }, [error]);

  // The page changed without a navigation, so the route announcer says nothing: the focus goes to
  // the heading, and a screen reader reads it. -1 lets the script focus it without a Tab stop
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const heading = root.current?.querySelector<HTMLElement>('h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, []);

  const content = (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      {/* The tab says it too, not the title of the page that failed */}
      <title>{`${t('title')} · ${tCommon('title')}`}</title>
      <EmptyState
        ref={root}
        icon="TriangleAlert"
        // The page's only heading
        titleAs="h1"
        title={t('title')}
        description={t('description')}
        className="w-full max-w-lg"
        action={
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => retry()}>
                <AppIcon name="RotateCcw" size={16} aria-hidden />
                {tCommon('retry')}
              </Button>
              <Button asChild variant="ghost">
                <Link href={localizedHref('/support', locale)}>{t('support')}</Link>
              </Button>
            </div>
            {digest && (
              <p className="text-caption text-muted-foreground">
                {t('reference', { code: digest })}
              </p>
            )}
          </div>
        }
      />
    </div>
  );

  return main ? <MainContent className="flex flex-1 flex-col">{content}</MainContent> : content;
}
