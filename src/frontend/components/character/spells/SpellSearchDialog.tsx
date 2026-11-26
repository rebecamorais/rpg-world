'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import { SpellCardSkeleton } from '@frontend/components/character/spells/spell-card/SpellCardSkeleton';
import { spellGrimoireOf } from '@frontend/components/character/spells/spell-card/spell-grimoire';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { FieldLabel } from '@frontend/components/ui/field';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { DAMAGE_THEMES } from '@frontend/constants/damage-themes';
import { useCharacterState } from '@frontend/context/CharacterContext';
import { useConditions } from '@frontend/hooks/useConditions';
import { useDebouncedValue } from '@frontend/hooks/useDebouncedValue';
import { useSpells } from '@frontend/hooks/useSpells';
import { matchCharacterClass } from '@frontend/lib/character-choices';
import { characterTheme } from '@frontend/lib/color-utils';
import { inferEdition } from '@frontend/lib/spell-edition';
import { cn } from '@frontend/lib/utils';
import { CharacterClass, SpellSchool } from '@frontend/types/spells';

import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  learnedSpells: string[];
  onLearnSpell: (spellId: string) => void;
  onForgetSpell: (spellId: string) => void;
  /** Where the focus goes on close, when the button that opened it may be gone (see `DialogContent`). */
  onCloseAutoFocus?: (event: Event) => void;
}

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;
const FILTERS_ID = 'spell-search-filters';

interface Filters {
  level: number | null;
  school: SpellSchool | null;
  class: CharacterClass | null;
  damage: string | null;
  edition: Edition | null;
  condition: string | null;
}

const NO_FILTERS: Filters = {
  level: null,
  school: null,
  class: null,
  damage: null,
  edition: null,
  condition: null,
};

export default function SpellSearchDialog({
  isOpen,
  onClose,
  learnedSpells,
  onLearnSpell,
  onForgetSpell,
  onCloseAutoFocus,
}: Props) {
  const t = useTranslations('spellsDrawer');
  const tCharacters = useTranslations('characters');
  const tSpellsData = useTranslations('spellsData');
  const tConditions = useTranslations('conditions');
  const { list: conditions } = useConditions();

  const { character } = useCharacterState();
  const accentColor = character?.accentColor;

  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  // Starts on the character's class when it names one of the system's, and on the edition most
  // of their spells are from. Those came from the sheet, not from the person: they don't count as
  // filters, and clearing goes back to them
  const [sheetFilters] = useState<Filters>(() => ({
    ...NO_FILTERS,
    edition: inferEdition(learnedSpells),
    class: matchCharacterClass(character?.class, (c) =>
      tSpellsData(`classes.${c}` as Parameters<typeof tSpellsData>[0]),
    ),
  }));
  const [filters, setFilters] = useState<Filters>(sheetFilters);
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const activeFilterCount = (Object.keys(filters) as (keyof Filters)[]).filter(
    (key) => filters[key] !== sheetFilters[key],
  ).length;

  // The page belongs to one search: a new search or filter starts back on the first page
  const queryKey = JSON.stringify([search, filters]);
  const [paging, setPaging] = useState({ key: queryKey, page: 0 });
  const page = paging.key === queryKey ? paging.page : 0;
  const listRef = useRef<HTMLDivElement>(null);
  const goToPage = (next: number) => {
    setPaging({ key: queryKey, page: next });
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const clearAll = () => {
    setSearchInput('');
    setFilters(sheetFilters);
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
    edition: filters.edition,
    condition: filters.condition,
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

  // The catalog has each condition once per edition; the filter matches both, so list it once.
  // Prefer a translated entry, then the 2024 one
  const conditionOptions = useMemo(() => {
    const rank = (c: (typeof conditions)[number]) =>
      (c.untranslated ? 2 : 0) + (c.edition === '2024' ? 0 : 1);
    const best = new Map<string, (typeof conditions)[number]>();
    for (const c of conditions) {
      const current = best.get(c.id);
      if (!current || rank(c) < rank(current)) best.set(c.id, c);
    }
    const byId = new Map([...best].map(([id, c]) => [id, c.name]));
    return [
      { value: 'all', label: tConditions('any') },
      ...[...byId]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [conditions, tConditions]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="character-context bg-background flex h-[90dvh] max-w-4xl flex-col p-0"
        style={characterTheme(accentColor).style}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {/* Thematic Glow */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-10"
          style={{
            // A wide, soft gradient: same look as the old blur-3xl, without a filter layer
            background: `radial-gradient(circle at 0% 0%, var(--character-primary), transparent 60%)`,
          }}
        />
        <DialogHeader className="border-border border-b p-4 sm:p-6">
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
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
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

              {/* Phones: the filters fold behind this button, so the list keeps the screen */}
              <Button
                variant="outline"
                aria-expanded={filtersOpen}
                aria-controls={FILTERS_ID}
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  'h-10 shrink-0 sm:hidden',
                  activeFilterCount > 0 && 'border-character-muted text-character-flare',
                )}
              >
                <AppIcon name="Settings2" size={16} aria-hidden="true" />
                {t('filtersToggle', { count: activeFilterCount })}
              </Button>
            </div>

            <div
              id={FILTERS_ID}
              className={cn(
                'grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end',
                !filtersOpen && 'max-sm:hidden',
              )}
            >
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-edition`}>
                  {t('filterLabels.edition')}
                </FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-edition`}
                  value={filters.edition ?? 'all'}
                  onValueChange={(val) =>
                    setFilter('edition', val === 'all' ? null : (val as Edition))
                  }
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[150px]"
                  placeholder={t('allEditions')}
                  options={[
                    { value: 'all', label: t('allEditions') },
                    ...EDITIONS.map((edition) => ({
                      value: edition,
                      label: t(`editions.${edition}`),
                    })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-level`}>{t('filterLabels.level')}</FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-level`}
                  value={filters.level === null ? 'all' : filters.level.toString()}
                  onValueChange={(val) => setFilter('level', val === 'all' ? null : Number(val))}
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[120px]"
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
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-school`}>{t('filterLabels.school')}</FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-school`}
                  value={filters.school ?? 'all'}
                  onValueChange={(val) =>
                    setFilter('school', val === 'all' ? null : (val as SpellSchool))
                  }
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[150px]"
                  placeholder={t('allSchools')}
                  options={schoolOptions}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-class`}>{t('filterLabels.class')}</FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-class`}
                  value={filters.class ?? 'all'}
                  onValueChange={(val) =>
                    setFilter('class', val === 'all' ? null : (val as CharacterClass))
                  }
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[140px]"
                  placeholder={t('allClasses')}
                  options={classesOptions}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-damage`}>{t('filterLabels.damage')}</FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-damage`}
                  value={filters.damage ?? 'all'}
                  onValueChange={(val) => setFilter('damage', val === 'all' ? null : val)}
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[150px]"
                  placeholder={tCharacters('allDamage')}
                  options={[
                    { value: 'all', label: tCharacters('allDamage') },
                    ...damageTypes.map((type) => ({
                      value: type,
                      label: tSpellsData(`damageTypes.${type}`),
                    })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${FILTERS_ID}-condition`}>{tConditions('filter')}</FieldLabel>
                <SelectField
                  id={`${FILTERS_ID}-condition`}
                  value={filters.condition ?? 'all'}
                  onValueChange={(val) => setFilter('condition', val === 'all' ? null : val)}
                  className="border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto sm:min-w-[150px]"
                  placeholder={tConditions('any')}
                  options={conditionOptions}
                />
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(sheetFilters)}
                  className="text-character-flare hover:bg-character-surface hover:text-character-flare col-span-2 justify-self-start"
                >
                  <AppIcon name="X" size={16} aria-hidden="true" />
                  {t('clearActiveFilters', { count: activeFilterCount })}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <p role="status" className="sr-only">
          {isLoading ? t('loading') : tCharacters('spellCount', { count: totalItems })}
        </p>

        <div
          ref={listRef}
          aria-busy={isLoading || isPlaceholderData}
          className={cn(
            'custom-scrollbar flex-1 overflow-y-auto p-4 transition-opacity sm:p-6',
            isPlaceholderData && 'opacity-60',
          )}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 pb-20">
              {Array.from({ length: 6 }, (_, i) => (
                <SpellCardSkeleton key={i} />
              ))}
            </div>
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
                  characterId={character?.id}
                  isExpanded={expandedId === spell.id}
                  onToggle={toggleExpand}
                  onLearnSpell={onLearnSpell}
                  onForgetSpell={onForgetSpell}
                  isLearned={learnedSet.has(spell.id)}
                  showLevel
                  {...spellGrimoireOf(spell)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Improved Pagination Footer */}
        {/* Wraps at 320px: the count above, the pages below, instead of running off the edge */}
        {totalPages > 1 && (
          <footer className="border-border bg-muted/50 flex flex-wrap items-center justify-between gap-2 border-t p-4">
            <p className="text-muted-foreground text-xs font-medium">
              {t('pagination', {
                from: page * PAGE_SIZE + 1,
                to: page * PAGE_SIZE + spells.length,
                total: totalItems,
              })}
            </p>

            <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => goToPage(page - 1)}
                aria-label={t('previousPage')}
                className="border-border bg-muted text-foreground hover:bg-background size-8 p-0 disabled:opacity-40 pointer-coarse:size-11"
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
                      aria-label={t('goToPage', { page: pageNum + 1 })}
                      className={cn(
                        // A 44px target on touch screens: at 32px the neighbours' tap areas overlap
                        'size-8 p-0 font-mono text-xs pointer-coarse:size-11',
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
                aria-label={t('nextPage')}
                className="border-border bg-muted text-foreground hover:bg-background size-8 p-0 disabled:opacity-40 pointer-coarse:size-11"
              >
                <AppIcon name="ChevronRight" size={16} />
              </Button>
            </nav>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
