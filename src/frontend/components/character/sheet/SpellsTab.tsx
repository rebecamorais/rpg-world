'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SpellSearchDialog from '@frontend/components/character/spells/SpellSearchDialog';
import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import { SpellCardSkeleton } from '@frontend/components/character/spells/spell-card/SpellCardSkeleton';
import { Button } from '@frontend/components/ui/button';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { SheetPage } from './SheetPage';

/**
 * Where focus goes once a spell's card is gone: the next card of its level, else the one before,
 * else the title of a neighbouring level. Read before forgetting, while the card is still there.
 */
function focusTargetAfter(root: HTMLElement | null, spellId: string): HTMLElement | null {
  // Matched by attribute value: spell ids have colons, which a selector would need escaped
  const card = [...(root?.querySelectorAll('article[aria-labelledby]') ?? [])].find(
    (el) => el.getAttribute('aria-labelledby') === `spell-name-${spellId}`,
  );
  if (!card) return null;
  const sibling = card.nextElementSibling ?? card.previousElementSibling;
  const toggle = sibling?.querySelector<HTMLElement>('button[aria-expanded]');
  if (toggle) return toggle;

  // The level empties with this card, so its section goes too
  const section = card.closest('section[data-level]');
  const level = section?.nextElementSibling ?? section?.previousElementSibling;
  return level?.querySelector<HTMLElement>('h2') ?? null;
}

/** The Spellbook tab: loads the character's spells only here and owns the search dialog. */
export function SpellsTab() {
  const { id } = useCharacterMeta();
  const t = useTranslations('characters');
  const tDrawer = useTranslations('spellsDrawer');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { spells, isLoading, learnSpell, forgetSpell, togglePrepared } = useCharacterSpells(id);
  // Read only (the GM): the spellbook opens to read, nothing is learned, forgotten or prepared
  const { readOnly } = useSheetSource(id);

  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  // The spell being forgotten and where focus goes after; `settled` once the forget call returned
  const pendingFocus = useRef<{ id: string; target: HTMLElement | null; settled: boolean } | null>(
    null,
  );

  // The forgotten card unmounts with its forget button, and focus would fall to the page's top
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    if (spells.some((s) => s.id === pending.id)) {
      // Cancelled or failed: the spell is still there, and so is the focus
      if (pending.settled) pendingFocus.current = null;
      return;
    }
    pendingFocus.current = null;
    const target = pending.target?.isConnected ? pending.target : addRef.current;
    if (!target) return;
    // A level title isn't focusable by itself; -1 lets the script focus it without a Tab stop
    if (target.tagName === 'H2' && !target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus();
  }, [spells]);

  const forgetFromSpellbook = useCallback(
    async (spellId: string) => {
      pendingFocus.current = {
        id: spellId,
        target: focusTargetAfter(listRef.current, spellId),
        settled: false,
      };
      try {
        await forgetSpell(spellId);
      } finally {
        // Even if it threw: left unsettled, it would take the focus on a later list change.
        // Not cleared here: on success the list may not have re-rendered without the card yet
        if (pendingFocus.current?.id === spellId) pendingFocus.current.settled = true;
      }
    },
    [forgetSpell],
  );

  const preparedCount = spells.filter((s) => s.isPrepared).length;

  const actions = (
    <div className="flex items-center gap-3 md:gap-6">
      <span className="text-label text-muted-foreground">
        {t('spells.preparedLabels', { count: preparedCount })}
      </span>
      {!readOnly && (
        <Button
          ref={addRef}
          variant="outline"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          // No text-label: buttons keep the case of their text
          className="h-8 px-3"
        >
          <Plus aria-hidden="true" />
          {t('spells.addBtn')}
        </Button>
      )}
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
        // `contents`: only a root to find the cards in, the layout stays the section's own
        <div ref={listRef} className="contents">
          <SpellsSection
            characterId={id}
            characterSpells={spells}
            onForgetSpell={readOnly ? undefined : forgetFromSpellbook}
            onTogglePrepared={readOnly ? undefined : togglePrepared}
            onAddSpell={readOnly ? undefined : () => setIsSearchOpen(true)}
          />
        </div>
      )}

      {/* Mounted once the spellbook is in: the list starts on the edition of its spells */}
      {!isLoading && !readOnly && (
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
