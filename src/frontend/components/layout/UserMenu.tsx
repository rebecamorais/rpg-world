'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { useAuth } from '@frontend/hooks/useAuth';
import { cn } from '@frontend/lib/utils';

/**
 * "Sign out", the same in the desktop header and in the phone drawer (which widens it with
 * `className`): an icon and the red hover of leaving.
 */
export default function UserMenu({ className }: { className?: string }) {
  const { signOut } = useAuth();
  const tCommon = useTranslations('common');

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut()}
      className={cn(
        'group text-muted-foreground hover:bg-danger-surface hover:text-danger-flare',
        className,
      )}
    >
      <AppIcon
        name="LogOut"
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:-translate-x-1"
      />
      {tCommon('logout')}
    </Button>
  );
}
