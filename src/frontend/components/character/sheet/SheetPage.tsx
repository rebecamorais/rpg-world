'use client';

import { ComponentProps } from 'react';

import { useTranslations } from 'next-intl';

import { PageContainer } from '@frontend/components/shared/PageContainer';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharacterMeta, useLoadedCharacter } from '@frontend/context/CharacterContext';
import AppLink from '@frontend/demo/AppLink';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { useSettingsHint } from './useSettingsHint';

type SheetPageProps = Omit<ComponentProps<typeof PageContainer>, 'title' | 'eyebrow'> & {
  /** The tab's name, shown above the character's name. */
  tab: string;
};

/** The gear to the sheet's settings. None for whoever only reads the sheet. */
function AppearanceLink() {
  const t = useTranslations('characterAppearance');
  const ts = useTranslations('sheetSettings');
  const { id } = useCharacterMeta();
  const { system } = useLoadedCharacter();
  const { readOnly, pagesPath } = useSheetSource(id, system);
  // TEMPORARY (#177): remove after 2027-02-01
  const { show, dismiss } = useSettingsHint();

  if (readOnly) return null;

  return (
    <>
      {show && (
        <span className="text-caption text-muted-foreground flex items-center gap-1">
          {ts('hint')}
          <button
            type="button"
            onClick={dismiss}
            className="focus-ring text-character-flare hover:text-foreground rounded-sm px-1 underline pointer-coarse:min-h-11"
          >
            {ts('dismiss')}
          </button>
        </span>
      )}
      <AppLink
        href={`${pagesPath}/appearance`}
        aria-label={t('title')}
        title={t('title')}
        onClick={dismiss}
        className="focus-ring touch-target border-border text-muted-foreground hover:text-character-flare relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors"
      >
        <AppIcon name="Settings" size={16} aria-hidden="true" />
        {show && (
          <span
            aria-hidden="true"
            className="bg-character-flare absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
          />
        )}
      </AppLink>
    </>
  );
}

/**
 * A tab of the character sheet: same page frame as the rest of the dashboard, with the
 * character's name as the page's h1, the tab as the eyebrow, and on every tab the gear that opens
 * the sheet's settings, right before the tab's own actions.
 */
export function SheetPage({ tab, actions, ...props }: SheetPageProps) {
  const { name } = useLoadedCharacter();
  const { id } = useCharacterMeta();
  const { embedded } = useSheetSource(id);

  // Inside the party's viewer the tab is one of several in a panel: no page title of its own
  if (embedded) {
    return (
      <div className="flex flex-col gap-4">
        {actions && <div className="flex flex-wrap justify-end gap-2">{actions}</div>}
        {props.children}
      </div>
    );
  }

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
