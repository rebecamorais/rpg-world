'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { DAMAGE_THEMES } from '@frontend/constants/damage-themes';
import { useCharacterState } from '@frontend/context/CharacterContext';
import { useDebouncedValue } from '@frontend/hooks/useDebouncedValue';
import { useSpells } from '@frontend/hooks/useSpells';
import { matchCharacterClass } from '@frontend/lib/character-class';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';
import { CharacterClass, SpellSchool } from '@frontend/types/spells';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  learnedSpells: string[];
  onLearnSpell: (spellId: string) => void;
  onForgetSpell: (spellId: string) => void;
}

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

interface Filters {
  level: number | null;
  school: SpellSchool | null;
  class: CharacterClass | null;
  damage: string | null;
}

const NO_FILTERS: Filters = { level: null, school: null, class: null, damage: null };

export default function SpellSearchDialog({
  isOpen,
  onClose,
  learnedSpells,
  onLearnSpell,
  onForgetSpell,
}: Props) {
  const t = useTranslations('spellsDrawer');
  const tCharacters = useTranslations('characters');
  const tSpellsData = useTranslations('spellsData');

  const { character } = useCharacterState();
  const accentColor = character?.accentColor;

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  // Starts on the character's class when it names one of the system's
  const [filters, setFilters] = useState<Filters>(() => ({
    ...NO_FILTERS,
    class: matchCharacterClass(character?.class, (c) =>
      tSpellsData(`classes.${c}` as Parameters<typeof tSpellsData>[0]),
    ),
  }));
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const activeFilterCount = Object.values(filters).filter((v) => v !== null).length;

  // The page belongs to one search: a new search or filter starts back on the first page
  const queryKey = JSON.stringify([search, filters]);
  const [paging, setPaging] = useState({ key: queryKey, page: 0 });
  const page = paging.key === queryKey ? paging.page : 0;
  const listRef = useRef<HTMLDivElement>(null);
  const goToPage = (next: number) => {
    setPaging({ key: queryKey, page: next });
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const clearAll = () => {
    setSearchInput('');
    setFilters(NO_FILTERS);
  };

  const {
    data: paginatedSpells,
    isLoading,
    isPlaceholderData,
  } = useSpells({
    page,
    limit: PAGE_SIZE,
    search,
    level: filters.level,
    school: filters.school,
    class: filters.class,
    damageType: filters.damage,
  });

  const spells = paginatedSpells?.data || [];
  const totalItems = paginatedSpells?.total || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const learnedSet = useMemo(() => new Set(learnedSpells), [learnedSpells]);

  const damageTypes = Object.keys(DAMAGE_THEMES).filter(
    (key) => !['slashing', 'piercing', 'bludgeoning'].includes(key),
  );

  const schoolOptions = useMemo(
    () => [
      { value: 'all', label: t('allSchools') },
      ...Object.values(SpellSchool).map((s) => ({
        value: s,
        label: tSpellsData(`schools.${s}`),
      })),
    ],
    [t, tSpellsData],
  );

  const classesOptions = useMemo(
    () => [
      { value: 'all', label: t('allClasses') },
      ...Object.values(CharacterClass).map((c) => ({
        value: c,
        label: tSpellsData(`classes.${c}` as Parameters<typeof tSpellsData>[0]),
      })),
    ],
    [t, tSpellsData],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="character-context bg-background flex h-[90vh] max-w-4xl flex-col p-0"
        style={characterTheme(accentColor).style}
      >
        {/* Thematic Glow */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-10 blur-3xl transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 0% 0%, var(--character-primary), transparent 50%)`,
          }}
        />
        <DialogHeader className="border-border border-b p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-character-surface text-character-flare ring-border flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-1">
                <AppIcon name="BookOpen" size={24} />
              </div>
              {t('title')}
            </DialogTitle>
            <DialogDescription className="sr-only">{t('description')}</DialogDescription>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="relative w-full">
              <AppIcon
                name="Search"
                size={18}
                aria-hidden="true"
                className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              />
              <Input
                aria-label={t('searchLabel')}
                placeholder={t('searchPlaceholder')}
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="focus:ring-character/50 border-border bg-muted text-foreground pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SelectField
                value={filters.level === null ? 'all' : filters.level.toString()}
                onValueChange={(val) => setFilter('level', val === 'all' ? null : Number(val))}
                className="border-border bg-muted text-foreground h-10 w-[120px]"
                placeholder={t('allLevels')}
                options={[
                  { value: 'all', label: t('allLevels') },
                  { value: '0', label: tCharacters('cantrip') },
                  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => ({
                    value: lvl.toString(),
                    label: tCharacters('levelDetail', { level: lvl }),
                  })),
                ]}
              />

              <SelectField
                value={filters.school ?? 'all'}
                onValueChange={(val) =>
                  setFilter('school', val === 'all' ? null : (val as SpellSchool))
                }
                className="border-border bg-muted text-foreground h-10 w-[150px]"
                placeholder={t('allSchools')}
                options={schoolOptions}
              />

              <SelectField
                value={filters.class ?? 'all'}
                onValueChange={(val) =>
                  setFilter('class', val === 'all' ? null : (val as CharacterClass))
                }
                className="border-border bg-muted text-foreground h-10 w-[140px]"
                placeholder={t('allClasses')}
                options={classesOptions}
              />

              <SelectField
                value={filters.damage ?? 'all'}
                onValueChange={(val) => setFilter('damage', val === 'all' ? null : val)}
                className="border-border bg-muted text-foreground h-10 w-[150px]"
                placeholder={tCharacters('allDamage')}
                options={[
                  { value: 'all', label: tCharacters('allDamage') },
                  ...damageTypes.map((type) => ({
                    value: type,
                    label: tSpellsData(`damageTypes.${type}`),
                  })),
                ]}
              />

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(NO_FILTERS)}
                  className="text-character-flare hover:bg-character-surface hover:text-character-flare"
                >
                  <AppIcon name="X" size={16} aria-hidden="true" />
                  {t('clearActiveFilters', { count: activeFilterCount })}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <p role="status" className="sr-only">
          {isLoading ? '' : tCharacters('spellCount', { count: totalItems })}
        </p>

        <div
          ref={listRef}
          aria-busy={isPlaceholderData}
          className={cn(
            'custom-scrollbar flex-1 overflow-y-auto px-6 py-6 transition-opacity',
            isPlaceholderData && 'opacity-60',
          )}
        >
          {isLoading ? (
            <LoadingState thematic />
          ) : spells.length === 0 ? (
            <EmptyState
              icon="Search"
              title={t('noSpellsFound')}
              className="h-64 border-none bg-transparent"
              action={
                <Button variant="link" onClick={clearAll} className="text-character-flare">
                  {t('clearFilters')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-20">
              {spells.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  isExpanded={expandedId === spell.id}
                  onClick={() => toggleExpand(spell.id)}
                  onLearnSpell={onLearnSpell}
                  onForgetSpell={onForgetSpell}
                  isLearned={learnedSet.has(spell.id)}
                  showLevel
                />
              ))}
            </div>
          )}
        </div>

        {/* Improved Pagination Footer */}
        {totalPages > 1 && (
          <footer className="border-border bg-muted/50 flex items-center justify-between border-t p-4">
            <p className="text-muted-foreground text-xs font-medium">
              {t('pagination', {
                from: page * PAGE_SIZE + 1,
                to: page * PAGE_SIZE + spells.length,
                total: totalItems,
              })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                className="border-border bg-muted text-foreground hover:bg-background h-8 w-8 p-0 disabled:opacity-40"
              >
                <AppIcon name="ChevronLeft" size={16} />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = page;
                  if (totalPages > 5) {
                    if (page < 2) pageNum = i;
                    else if (page > totalPages - 3) pageNum = totalPages - 5 + i;
                    else pageNum = page - 2 + i;
                  } else {
                    pageNum = i;
                  }

                  const isActive = page === pageNum;

                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'h-8 w-8 p-0 font-mono text-xs',
                        isActive
                          ? 'border-character bg-character text-character-on hover:bg-character/90 hover:text-character-on font-bold'
                          : 'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => goToPage(page + 1)}
                className="border-border bg-muted text-foreground hover:bg-background h-8 w-8 p-0 disabled:opacity-40"
              >
                <AppIcon name="ChevronRight" size={16} />
              </Button>
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
