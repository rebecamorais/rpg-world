'use client';

import { useCallback } from 'react';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import LoreSection from '@frontend/components/character/LoreSection';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { type LoreData, useCharacterLore } from '@frontend/hooks/useCharacterLore';
import { useDraft } from '@frontend/hooks/useDraft';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { useLeaveGuard } from '@frontend/hooks/useUnsavedChanges';

import { SaveControls, useCharacterSave, useClaimCharacterBar } from './SaveControls';
import { SheetFieldset } from './SheetFieldset';
import { SheetPage } from './SheetPage';

/**
 * The Lore tab: loads the lore only here and edits it in its own draft. The character's draft
 * (edits made on other tabs) can be pending too: one bar saves both ("Save all"), instead of two
 * bars that took a quarter of a phone's screen.
 */
export function LoreTab() {
  const { id } = useCharacterMeta();
  const t = useTranslations('characters');
  const { lore, isLoading, updateLore, isSaving } = useCharacterLore(id);
  const { draft, isDirty, update, commit, discard } = useDraft<LoreData>(lore);
  const pathname = usePathname();
  const tCommon = useTranslations('common');
  const { readOnly } = useSheetSource(id);
  // The lore draft lives in this tab: leaving it, even to another tab, drops the edits
  useLeaveGuard(isDirty, (path) => path === pathname, tCommon('leaveConfirm'));

  const saveLore = useCallback(async () => {
    try {
      await commit((draft) => updateLore(draft));
      toast.success(t('loreSaved'));
    } catch {
      // useCharacterLore already shows the error
    }
  }, [commit, updateLore, t]);

  // The character's draft joins this tab's bar
  useClaimCharacterBar();
  const sheet = useCharacterSave();
  const sheetDirty = sheet?.isDirty ?? false;
  // A field with an error or a conflict on the sheet's draft holds only the sheet's save: the lore
  // still saves, and once it has, the bar shows the sheet's problem with its own way out
  const sheetBlocked = !!(sheet?.hasErrors || sheet?.conflict);
  const both = isDirty && sheetDirty && !sheetBlocked;
  const save = async () => {
    await Promise.all([isDirty && saveLore(), sheetDirty && !sheetBlocked && sheet?.onSave()]);
  };
  const discardAll = () => {
    if (isDirty) discard();
    if (sheetDirty && !sheetBlocked) sheet?.onDiscard();
  };

  return (
    <SheetPage
      icon="Files"
      tab={t('tabs.lore')}
      actions={
        readOnly ? null : (
          <SaveControls
            isDirty={isDirty || sheetDirty}
            isSaving={isSaving || (sheet?.isSaving ?? false)}
            onSave={save}
            onDiscard={discardAll}
            // Shown only once the lore is saved: until then Save keeps the lore, and Discard
            // (which would drop the lore too) isn't offered as the way out of the sheet's conflict
            hasErrors={!isDirty && sheetDirty && sheet?.hasErrors}
            conflict={!isDirty && sheetDirty && sheet?.conflict}
            onReload={sheet?.onReload}
            label={
              both
                ? tCommon('unsavedLoreAndSheet')
                : isDirty
                  ? tCommon('unsavedLore')
                  : tCommon('unsavedSheet')
            }
            saveLabel={both ? tCommon('saveAll') : undefined}
          />
        )
      }
      loading={isLoading}
    >
      {draft ? (
        <SheetFieldset>
          <LoreSection
            data={draft}
            readOnly={readOnly}
            onChange={(field, value) => update({ [field]: value })}
          />
        </SheetFieldset>
      ) : (
        <LoadingState thematic />
      )}
    </SheetPage>
  );
}
