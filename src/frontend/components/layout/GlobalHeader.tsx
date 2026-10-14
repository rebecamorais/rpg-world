import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import LanguageSwitcher from '@frontend/components/LanguageSwitcher';
import { HeaderSupportLink } from '@frontend/components/layout/HeaderSupportLink';
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
      <Link
        href="/"
        className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
      >
        <AppIcon
          name="dice-fire"
          variant="game"
          size={40}
          className="text-primary-flare shrink-0"
        />
        <span className="font-display sr-only text-2xl font-bold sm:not-sr-only">
          {tHome('title')}
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {!user ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">{tLogin('submit')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register" className="flex items-center gap-2">
                <AppIcon name="UserPlus" size={16} />
                {tRegister('submit')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <Link href="/characters">{tCommon('back')}</Link>
            </Button>
            <UserMenu />
          </div>
        )}
        <HeaderSupportLink />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
