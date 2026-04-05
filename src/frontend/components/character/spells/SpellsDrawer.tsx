'use client';

import { useMemo, useState } from 'react';

import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SpellCard } from '@frontend/components/character/spells/SpellCard';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { Spinner } from '@frontend/components/ui/spinner';
import { DAMAGE_THEMES } from '@frontend/constants/damage-themes';
import { useSpells } from '@frontend/hooks/useSpells';
import { CharacterClass, SpellSchool } from '@frontend/types/spells';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  learnedSpells: string[];
  onLearnSpell: (spellId: string) => void;
  onForgetSpell: (spellId: string) => void;
}

const PAGE_SIZE = 12;

export default function SpellsDrawer({
  isOpen,
  onClose,
  learnedSpells,
  onLearnSpell,
  onForgetSpell,
}: Props) {
  const t = useTranslations('spellsDrawer');
  const tCharacters = useTranslations('characters');
  const tSpellsData = useTranslations('spellsData');

  // Filter State
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | null>(null);
  const [classFilter, setClassFilter] = useState<CharacterClass | null>(null);
  const [damageFilter, setDamageFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleSearchTrigger = () => {
    setActiveSearch(searchInput);
    setPage(0); // Reset to first page on search
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchTrigger();
    }
  };

  const damageTypes = Object.keys(DAMAGE_THEMES).filter(
    (key) => !['slashing', 'piercing', 'bludgeoning'].includes(key),
  );

  const schoolOptions = [
    { value: 'all', label: t('allSchools') },
    ...Object.values(SpellSchool).map((s) => ({
      value: s,
      label: tSpellsData(`schools.${s}`),
    })),
  ];

  const classesOptions = [
    { value: 'all', label: t('allClasses') },
    ...Object.values(CharacterClass).map((c) => ({
      value: c,
      label: tSpellsData(`classes.${c}` as Parameters<typeof tSpellsData>[0]),
    })),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col border-white/10 bg-slate-950/95 p-0 text-white backdrop-blur-xl">
        <DialogHeader className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight italic">
              <div className="bg-primary/20 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-1 ring-white/10">
                <BookOpen size={24} />
              </div>
              {t('title')}
            </DialogTitle>
            <DialogDescription className="sr-only">{t('description')}</DialogDescription>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="relative w-full">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="focus:ring-primary/50 border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSearchTrigger}
                className="hover:bg-primary/20 hover:text-primary absolute top-1/2 right-1 -translate-y-1/2 text-gray-400"
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
                className="h-10 w-[120px] border-white/10 bg-white/5 text-gray-300"
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
                className="h-10 w-[150px] border-white/10 bg-white/5 text-gray-300"
                placeholder={t('allSchools')}
                options={schoolOptions}
              />

              <SelectField
                value={classFilter ?? 'all'}
                onValueChange={(val) => {
                  setClassFilter(val === 'all' ? null : (val as CharacterClass));
                  setPage(0);
                }}
                className="h-10 w-[140px] border-white/10 bg-white/5 text-gray-300"
                placeholder={t('allClasses')}
                options={classesOptions}
              />

              <SelectField
                value={damageFilter ?? 'all'}
                onValueChange={(val) => {
                  setDamageFilter(val === 'all' ? null : val);
                  setPage(0);
                }}
                className="h-10 w-[150px] border-white/10 bg-white/5 text-gray-300"
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
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <Spinner size="lg" className="text-primary" />
              <p className="animate-pulse text-sm font-medium text-gray-400">
                {t('loadingSpells')}
              </p>
            </div>
          ) : spells.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-white/5 p-4">
                <Search size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-400">{t('noSpellsFound')}</p>
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
                className="text-primary"
              >
                {t('clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 pb-20">
              {spells.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  isExpanded={expandedId === spell.id}
                  onClick={() => setExpandedId(expandedId === spell.id ? null : spell.id)}
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
          <footer className="flex items-center justify-between border-t border-white/5 bg-slate-900/50 p-4 backdrop-blur-md">
            <p className="text-xs font-medium text-gray-500">
              {t('pagination', { count: spells.length, total: totalItems })}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 border-white/10 bg-white/5 p-0 text-white hover:bg-white/10 disabled:opacity-20"
              >
                <ChevronLeft size={16} />
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

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 p-0 text-xs ${
                        page === pageNum
                          ? 'bg-primary font-bold text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                      }`}
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
                className="h-8 w-8 border-white/10 bg-white/5 p-0 text-white hover:bg-white/10 disabled:opacity-20"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
