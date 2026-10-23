import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import LanguageSwitcher from '@frontend/components/LanguageSwitcher';
import { HeaderSupportLink } from '@frontend/components/layout/HeaderSupportLink';
import { MobileMenu } from '@frontend/components/layout/Sidebar';
import UserMenu from '@frontend/components/layout/UserMenu';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

export default async function GlobalHeader() {
  const tHome = await getTranslations('home');
  const tLogin = await getTranslations('login');
  const tRegister = await getTranslations('register');
  const tCommon = await getTranslations('common');

  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return (
    <header className="border-border bg-card flex h-[var(--header-height)] shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-8">
      <div className="flex min-w-0 items-center gap-1">
        {user && <MobileMenu />}
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

      <div className="flex items-center gap-1 sm:gap-2">
        {!user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">{tLogin('submit')}</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/register" className="flex items-center gap-2">
                <AppIcon name="UserPlus" size={16} />
                {tRegister('submit')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="hidden items-center gap-1 sm:flex">
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/characters">{tCommon('back')}</Link>
            </Button>
            <UserMenu />
          </div>
        )}
        <span className="bg-border mx-1 hidden h-5 w-px sm:block" aria-hidden="true" />
        <div className="flex items-center gap-1">
          <HeaderSupportLink email={user?.email ?? undefined} />
          <LanguageSwitcher signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
