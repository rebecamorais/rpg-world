'use client';

import { useTranslations } from 'next-intl';

import StatusView from '@frontend/components/character/StatusView';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterStatusPage() {
  const { character, hasUnsavedChanges, isSaving, setHasUnsavedChanges, updateCharacter } =
    useCharacterContext();
  const t = useTranslations('characters.tabs');
  const tCommon = useTranslations('common');

  if (!character) return null;

  const handleSave = () => {
    updateCharacter(character, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  };

  const actions = (
    <Button
      variant="character"
      size="sm"
      onClick={handleSave}
      disabled={!hasUnsavedChanges || isSaving}
      className="h-8 px-4 text-xs font-bold tracking-wider uppercase"
    >
      {isSaving ? tCommon('saving') : tCommon('saveChanges')}
    </Button>
  );

  return (
    <PageContainer icon="Shield" title={t('status')} actions={actions}>
      <StatusView />
    </PageContainer>
  );
}
