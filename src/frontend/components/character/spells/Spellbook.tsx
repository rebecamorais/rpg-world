'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';
import { cn } from '@frontend/lib/utils';

import { SpellCard } from './spell-card/SpellCard';

interface SpellbookProps {
  characterSpells: CharacterSpell[];
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  /** Opens the spell search; offered when the spellbook is empty. */
  onAddSpell?: () => void;
}

const sectionId = (level: number) => `spell-level-${level}`;

/** The level whose section is at the top of the viewport, for the index highlight. */
function useLevelInView(levels: number[]) {
  const [inView, setInView] = useState<number | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setInView(Number((top.target as HTMLElement).dataset.level));
      },
      // A section counts once it reaches the upper third of the screen
      { rootMargin: '0px 0px -66% 0px' },
    );
    for (const level of levels) {
      const section = document.getElementById(sectionId(level));
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [levels]);

  return inView ?? levels[0];
}

export function Spellbook({
  characterSpells,
  onForgetSpell,
  onTogglePrepared,
  onAddSpell,
}: SpellbookProps) {
  const t = useTranslations('characters');
  const tDrawer = useTranslations('spellsDrawer');
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Group and sort spells by level
  const spellsByLevel = useMemo(() => {
    if (!characterSpells) return {};

    const grouped = characterSpells.reduce(
      (acc, spell) => {
        const level = spell.level;
        if (!acc[level]) acc[level] = [];
        acc[level].push(spell);
        return acc;
      },
      {} as Record<number, CharacterSpell[]>,
    );

    // Pre-sort each level to avoid sorting in render
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => {
        if (a.isPrepared && !b.isPrepared) return -1;
        if (!a.isPrepared && b.isPrepared) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [characterSpells]);

  const levels = useMemo(
    () =>
      Object.keys(spellsByLevel)
        .map(Number)
        .sort((a, b) => a - b),
    [spellsByLevel],
  );

  const levelInView = useLevelInView(levels);

  const toggleExpand = useCallback((id: string) => {
    setExpandedSpellId((prev) => (prev === id ? null : id));
  }, []);

  if (!characterSpells || characterSpells.length === 0) {
    return (
      <EmptyState
        icon="BookOpen"
        title={tDrawer('emptyState')}
        description={tDrawer('emptyStateHint')}
        action={
          onAddSpell && (
            <Button onClick={onAddSpell}>
              <AppIcon name="Plus" size={16} aria-hidden="true" />
              {t('spells.addBtn')}
            </Button>
          )
        }
      />
    );
  }

  const levelTitle = (level: number) => (level === 0 ? t('cantrips') : t('levelSpells', { level }));

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      {/* Index: shortcuts to each level. A sticky chip row on phones, a sidebar on desktop */}
      <nav
        aria-label={t('spellbookIndex')}
        className="bg-sidebar sticky top-0 z-20 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:top-6 md:mx-0 md:w-48 md:shrink-0 md:bg-transparent md:p-0"
      >
        <p className="text-label text-muted-foreground mb-3 hidden md:block">
          {t('spellbookIndex')}
        </p>
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
          {levels.map((level) => {
            const isCurrent = level === levelInView;
            return (
              <li key={level} className="shrink-0">
                <a
                  href={`#${sectionId(level)}`}
                  aria-current={isCurrent ? 'location' : undefined}
                  className={cn(
                    'focus-ring flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors md:border-transparent md:py-2',
                    isCurrent
                      ? 'border-character-muted bg-character-surface text-character-flare'
                      : 'border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                  )}
                >
                  {level === 0 ? t('cantrips') : t('levelName', { level })}
                  <span className="bg-muted-foreground/10 ml-auto min-w-5 rounded-full px-1.5 text-center font-mono text-xs">
                    {spellsByLevel[level].length}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Every level in one list, so the whole spellbook is one scroll away */}
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {levels.map((level) => (
          <section
            key={level}
            id={sectionId(level)}
            data-level={level}
            aria-labelledby={`${sectionId(level)}-title`}
            className="scroll-mt-16 md:scroll-mt-6"
          >
            <header className="bg-sidebar border-border mb-4 flex items-center justify-between gap-4 border-b py-3 md:sticky md:top-0 md:z-10">
              <h2 id={`${sectionId(level)}-title`} className="text-title text-foreground">
                {levelTitle(level)}
              </h2>
              <span className="text-label text-muted-foreground">
                {t('spellCount', { count: spellsByLevel[level].length })}
              </span>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {spellsByLevel[level].map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  isExpanded={expandedSpellId === spell.id}
                  onToggle={toggleExpand}
                  onForgetSpell={onForgetSpell}
                  onTogglePrepared={onTogglePrepared}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
