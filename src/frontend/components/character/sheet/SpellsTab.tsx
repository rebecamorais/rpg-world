'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SpellSearchDialog from '@frontend/components/character/spells/SpellSearchDialog';
import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';

import { SheetPage } from './SheetPage';

/** The Spellbook tab: loads the character's spells only here and owns the search dialog. */
export function SpellsTab() {
  const { id } = useCharacterMeta();
  const t = useTranslations('characters');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { spells, isLoading, learnSpell, forgetSpell, togglePrepared } = useCharacterSpells(id);

  const preparedCount = spells.filter((s) => s.isPrepared).length;

  const actions = (
    <div className="flex items-center gap-3 md:gap-6">
      <span className="text-label text-muted-foreground">
        {t('spells.preparedLabels', { count: preparedCount })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSearchOpen(true)}
        className="text-label h-8 px-3"
      >
        <Plus aria-hidden="true" />
        {t('spells.addBtn')}
      </Button>
    </div>
  );

  return (
    <SheetPage icon="BookOpen" tab={t('tabs.spells')} actions={actions}>
      {isLoading ? (
        <LoadingState thematic />
      ) : (
        <SpellsSection
          characterSpells={spells}
          onForgetSpell={forgetSpell}
          onTogglePrepared={togglePrepared}
          onAddSpell={() => setIsSearchOpen(true)}
        />
      )}

      <SpellSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        learnedSpells={spells.map((s) => s.id)}
        onLearnSpell={learnSpell}
        onForgetSpell={forgetSpell}
      />
    </SheetPage>
  );
}
