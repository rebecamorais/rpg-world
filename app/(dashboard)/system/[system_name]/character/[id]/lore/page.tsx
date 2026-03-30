'use client';

import LoreSection from '@frontend/components/character/LoreSection';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterLorePage() {
  const { character, handleBasicInfoChange } = useCharacterContext();

  if (!character) return null;

  return <LoreSection data={character} onBasicInfoChange={handleBasicInfoChange} />;
}
