import { useMemo } from 'react';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import CharacterHeader from '@frontend/components/character/CharacterHeader';
import LoreSection from '@frontend/components/character/LoreSection';
import SpellsDrawer from '@frontend/components/character/spells/SpellsDrawer';
import SpellsSection from '@frontend/components/character/spells/SpellsSection';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import PassivePerception from '@frontend/components/character/stats/PassivePerception';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { useCharacterContext } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacter } from '@frontend/hooks/useCharacter';
import { useCharacterEditor } from '@frontend/hooks/useCharacterEditor';
import { useCharacterSpells } from '@frontend/hooks/useCharacterSpells';
import { CharacterTab } from '@frontend/types/character-sheet';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';
import { DnD5eCharacter } from '@shared/systems/dnd5e/types';

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
    spells: characterSpells,
    learnSpell: handleLearnSpell,
    forgetSpell: handleForgetSpell,
    togglePrepared: handleTogglePrepared,
  } = useCharacterSpells(id);

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
    handleHitDiceChange,
  } = useCharacterEditor({ fetchedCharacter: fetchedCharacter as DnD5eCharacter, queryError });

  const spellsKnown = useMemo(() => characterSpells.map((s) => s.id), [characterSpells]);

  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get('tab') as CharacterTab) || CharacterTab.STATUS;

  const handleDelete = () => {
    if (character) deleteCharacter(character);
  };

  const { updateLore } = useCharacterContext();

  const handleSave = () => {
    if (!character) return;

    if (activeTab === CharacterTab.STATUS) {
      updateCharacter(character, {
        onSuccess: () => setHasUnsavedChanges(false),
      });
    } else if (activeTab === CharacterTab.LORE) {
      // Cast to any since CharacterEditor state contains narrative fields
      updateLore(character as unknown as Record<string, unknown>).then(() => {
        setHasUnsavedChanges(false);
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

  if (isLoading && !character) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <LoadingState thematic />
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
    <div
      className="mx-auto w-full max-w-5xl p-4 md:min-w-[1024px]"
      style={
        { '--character-color': character.accentColor || 'var(--primary)' } as React.CSSProperties
      }
    >
      <CharacterActionBar
        characterName={character.name}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
        showSave={[CharacterTab.STATUS, CharacterTab.LORE].includes(activeTab)}
      />

      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {activeTab === CharacterTab.STATUS && (
          <>
            <CharacterHeader
              id={character.id}
              name={character.name}
              classNameStr={character.class}
              level={character.level}
              race={character.race}
              pb={pb}
              background={character.background}
              alignment={character.alignment}
              xp={character.xp}
              avatarUrl={character.avatarUrl}
              accentColor={character.accentColor}
              onBasicInfoChange={handleBasicInfoChange}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
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
              </div>
            </div>
          </>
        )}

        {activeTab === CharacterTab.LORE && (
          <LoreSection data={character} onBasicInfoChange={handleBasicInfoChange} />
        )}

        {activeTab === CharacterTab.SPELLS && (
          <SpellsSection
            characterSpells={characterSpells}
            onForgetSpell={handleForgetSpell}
            onTogglePrepared={handleTogglePrepared}
            onAddSpellClick={() => setIsSpellsOpen(true)}
          />
        )}

        {activeTab === CharacterTab.INVENTORY && (
          <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p>{t('emptyStates.inventory')}</p>
          </div>
        )}
      </div>

      <SpellsDrawer
        isOpen={isSpellsOpen}
        onClose={() => setIsSpellsOpen(false)}
        learnedSpells={spellsKnown}
        onLearnSpell={handleLearnSpell}
        onForgetSpell={handleForgetSpell}
      />
    </div>
  );
}
