'use client';

import { ComponentProps } from 'react';

import { useTranslations } from 'next-intl';

import { PageContainer } from '@frontend/components/shared/PageContainer';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharacterMeta, useLoadedCharacter } from '@frontend/context/CharacterContext';
import AppLink from '@frontend/demo/AppLink';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

type SheetPageProps = Omit<ComponentProps<typeof PageContainer>, 'title' | 'eyebrow'> & {
  /** The tab's name, shown above the character's name. */
  tab: string;
};

/** The gear to the sheet's appearance. None for whoever only reads the sheet. */
function AppearanceLink() {
  const t = useTranslations('characterAppearance');
  const { id } = useCharacterMeta();
  const { system } = useLoadedCharacter();
  const { readOnly, pagesPath } = useSheetSource(id, system);

  if (readOnly) return null;

  return (
    <AppLink
      href={`${pagesPath}/appearance`}
      aria-label={t('title')}
      title={t('title')}
      className="focus-ring border-border text-muted-foreground hover:text-character-flare flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors"
    >
      <AppIcon name="Settings" size={16} aria-hidden="true" />
    </AppLink>
  );
}

/**
 * A tab of the character sheet: same page frame as the rest of the dashboard, with the
 * character's name as the page's h1, the tab as the eyebrow, and on every tab the gear that opens
 * the sheet's appearance, right before the tab's own actions.
 */
export function SheetPage({ tab, actions, ...props }: SheetPageProps) {
  const { name } = useLoadedCharacter();

  return (
    <PageContainer
      title={name}
      eyebrow={tab}
      titleClassName="text-character-flare"
      actions={
        <>
          <AppearanceLink />
          {actions}
        </>
      }
      {...props}
    />
  );
}
