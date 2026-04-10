'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { PageHeader } from '@frontend/components/shared/PageHeader';
import { Button } from '@frontend/components/ui/button';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterSpellsPage() {
  const { character, handleForgetSpell, handleTogglePrepared, setIsSpellsOpen, characterSpells } =
    useCharacterContext();
  const t = useTranslations('characters.tabs');
  const tSpells = useTranslations('characters.spells');

  if (!character) return null;

  const preparedCount = characterSpells.filter((s) => s.isPrepared).length;

  const actions = (
    <div className="flex items-center gap-3 md:gap-6">
      <div className="hidden items-baseline gap-1.5 opacity-60 sm:flex">
        <span className="text-xs font-bold tracking-widest uppercase">
          {tSpells('preparedLabels', { count: preparedCount })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSpellsOpen(true)}
        className="h-8 border-white/10 px-3 text-xs font-bold tracking-wider uppercase transition-all hover:bg-white/5"
      >
        <Plus className="mr-2 size-3" />
        {tSpells('addBtn')}
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader icon="BookOpen" title={t('spells')} actions={actions} />
      <div className="flex flex-col gap-6">
        <SpellsSection
          characterSpells={characterSpells}
          onForgetSpell={handleForgetSpell}
          onTogglePrepared={handleTogglePrepared}
        />
      </div>
    </>
  );
}
