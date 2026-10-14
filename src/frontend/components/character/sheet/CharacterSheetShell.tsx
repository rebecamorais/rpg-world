'use client';

import { ReactNode } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { useCharacterMeta, useCharacterState } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

/**
 * Frame of every character sheet tab: waits for the character, checks it belongs to the user
 * and applies the character's color. The tabs render only once the character is loaded.
 */
export function CharacterSheetShell({ children }: { children: ReactNode }) {
  const { currentUser } = useCurrentUser();
  const { character } = useCharacterState();
  const { isLoading } = useCharacterMeta();
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  if (isLoading) {
    return <LoadingState thematic />;
  }

  if (!character || character.ownerUsername !== currentUser?.id) {
    return (
      <EmptyState
        icon="Shield"
        title={t('notFoundOrNoPermission')}
        className="m-4 w-full max-w-lg"
        action={
          <Link href="/characters" className="text-primary-flare text-sm underline">
            {tCommon('back')}
          </Link>
        }
      />
    );
  }

  const theme = characterTheme(character.accentColor);

  return (
    <div className={cn(theme.className, 'mx-auto w-full max-w-5xl p-4')} style={theme.style}>
      {children}
    </div>
  );
}
