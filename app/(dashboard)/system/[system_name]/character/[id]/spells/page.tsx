'use client';

import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/CharacterActionBar';
import KnownSpellsCard from '@frontend/components/KnownSpellsCard';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterSpellsPage() {
  const {
    character,
    handleForgetSpell,
    setIsSpellsOpen,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    updateCharacter,
    deleteCharacter,
  } = useCharacterContext();
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('tabs.spells')}</h2>
        <button
          onClick={() => setIsSpellsOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-bold shadow-sm transition-all"
        >
          {tCommon('add')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <KnownSpellsCard
          spellsKnown={character.spellsKnown || []}
          onForgetSpell={handleForgetSpell}
        />
      </div>
      {(!character.spellsKnown || character.spellsKnown.length === 0) && (
        <div className="text-muted-foreground bg-muted/20 flex h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p>{t('emptyStates.spells')}</p>
        </div>
      )}
    </div>
  );
}
