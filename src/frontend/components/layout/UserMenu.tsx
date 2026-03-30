'use client';

import { useTranslations } from 'next-intl';

import { useAuth } from '@frontend/hooks/useAuth';

export default function UserMenu() {
  const { signOut } = useAuth();
  const tCommon = useTranslations('common');

  return (
    <div className="border-border ml-1 flex items-center gap-3 border-l pl-4">
      <button
        type="button"
        onClick={signOut}
        className="text-muted-foreground hover:text-foreground text-sm font-medium"
      >
        {tCommon('logout')}
      </button>
    </div>
  );
}
