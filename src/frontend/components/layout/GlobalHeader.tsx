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
    <header className="border-border bg-card flex h-[var(--header-height)] shrink-0 items-center justify-between border-b px-8 py-3">
      <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
        <AppIcon name="dice-fire" variant="game" size={40} className="text-primary shrink-0" />
        <span className="text-2xl font-bold tracking-tight">{tHome('title')}</span>
      </Link>

      <div className="flex items-center gap-4">
        {!user ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" asChild size="sm" className="text-gray-400 hover:text-white">
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
              className="hidden text-zinc-400 hover:text-white sm:flex"
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
