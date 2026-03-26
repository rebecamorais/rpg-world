'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import AttributesSection from '@frontend/components/AttributesSection';
import CharacterActionBar from '@frontend/components/CharacterActionBar';
import CharacterHeader from '@frontend/components/CharacterHeader';
import CombatStatsSection from '@frontend/components/CombatStatsSection';
import KnownSpellsCard from '@frontend/components/KnownSpellsCard';
import LoreSection from '@frontend/components/LoreSection';
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
    handleHitDiceChange,
  } = useCharacterEditor({ fetchedCharacter, queryError });

  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'status';

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

      <div className="flex flex-col gap-6">
        {/* Right Main Content - Now Full Width */}
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

        {activeTab === 'status' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            {/* Left Column in Status View: Passive, Saving Throws, Attributes */}
            <div className="flex flex-col gap-6">
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

            {/* Right Column in Status View: Combat Stats, Skills, Spells */}
            <div className="flex flex-col gap-6">
              <CombatStatsSection
                character={character}
                onBasicInfoChange={handleBasicInfoChange}
                onSpellcastingSystemChange={handleSpellcastingSystemChange}
                onSpellPointsChange={handleSpellPointsChange}
                onSpellSlotsChange={handleSpellSlotsChange}
                onHitDiceChange={handleHitDiceChange}
              />
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
          </div>
        )}

        {activeTab === 'lore' && (
          <LoreSection data={character} onBasicInfoChange={handleBasicInfoChange} />
        )}

        {activeTab === 'spells' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('tabs.spells')}</h2>
              <button
                onClick={() => setIsSpellsOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-bold shadow-sm transition-all"
              >
                {t('common.add')}
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
        )}
        {activeTab === 'inventory' && (
          <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p>{t('emptyStates.inventory')}</p>
          </div>
        )}
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
