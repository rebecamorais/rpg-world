'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { useSession } from '@frontend/hooks/useSession';

/** The features page's closing call to action; the page is prebuilt, so the session is the browser's. */
export function FeaturesCta() {
  const t = useTranslations('features');
  const { status } = useSession();

  return (
    <Button asChild size="lg" className="px-8">
      {status === 'signed-in' ? (
        <Link href="/characters">{t('ctaCharacters')}</Link>
      ) : (
        <Link href="/register">{t('ctaStart')}</Link>
      )}
    </Button>
  );
}
