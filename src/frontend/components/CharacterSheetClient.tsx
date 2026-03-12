'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import AttributesSection from '@frontend/components/AttributesSection';
import CharacterActionBar from '@frontend/components/CharacterActionBar';
import CharacterHeader from '@frontend/components/CharacterHeader';
import CharacterSheetTabs from '@frontend/components/CharacterSheetTabs';
import CombatStatsSection from '@frontend/components/CombatStatsSection';
import KnownSpellsCard from '@frontend/components/KnownSpellsCard';
import PassivePerception from '@frontend/components/PassivePerception';
import SavingThrowsSection from '@frontend/components/SavingThrowsSection';
import SkillsSection from '@frontend/components/SkillsSection';
import SpellsDrawer from '@frontend/components/SpellsDrawer';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterEditor } from '@frontend/hooks/useCharacterEditor';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';

export default function CharacterSheetClient() {
  const params = useParams();
  const { currentUser } = useCurrentUser();
  const id = params?.id as string;
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  const {
    character: fetchedCharacter,
    isLoading,
    error: queryError,
    deleteCharacter,
    updateCharacter,
    isSaving,
  } = useCharacter(id);

  const {
    character,
    error,
    hasUnsavedChanges,
    isSpellsOpen,
    setIsSpellsOpen,
    setHasUnsavedChanges,
    handleAttributeChange,
    handleSkillChange,
    handleSavingThrowChange,
    handleBasicInfoChange,
    handleSpellPointsChange,
    handleSpellSlotsChange,
    handleSpellcastingSystemChange,
    handleLearnSpell,
    handleForgetSpell,
  } = useCharacterEditor({ fetchedCharacter, queryError });

  const handleDelete = () => {
    if (character) deleteCharacter(character);
  };

  const handleSave = () => {
    if (character) {
      updateCharacter(character, {
        onSuccess: () => setHasUnsavedChanges(false),
      });
    }
  };

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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_1fr]">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4">
          <PassivePerception
            wisValue={character.attributes.WIS ?? 10}
            level={character.level}
            perceptionSkillData={character.skills?.PERCEPTION}
          />

          <SavingThrowsSection
            attributes={character.attributes}
            level={character.level}
            savingThrows={character.savingThrowProficiencies}
            onSavingThrowChange={handleSavingThrowChange}
          />
          <AttributesSection
            attributes={character.attributes}
            onAttributeChange={handleAttributeChange}
          />
        </div>

        {/* Right Main Content */}
        <div className="flex min-w-0 flex-col gap-4">
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

          <CombatStatsSection
            character={character}
            onBasicInfoChange={handleBasicInfoChange}
            onSpellcastingSystemChange={handleSpellcastingSystemChange}
            onSpellPointsChange={handleSpellPointsChange}
            onSpellSlotsChange={handleSpellSlotsChange}
          />

          <CharacterSheetTabs
            statusContent={
              <div className="flex flex-col gap-6">
                <SkillsSection
                  attributes={character.attributes}
                  level={character.level}
                  skills={character.skills ?? {}}
                  onSkillChange={handleSkillChange}
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <KnownSpellsCard
                    spellsKnown={character.spellsKnown || []}
                    onForgetSpell={handleForgetSpell}
                  />
                </div>
              </div>
            }
          />
        </div>
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
