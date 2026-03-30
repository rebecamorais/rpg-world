import { useTranslations } from 'next-intl';

import KnownSpellsCard from '@frontend/components/KnownSpellsCard';
import { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

interface SpellsSectionProps {
  characterSpells: CharacterSpell[];
  onForgetSpell: (spellId: string) => void | Promise<unknown>;
  onTogglePrepared: (spellId: string, isPrepared: boolean) => void | Promise<unknown>;
  onAddSpellClick: () => void;
}

export default function SpellsSection({
  characterSpells,
  onForgetSpell,
  onTogglePrepared,
  onAddSpellClick,
}: SpellsSectionProps) {
  const t = useTranslations('characters');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('tabs.spells')}</h2>
        <button
          onClick={onAddSpellClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-bold shadow-sm transition-all"
        >
          {t('common.add')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <KnownSpellsCard
          characterSpells={characterSpells}
          onForgetSpell={onForgetSpell}
          onTogglePrepared={onTogglePrepared}
        />
      </div>
    </div>
  );
}
