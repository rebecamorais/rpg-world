'use client';

import { ReactNode } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/CharacterActionBar';
import CharacterHeader from '@frontend/components/CharacterHeader';
import SpellsDrawer from '@frontend/components/SpellsDrawer';
import { CharacterProvider, useCharacterContext } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';

function CharacterLayoutContent({ children }: { children: ReactNode }) {
  const { currentUser } = useCurrentUser();
  const {
    character,
    isLoading,
    error,
    isSaving,
    isSpellsOpen,
    setIsSpellsOpen,
    updateCharacter,
    deleteCharacter,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    handleBasicInfoChange,
    handleLearnSpell,
    handleForgetSpell,
  } = useCharacterContext();

  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{t('requireLogin')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!character || character.ownerUsername !== currentUser.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">{t('notFoundOrNoPermission')}</p>
        <Link href="/characters" className="mt-2 text-sm underline">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  const pb = getProficiencyBonus(character.level);

  const handleSave = () => {
    updateCharacter(character, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  };

  const handleDelete = () => {
    deleteCharacter(character);
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:min-w-[1024px]">
      <CharacterActionBar
        characterName={character.name}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        <CharacterHeader
          name={character.name}
          classNameStr={character.class}
          level={character.level}
          race={character.race}
          pb={pb}
          background={character.background}
          alignment={character.alignment}
          xp={character.xp}
          avatarUrl={character.avatarUrl}
          onBasicInfoChange={handleBasicInfoChange}
        />
        {children}
      </div>

      <SpellsDrawer
        isOpen={isSpellsOpen}
        onClose={() => setIsSpellsOpen(false)}
        learnedSpells={character?.spellsKnown || []}
        onLearnSpell={handleLearnSpell}
        onForgetSpell={handleForgetSpell}
      />
    </div>
  );
}

export default function CharacterLayout({ children }: { children: ReactNode }) {
  return (
    <CharacterProvider>
      <CharacterLayoutContent>{children}</CharacterLayoutContent>
    </CharacterProvider>
  );
}
