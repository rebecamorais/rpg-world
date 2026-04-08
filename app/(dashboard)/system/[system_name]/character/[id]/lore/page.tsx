'use client';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import LoreSection from '@frontend/components/character/LoreSection';
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

  if (!character) return null;

  const handleSave = async () => {
    await updateLore(character as unknown as Record<string, unknown>);
    setHasUnsavedChanges(false);
  };

  return (
    <>
      <CharacterActionBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
      />
      <LoreSection data={character} onBasicInfoChange={handleBasicInfoChange} />
    </>
  );
}
