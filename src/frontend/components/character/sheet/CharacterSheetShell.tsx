'use client';

import { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Badge } from '@frontend/components/ui/badge';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharacterMeta, useCharacterState } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import AppLink from '@frontend/demo/AppLink';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { useLeaveGuard } from '@frontend/hooks/useUnsavedChanges';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import { SheetBackdrop } from './SheetBackdrop';

/** On the GM's read-only view: says so, and leads back to the party. */
function ReadOnlyBar({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.sheet');

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <AppLink href={`/parties/${partyId}`} className="text-primary-flare text-sm underline">
        {t('back')}
      </AppLink>
      <Badge variant="secondary" className="text-label">
        <AppIcon name="Eye" size={14} aria-hidden="true" />
        {t('readOnly')}
      </Badge>
    </div>
  );
}

/**
 * Frame of every character sheet tab: waits for the character, checks it belongs to the user
 * and applies the character's color. The tabs render only once the character is loaded.
 */
export function CharacterSheetShell({ children }: { children: ReactNode }) {
  const { currentUser } = useCurrentUser();
  const { character, isDirty } = useCharacterState();
  const { id, isLoading } = useCharacterMeta();
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  // The GM reading a player's sheet: the server already checked access, nothing is edited
  const { readOnly, partyId } = useSheetSource(id);

  // The character draft survives switching tabs (the provider is in the layout), not leaving
  const sheetRoot = pathname.slice(0, pathname.indexOf(id) + id.length);
  useLeaveGuard(
    isDirty && !readOnly,
    (path) => path.startsWith(sheetRoot),
    tCommon('leaveConfirm'),
  );

  if (isLoading) {
    return <LoadingState thematic />;
  }

  if (!character || (!readOnly && character.ownerUsername !== currentUser?.id)) {
    return (
      <EmptyState
        icon="Shield"
        title={t('notFoundOrNoPermission')}
        className="w-full max-w-lg"
        action={
          <AppLink
            href={partyId ? `/parties/${partyId}` : '/characters'}
            className="text-primary-flare text-sm underline"
          >
            {tCommon('back')}
          </AppLink>
        }
      />
    );
  }

  const theme = characterTheme(character.accentColor);

  return (
    <div
      // Not positioned, so the backdrop reaches past the page's width to the dashboard's content area
      className={cn(theme.className, 'isolate w-full')}
      style={theme.style}
    >
      {character.sheetBackgroundUrl && <SheetBackdrop url={character.sheetBackgroundUrl} />}
      {/* Room for the fixed save bar; width and padding come from the dashboard layout */}
      <div className="relative pb-20">
        {/* The character's color lights the top of their sheet */}
        <div
          aria-hidden="true"
          className="bg-character pointer-events-none absolute top-0 left-[10%] -z-10 h-64 w-2/3 -translate-y-1/3 rounded-full opacity-15 blur-3xl"
        />
        {readOnly && partyId && <ReadOnlyBar partyId={partyId} />}
        {children}
      </div>
    </div>
  );
}
