'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { useAuth } from '@frontend/hooks/useAuth';

export default function UserMenu() {
  const { signOut } = useAuth();
  const tCommon = useTranslations('common');

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={signOut}
      className="text-muted-foreground hover:text-foreground"
    >
      {tCommon('logout')}
    </Button>
  );
}
