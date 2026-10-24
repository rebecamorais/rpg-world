import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import {
  HeaderSessionActions,
  HeaderSessionMobileMenu,
} from '@frontend/components/layout/HeaderSessionActions';
import { AppIcon } from '@frontend/components/ui/icon';

/**
 * `session="server"`: the session comes from the server, as on signed-in pages.
 * `session="client"` (prebuilt pages): nothing is read from the request; the parts that depend on
 * the session are worked out in the browser.
 */
export default async function GlobalHeader({ session }: { session: 'server' | 'client' }) {
  const tHome = await getTranslations('home');

  // undefined = unknown here, found in the browser
  const serverUser =
    session === 'server' ? await (await getApi()).authApi.getSessionUser() : undefined;

  return (
    <header className="border-border bg-card flex h-[var(--header-height)] shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-1">
        <HeaderSessionMobileMenu serverUser={serverUser} />
        <Link
          href="/"
          className="focus-ring flex min-w-0 items-center gap-2 rounded-md transition-opacity hover:opacity-80 sm:gap-3"
        >
          <AppIcon
            name="dice-fire"
            variant="game"
            size={40}
            className="text-primary-flare shrink-0"
          />
          <span className="font-display sr-only text-2xl font-bold whitespace-nowrap sm:not-sr-only">
            {tHome('title')}
          </span>
        </Link>
      </div>

      <HeaderSessionActions serverUser={serverUser} />
    </header>
  );
}
