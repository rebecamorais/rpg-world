'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SpellSearchDialog from '@frontend/components/character/spells/SpellSearchDialog';
import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { SpellCardSkeleton } from '@frontend/components/character/spells/spell-card/SpellCardSkeleton';
import { Button } from '@frontend/components/ui/button';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';

import { SheetPage } from './SheetPage';

/** The Spellbook tab: loads the character's spells only here and owns the search dialog. */
export function SpellsTab() {
  const { id } = useCharacterMeta();
  const t = useTranslations('characters');
  const tDrawer = useTranslations('spellsDrawer');
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
        <div className="grid grid-cols-1 gap-4" aria-busy="true">
          <span role="status" className="sr-only">
            {tDrawer('loading')}
          </span>
          {Array.from({ length: 4 }, (_, i) => (
            <SpellCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <SpellsSection
          characterSpells={spells}
          onForgetSpell={forgetSpell}
          onTogglePrepared={togglePrepared}
          onAddSpell={() => setIsSearchOpen(true)}
        />
      )}

      {/* Mounted once the spellbook is in: the list starts on the edition of its spells */}
      {!isLoading && (
        <SpellSearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          learnedSpells={spells.map((s) => s.id)}
          onLearnSpell={learnSpell}
          onForgetSpell={forgetSpell}
        />
      )}
    </SheetPage>
  );
}
