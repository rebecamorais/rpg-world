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

import { SaveControls } from './SaveControls';
import { SheetFieldset } from './SheetFieldset';
import { SheetPage } from './SheetPage';

/** The Lore tab: loads the lore only here and edits it in its own draft. */
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

  const save = useCallback(async () => {
    try {
      await commit((draft) => updateLore(draft));
      toast.success(t('saveSuccess'));
    } catch {
      // useCharacterLore already shows the error
    }
  }, [commit, updateLore, t]);

  return (
    <SheetPage
      icon="Files"
      tab={t('tabs.lore')}
      actions={
        readOnly ? null : (
          <SaveControls isDirty={isDirty} isSaving={isSaving} onSave={save} onDiscard={discard} />
        )
      }
      loading={isLoading}
    >
      {draft ? (
        <SheetFieldset>
          <LoreSection data={draft} onChange={(field, value) => update({ [field]: value })} />
        </SheetFieldset>
      ) : (
        <LoadingState thematic />
      )}
    </SheetPage>
  );
}
