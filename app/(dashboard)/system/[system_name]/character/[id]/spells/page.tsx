'use client';

import { useMemo } from 'react';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import { Spellbook } from '@frontend/components/character/spells/Spellbook';
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

      {/* Spell list grouping removed in favor of Spellbook component */}
      <Spellbook
        characterSpells={characterSpells}
        onForgetSpell={handleForgetSpell}
        onTogglePrepared={handleTogglePrepared}
      />
    </div>
  );
}
