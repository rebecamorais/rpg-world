'use client';

import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterSpellsPage() {
  const { character, handleForgetSpell, handleTogglePrepared, setIsSpellsOpen, characterSpells } =
    useCharacterContext();

  if (!character) return null;

  return (
    <div className="flex flex-col gap-6">
      <SpellsSection
        characterSpells={characterSpells}
        onForgetSpell={handleForgetSpell}
        onTogglePrepared={handleTogglePrepared}
        onAddSpellClick={() => setIsSpellsOpen(true)}
      />
    </div>
  );
}
