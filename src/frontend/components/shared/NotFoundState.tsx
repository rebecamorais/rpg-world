import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';

/**
 * The page doesn't exist: says so and offers the way back to the right place. Signed in, that is
 * the characters (the start of the app); signed out, the home page; inside the demo, the demo's
 * start. Not async, so it renders as a Server Component (next-intl reads the request's messages)
 * and in tests alike.
 */
export function NotFoundState({ signedIn, demo = false }: { signedIn: boolean; demo?: boolean }) {
  const t = useTranslations('notFound');
  const locale = useLocale();
  const [href, label] = demo
    ? [localizedHref('/demo', locale), t('demo')]
    : signedIn
      ? ['/characters', t('characters')]
      : [localizedHref('/', locale), t('home')];

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <EmptyState
        icon="Footprints"
        // The page's only heading
        titleAs="h1"
        title={t('title')}
        description={t('description')}
        className="w-full max-w-lg"
        action={
          <Button asChild>
            <Link href={href}>{label}</Link>
          </Button>
        }
      />
    </div>
  );
}
