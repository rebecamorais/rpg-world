'use client';

import { useTranslations } from 'next-intl';

import CharacterList from '@/frontend/components/CharacterList';
import LoginForm from '@/frontend/components/LoginForm';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function Home() {
  const { currentUser, logout } = useCurrentUser();
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');

  if (!currentUser) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  const displayLabel = currentUser.displayName || currentUser.username;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-card flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">{tHome('title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {displayLabel}{' '}
            <span className="opacity-70">(@{currentUser.username})</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            {tCommon('logout')}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {tHome('greeting', { name: displayLabel })}
          </p>
        </div>
        <CharacterList />
      </main>
    </div>
  );
}
