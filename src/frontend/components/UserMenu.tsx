'use client';

import { useTranslations } from 'next-intl';

import { useCurrentUser } from '@/frontend/context/UserContext';

export default function UserMenu() {
  const { currentUser, logout } = useCurrentUser();
  const tCommon = useTranslations('common');

  if (!currentUser) return null;

  return (
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
  );
}
