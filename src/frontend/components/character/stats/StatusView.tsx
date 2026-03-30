'use client';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import CharacterHeader from '@frontend/components/character/CharacterHeader';
import KnownSpellsCard from '@frontend/components/character/spells/KnownSpellsCard';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import PassivePerception from '@frontend/components/character/stats/PassivePerception';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { useCharacterContext } from '@frontend/context/CharacterContext';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';

export default function StatusView() {
  const {
    character,
    error,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    updateCharacter,
    deleteCharacter,
    handleAttributeChange,
    handleSkillChange,
    handleSavingThrowChange,
    handleBasicInfoChange,
    handleSpellPointsChange,
    handleSpellSlotsChange,
    handleSpellcastingSystemChange,
    handleForgetSpell,
    handleTogglePrepared,
    handleHitDiceChange,
    characterSpells,
  } = useCharacterContext();

  if (!character) return null;

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
    <div
      className="flex flex-col gap-6"
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
      />

      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

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
              characterSpells={characterSpells}
              onForgetSpell={handleForgetSpell}
              onTogglePrepared={handleTogglePrepared}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
