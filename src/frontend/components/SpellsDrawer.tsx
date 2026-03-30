'use client';

import { useMemo, useState } from 'react';

import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Input } from '@frontend/components/ui/input';
import { Spinner } from '@frontend/components/ui/spinner';
import { useSpells } from '@frontend/hooks/useSpells';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  learnedSpells: string[];
  onLearnSpell: (spellIndex: string) => void;
  onForgetSpell: (spellIndex: string) => void;
}

export default function SpellsDrawer({
  isOpen,
  onClose,
  learnedSpells,
  onLearnSpell,
  onForgetSpell,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const t = useTranslations('spellsDrawer');
  const tCommon = useTranslations('common');
  const tCharacters = useTranslations('characters');
  const tSpellsData = useTranslations('spellsData');

  const { data: systemSpells = [], isLoading } = useSpells();

  const [loadingSpells, setLoadingSpells] = useState<Record<string, boolean>>({});

  const handleLearn = async (spellId: string) => {
    setLoadingSpells((prev) => ({ ...prev, [spellId]: true }));
    try {
      await onLearnSpell(spellId);
    } finally {
      setLoadingSpells((prev) => ({ ...prev, [spellId]: false }));
    }
  };

  const handleForget = async (spellId: string) => {
    setLoadingSpells((prev) => ({ ...prev, [spellId]: true }));
    try {
      await onForgetSpell(spellId);
    } finally {
      setLoadingSpells((prev) => ({ ...prev, [spellId]: false }));
    }
  };

  const learnedSet = useMemo(() => new Set(learnedSpells), [learnedSpells]);

  const filteredSpells = useMemo(() => {
    return systemSpells
      .filter((spell) => {
        const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || spell.level.toString() === levelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [systemSpells, searchQuery, levelFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md md:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="my-2 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border-input ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-[150px]"
          >
            <option value="all">{t('allLevels')}</option>
            <option value="0">{tCharacters('cantrip')}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <option key={lvl} value={lvl.toString()}>
                {tCharacters('levelDetail', { level: lvl })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Spinner size="md" className="text-muted-foreground" />
            </div>
          ) : filteredSpells.length === 0 ? (
            <p className="text-muted-foreground mt-8 text-center text-sm">{t('noSpellsFound')}</p>
          ) : (
            <ul className="space-y-2">
              {filteredSpells.map((spell) => {
                const isLearned = learnedSet.has(spell.id);
                // Try translating the school
                let translatedSchool = spell.school;
                try {
                  translatedSchool = tSpellsData(`schools.${spell.school}`);
                } catch {
                  // Ignore
                }

                return (
                  <li
                    key={spell.id}
                    className="border-border bg-card hover:bg-accent/50 flex items-center justify-between rounded-md border p-3 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{spell.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {spell.level === 0
                          ? tCharacters('cantrip')
                          : tCharacters('levelDetail', { level: spell.level })}{' '}
                        • {translatedSchool}
                      </span>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {isLearned ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingSpells[spell.id]}
                          onClick={() => handleForget(spell.id)}
                          className="h-8 gap-1 px-2 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          {loadingSpells[spell.id] ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">
                            {loadingSpells[spell.id]
                              ? tCommon('loading')
                              : tCharacters('forgetSpell')}
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={loadingSpells[spell.id]}
                          onClick={() => handleLearn(spell.id)}
                          className="bg-primary hover:bg-primary/90 h-8 gap-1 px-2"
                        >
                          {loadingSpells[spell.id] ? (
                            <Spinner size="sm" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">
                            {loadingSpells[spell.id] ? tCommon('loading') : t('learn')}
                          </span>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
