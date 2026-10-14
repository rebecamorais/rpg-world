'use client';

import { useCallback } from 'react';

import { usePathname } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import LoreSection from '@frontend/components/character/LoreSection';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { type LoreData, useCharacterLore } from '@frontend/hooks/useCharacterLore';
import { useDraft } from '@frontend/hooks/useDraft';
import { useLeaveGuard } from '@frontend/hooks/useUnsavedChanges';

import { SaveControls } from './SaveControls';

/** The Lore tab: loads the lore only here and edits it in its own draft. */
export function LoreTab() {
  const { id } = useCharacterMeta();
  const t = useTranslations('characters');
  const { lore, isLoading, updateLore, isSaving } = useCharacterLore(id);
  const { draft, isDirty, update, commit, discard } = useDraft<LoreData>(lore);
  const pathname = usePathname();
  const tCommon = useTranslations('common');
  // The lore draft lives in this tab: leaving it, even to another tab, drops the edits
  useLeaveGuard(isDirty, (path) => path === pathname, tCommon('leaveConfirm'));

  const save = useCallback(async () => {
    try {
      await commit(updateLore);
      toast.success(t('saveSuccess'));
    } catch {
      // useCharacterLore already shows the error
    }
  }, [commit, updateLore, t]);

  return (
    <PageContainer
      icon="Files"
      title={t('tabs.lore')}
      actions={
        <SaveControls isDirty={isDirty} isSaving={isSaving} onSave={save} onDiscard={discard} />
      }
      loading={isLoading}
    >
      {draft ? (
        <LoreSection data={draft} onChange={(field, value) => update({ [field]: value })} />
      ) : (
        <LoadingState thematic />
      )}
    </PageContainer>
  );
}
