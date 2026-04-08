import { useTranslations } from 'next-intl';

import { Spellbook } from '@frontend/components/character/spells/Spellbook';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
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
  const tCommon = useTranslations('common');

  const preparedCount = characterSpells.filter((s) => s.isPrepared).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AppIcon
              name="Sparkles"
              size={14}
              style={{ color: 'var(--character-color, var(--primary-flare))' }}
            />
            <h2 className="text-xs font-bold tracking-widest uppercase opacity-70">
              {t('tabs.spells')}
            </h2>
          </div>
          {characterSpells.length > 0 && (
            <div className="bg-character-surface text-character-flare flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold tracking-tighter">
              <span>
                {preparedCount}/{characterSpells.length}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={onAddSpellClick}
          variant="ghost"
          className="hover:bg-character-surface hover:text-character-flare h-7 rounded-md px-3 text-xs font-bold tracking-widest uppercase transition-all"
        >
          {tCommon('add')}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Spellbook
          characterSpells={characterSpells}
          onForgetSpell={onForgetSpell}
          onTogglePrepared={onTogglePrepared}
        />
      </div>
    </div>
  );
}
