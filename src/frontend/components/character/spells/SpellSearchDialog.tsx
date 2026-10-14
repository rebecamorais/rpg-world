'use client';

import { useCallback, useMemo, useState } from 'react';

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
import { useSpells } from '@frontend/hooks/useSpells';
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

  // Filter State
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | null>(null);
  const [classFilter, setClassFilter] = useState<CharacterClass | null>(null);
  const [damageFilter, setDamageFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Data Fetching
  const { data: paginatedSpells, isLoading } = useSpells({
    page,
    limit: PAGE_SIZE,
    search: activeSearch,
    level: levelFilter,
    school: schoolFilter,
    class: classFilter,
    damageType: damageFilter,
  });

  const spells = paginatedSpells?.data || [];
  const totalItems = paginatedSpells?.total || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const learnedSet = useMemo(() => new Set(learnedSpells), [learnedSpells]);

  const handleSearchTrigger = useCallback(() => {
    setActiveSearch(searchInput);
    setPage(0); // Reset to first page on search
  }, [searchInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearchTrigger();
      }
    },
    [handleSearchTrigger],
  );

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
        className="character-context bg-background/95 flex h-[90vh] max-w-4xl flex-col p-0 backdrop-blur-xl"
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
                className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="focus:ring-character/50 border-border bg-muted text-foreground pl-10"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSearchTrigger}
                className="hover:bg-character-muted hover:text-character-primary text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2 transition-all"
              >
                {tCharacters('search')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SelectField
                value={levelFilter === null ? 'all' : levelFilter.toString()}
                onValueChange={(val) => {
                  setLevelFilter(val === 'all' ? null : Number(val));
                  setPage(0);
                }}
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
                value={schoolFilter ?? 'all'}
                onValueChange={(val) => {
                  setSchoolFilter(val === 'all' ? null : (val as SpellSchool));
                  setPage(0);
                }}
                className="border-border bg-muted text-foreground h-10 w-[150px]"
                placeholder={t('allSchools')}
                options={schoolOptions}
              />

              <SelectField
                value={classFilter ?? 'all'}
                onValueChange={(val) => {
                  setClassFilter(val === 'all' ? null : (val as CharacterClass));
                  setPage(0);
                }}
                className="border-border bg-muted text-foreground h-10 w-[140px]"
                placeholder={t('allClasses')}
                options={classesOptions}
              />

              <SelectField
                value={damageFilter ?? 'all'}
                onValueChange={(val) => {
                  setDamageFilter(val === 'all' ? null : val);
                  setPage(0);
                }}
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
            </div>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <LoadingState thematic />
          ) : spells.length === 0 ? (
            <EmptyState
              icon="Search"
              title={t('noSpellsFound')}
              className="h-64 border-none bg-transparent"
              action={
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchInput('');
                    setActiveSearch('');
                    setLevelFilter(null);
                    setSchoolFilter(null);
                    setClassFilter(null);
                    setDamageFilter(null);
                  }}
                  className="text-character-flare"
                >
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Improved Pagination Footer */}
        {totalPages > 1 && (
          <footer className="border-border bg-muted/50 flex items-center justify-between border-t p-4 backdrop-blur-md">
            <p className="text-muted-foreground text-xs font-medium">
              {t('pagination', { count: spells.length, total: totalItems })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
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
                      onClick={() => setPage(pageNum)}
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
                onClick={() => setPage((p) => p + 1)}
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
