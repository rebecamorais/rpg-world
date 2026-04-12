'use client';

import React from 'react';

import CharacterHeader from '@frontend/components/character/CharacterHeader';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import PassivePerception from '@frontend/components/character/stats/PassivePerception';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { useCharacterContext } from '@frontend/context/CharacterContext';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';

/**
 * StatusView — the Status tab for the route-based character sheet.
 * Reads all data from CharacterContext (provided by layout.tsx).
 * Used by: app/.../character/[id]/page.tsx
 */
export default function StatusView() {
  const {
    character,
    error,
    handleBasicInfoChange,
    handleAttributeChange,
    handleSkillChange,
    handleSavingThrowChange,
    handleSpellPointsChange,
    handleSpellSlotsChange,
    handleSpellcastingSystemChange,
    handleHitDiceChange,
    handleDeathSavesChange,
  } = useCharacterContext();

  if (!character) return null;

  const pb = getProficiencyBonus(character.level);

  return (
    <div className="flex flex-col gap-6">
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
            deathSaves={character.deathSaves}
            onSavingThrowChange={handleSavingThrowChange}
            onDeathSavesChange={handleDeathSavesChange}
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
    </div>
  );
}
