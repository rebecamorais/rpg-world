import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';

/**
 * The page doesn't exist: says so and offers the way back to the right place. Signed in, that is
 * the characters (the start of the app); signed out, the home page. Not async, so it renders as a
 * Server Component (next-intl reads the request's messages) and in tests alike.
 */
export function NotFoundState({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('notFound');
  const locale = useLocale();

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
            <Link href={signedIn ? '/characters' : localizedHref('/', locale)}>
              {t(signedIn ? 'characters' : 'home')}
            </Link>
          </Button>
        }
      />
    </div>
  );
}
