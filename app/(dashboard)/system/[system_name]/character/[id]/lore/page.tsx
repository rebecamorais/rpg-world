'use client';

import { useTranslations } from 'next-intl';

import LoreSection from '@frontend/components/character/LoreSection';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterLorePage() {
  const {
    character,
    handleBasicInfoChange,
    updateLore,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useCharacterContext();
  const t = useTranslations('characters.tabs');
  const tCommon = useTranslations('common');

  if (!character) return null;

  const handleSave = async () => {
    await updateLore(character as unknown as Record<string, unknown>);
    setHasUnsavedChanges(false);
  };

  const actions = (
    <Button
      variant="character"
      size="sm"
      onClick={handleSave}
      disabled={!hasUnsavedChanges}
      loading={isSaving}
      className="text-label h-8 px-4"
    >
      {isSaving ? tCommon('saving') : tCommon('saveChanges')}
    </Button>
  );

  return (
    <PageContainer icon="Files" title={t('lore')} actions={actions}>
      <LoreSection data={character} onBasicInfoChange={handleBasicInfoChange} />
    </PageContainer>
  );
}
