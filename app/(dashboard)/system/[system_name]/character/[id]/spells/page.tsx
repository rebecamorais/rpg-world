'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { PageContainer } from '@frontend/components/shared/PageContainer';
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
      <div className="hidden items-baseline gap-1.5 sm:flex">
        <span className="text-label text-muted-foreground">
          {tSpells('preparedLabels', { count: preparedCount })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSpellsOpen(true)}
        className="text-label h-8 px-3"
      >
        <Plus aria-hidden="true" />
        {tSpells('addBtn')}
      </Button>
    </div>
  );

  return (
    <PageContainer icon="BookOpen" title={t('spells')} actions={actions}>
      <div className="flex flex-col gap-6">
        <SpellsSection
          characterSpells={characterSpells}
          onForgetSpell={handleForgetSpell}
          onTogglePrepared={handleTogglePrepared}
        />
      </div>
    </PageContainer>
  );
}
