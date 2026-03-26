'use client';

import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/CharacterActionBar';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterInventoryPage() {
  const {
    character,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    updateCharacter,
    deleteCharacter,
  } = useCharacterContext();
  const t = useTranslations('characters');

  if (!character) return null;

  const handleSave = () => {
    updateCharacter(character, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  };

  const handleDelete = () => {
    deleteCharacter(character);
  };

  return (
    <div className="flex flex-col gap-6">
      <CharacterActionBar
        characterName={character.name}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p>{t('emptyStates.inventory')}</p>
      </div>
    </div>
  );
}
