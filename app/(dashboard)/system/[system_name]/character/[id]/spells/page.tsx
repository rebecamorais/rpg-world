'use client';

import { useMemo } from 'react';

import { BookMarked, BookOpen, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/CharacterActionBar';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterSpellsPage() {
  const {
    character,
    handleForgetSpell,
    handleTogglePrepared,
    setIsSpellsOpen,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    updateCharacter,
    deleteCharacter,
    characterSpells,
  } = useCharacterContext();
  const t = useTranslations('characters');
  const tData = useTranslations('spellsData');
  const tCommon = useTranslations('common');

  // Group by level and sort alphabetically by translated name within each level
  const groupedSpells = useMemo(() => {
    const groups: Record<number, typeof characterSpells> = {};

    characterSpells.forEach((spell) => {
      if (!groups[spell.level]) {
        groups[spell.level] = [];
      }
      groups[spell.level].push(spell);
    });

    Object.keys(groups).forEach((levelStr) => {
      const level = Number(levelStr);
      groups[level].sort((a, b) => {
        if (a.isPrepared !== b.isPrepared) return a.isPrepared ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [characterSpells]);

  const sortedLevels = Object.keys(groupedSpells)
    .map(Number)
    .sort((a, b) => a - b);

  const preparedCount = characterSpells.filter((s) => s.isPrepared).length;

  if (!character) return null;

  const handleSave = () => {
    updateCharacter(character, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  };

  const handleDelete = () => {
    deleteCharacter(character);
  };

  return (
    <div className="flex flex-col gap-6">
      <CharacterActionBar
        characterName={character.name}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{t('tabs.spells')}</h2>
          {characterSpells.length > 0 && (
            <div className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles size={12} />
              <span>
                {preparedCount}/{characterSpells.length}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsSpellsOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-bold shadow-sm transition-all"
        >
          {tCommon('add')}
        </button>
      </div>

      {/* Spell list grouped by level */}
      {characterSpells.length > 0 ? (
        <div className="flex flex-col gap-8">
          {sortedLevels.map((level) => (
            <div key={level} className="flex flex-col gap-3">
              <h3 className="text-foreground border-b pb-2 text-lg font-bold">
                {level === 0 ? t('cantrip') : t('levelDetail', { level })}
              </h3>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {groupedSpells[level].map((spell) => (
                  <li
                    key={spell.spellId}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                      spell.isPrepared
                        ? 'border-primary/30 bg-primary/5 shadow-sm'
                        : 'border-border bg-secondary/30'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`text-sm font-semibold capitalize ${
                          spell.isPrepared ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {spell.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="bg-muted/50 text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] lowercase">
                          {tData(`schools.${spell.school.toLowerCase()}`)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePrepared(spell.spellId, !spell.isPrepared)}
                        className={`rounded-md p-1.5 transition-all ${
                          spell.isPrepared
                            ? 'bg-primary/15 text-primary hover:bg-primary/25'
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        }`}
                        title={spell.isPrepared ? t('unprepareSpell') : t('prepareSpell')}
                      >
                        {spell.isPrepared ? (
                          <BookMarked className="h-4 w-4" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleForgetSpell(spell.spellId)}
                        className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500"
                        title={t('forgetSpell')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground bg-muted/20 flex h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p>{t('emptyStates.spells')}</p>
        </div>
      )}
    </div>
  );
}
