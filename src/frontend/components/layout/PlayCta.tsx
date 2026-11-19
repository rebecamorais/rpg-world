'use client';

import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { useSession } from '@frontend/hooks/useSession';

type PlayCtaProps = {
  /** The main button signed out: it creates the account. */
  startLabel: string;
  /** The main button signed in, to the characters. Left out: `startLabel`. */
  signedInLabel?: string;
  demoLabel: string;
};

/**
 * The big pair of buttons of the public pages (the home's hero, the end of Features): sign up, or
 * the characters for whoever is signed in, and the demo. The pages are prebuilt, so the session is
 * the browser's. On phones the two are stacked at full width.
 */
export function PlayCta({ startLabel, signedInLabel = startLabel, demoLabel }: PlayCtaProps) {
  const locale = useLocale();
  const { status } = useSession();

  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
      <Button asChild size="xl">
        {status === 'signed-in' ? (
          <Link href="/characters">{signedInLabel}</Link>
        ) : (
          <Link href={localizedHref('/register', locale)}>{startLabel}</Link>
        )}
      </Button>
      <Button asChild size="xl" variant="secondary">
        <Link href="/demo">{demoLabel}</Link>
      </Button>
    </div>
  );
}
