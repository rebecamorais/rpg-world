'use client';

import AttributesSection from '@frontend/components/AttributesSection';
import CombatStatsSection from '@frontend/components/CombatStatsSection';
import KnownSpellsCard from '@frontend/components/KnownSpellsCard';
import PassivePerception from '@frontend/components/PassivePerception';
import SavingThrowsSection from '@frontend/components/SavingThrowsSection';
import SkillsSection from '@frontend/components/SkillsSection';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function StatusView() {
  const {
    character,
    handleAttributeChange,
    handleSkillChange,
    handleSavingThrowChange,
    handleBasicInfoChange,
    handleSpellPointsChange,
    handleSpellSlotsChange,
    handleSpellcastingSystemChange,
    handleForgetSpell,
    handleHitDiceChange,
  } = useCharacterContext();

  if (!character) return null;

  return (
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
  );
}
