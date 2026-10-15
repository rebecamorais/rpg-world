import { Spellbook } from '@frontend/components/character/spells/Spellbook';
import { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

interface SpellsSectionProps {
  characterSpells: CharacterSpell[];
  onForgetSpell: (spellId: string) => void | Promise<unknown>;
  onTogglePrepared: (spellId: string, isPrepared: boolean) => void | Promise<unknown>;
  onAddSpell: () => void;
}

export default function SpellsSection({
  characterSpells,
  onForgetSpell,
  onTogglePrepared,
  onAddSpell,
}: SpellsSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6">
        <Spellbook
          characterSpells={characterSpells}
          onForgetSpell={onForgetSpell}
          onTogglePrepared={onTogglePrepared}
          onAddSpell={onAddSpell}
        />
      </div>
    </div>
  );
}
