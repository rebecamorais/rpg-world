import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import LanguageSwitcher from '@frontend/components/LanguageSwitcher';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

export default async function GlobalHeader() {
  const tHome = await getTranslations('home');
  const tLogin = await getTranslations('login');
  const tRegister = await getTranslations('register');

  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return (
    <header className="border-border bg-card flex h-[var(--header-height)] shrink-0 items-center justify-between border-b px-8 py-3">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-80"
      >
        <AppIcon name="dice-fire" variant="game" size={24} className="text-primary" />
        {tHome('title')}
      </Link>

      <div className="flex items-center gap-4">
        {!user && (
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
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
