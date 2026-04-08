'use client';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import StatusView from '@frontend/components/character/StatusView';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterStatusPage() {
  const { character, hasUnsavedChanges, isSaving, setHasUnsavedChanges, updateCharacter } =
    useCharacterContext();

  if (!character) return null;

  const handleSave = () => {
    updateCharacter(character, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  };

  return (
    <>
      <CharacterActionBar
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
      />
      <StatusView />
    </>
  );
}
