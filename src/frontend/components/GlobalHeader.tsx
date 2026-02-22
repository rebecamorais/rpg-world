'use client';

import Link from 'next/link';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import LanguageSwitcher from '@/frontend/components/LanguageSwitcher';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function GlobalHeader() {
  const { currentUser, logout } = useCurrentUser();
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <header className="border-border bg-card flex shrink-0 items-center justify-between border-b px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-80"
      >
        <Sparkles className="text-primary h-5 w-5" />
        {tHome('title')}
      </Link>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        {currentUser && (
          <div className="border-border ml-1 flex items-center gap-3 border-l pl-4">
            <span className="text-muted-foreground hidden text-sm sm:inline-block">
              {currentUser.displayName || currentUser.username}{' '}
              <span className="opacity-70">(@{currentUser.username})</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              {tCommon('logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
