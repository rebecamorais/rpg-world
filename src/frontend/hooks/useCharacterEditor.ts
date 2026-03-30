'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AttributeKey, DnD5eCharacter } from '@shared/systems/dnd5e';
import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';
import type { SkillKey } from '@shared/systems/dnd5e/constants';
import type { CharacterSkill } from '@shared/systems/dnd5e/types';

interface UseCharacterEditorOptions {
  fetchedCharacter: DnD5eCharacter | undefined;
  queryError: Error | null;
}

export function useCharacterEditor({ fetchedCharacter, queryError }: UseCharacterEditorOptions) {
  const [character, setCharacter] = useState<DnD5eCharacter | null>(null);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSpellsOpen, setIsSpellsOpen] = useState(false);

  // Sync fetched data to local state buffer for optimistic UI edits
  useEffect(() => {
    if (fetchedCharacter && !hasUnsavedChanges) {
      Promise.resolve().then(() => setCharacter(fetchedCharacter));
    }
  }, [fetchedCharacter, hasUnsavedChanges]);

  useEffect(() => {
    if (queryError) {
      Promise.resolve().then(() => setError(queryError.message));
    }
  }, [queryError]);

  const markDirty = useCallback(() => {
    setError('');
    setHasUnsavedChanges(true);
  }, []);

  const handleAttributeChange = useCallback((key: AttributeKey, value: number) => {
    setError('');

    setCharacter((prev) => {
      if (!prev) return null;

      let newPassivePerception = prev.passivePerception ?? 10;
      if (key === 'WIS') {
        const wisMod = Math.floor((value - 10) / 2);
        const isProficient = prev.skills?.PERCEPTION?.isProficient;
        newPassivePerception = 10 + wisMod + (isProficient ? getProficiencyBonus(prev.level) : 0);
      }

      return {
        ...prev,
        attributes: { ...prev.attributes, [key]: value } as Record<AttributeKey, number>,
        passivePerception: newPassivePerception,
      } as DnD5eCharacter;
    });

    setHasUnsavedChanges(true);
  }, []);

  const handleSkillChange = useCallback((key: SkillKey, skillData: CharacterSkill) => {
    setError('');

    setCharacter((prev) => {
      if (!prev) return null;

      let newPassivePerception = prev.passivePerception ?? 10;
      if (key === 'PERCEPTION') {
        const wisMod = prev.attributes.WIS ? Math.floor((prev.attributes.WIS - 10) / 2) : 0;
        newPassivePerception =
          10 + wisMod + (skillData.isProficient ? getProficiencyBonus(prev.level) : 0);
      }

      return {
        ...prev,
        skills: { ...prev.skills, [key]: skillData },
        passivePerception: newPassivePerception,
      } as DnD5eCharacter;
    });

    setHasUnsavedChanges(true);
  }, []);

  const handleSavingThrowChange = useCallback((key: AttributeKey, isProficient: boolean) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            savingThrowProficiencies: {
              ...prev.savingThrowProficiencies,
              [key]: isProficient,
            } as Record<AttributeKey, boolean>,
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleBasicInfoChange = useCallback(
    (field: keyof DnD5eCharacter, value: string | number) => {
      setError('');
      setCharacter((prev) => (prev ? ({ ...prev, [field]: value } as DnD5eCharacter) : null));
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleSpellPointsChange = useCallback((field: 'current' | 'max', value: number) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spellPoints: {
              current: prev.spellPoints?.current ?? 0,
              max: prev.spellPoints?.max ?? 0,
              [field]: value,
            },
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleSpellSlotsChange = useCallback((level: string, max: number, used: number) => {
    setError('');
    setCharacter((prev) =>
      prev
        ? ({
            ...prev,
            spellSlots: {
              ...prev.spellSlots,
              [level]: { max, used },
            },
          } as DnD5eCharacter)
        : null,
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleSpellcastingSystemChange = useCallback((system: 'slots' | 'points' | 'none') => {
    setError('');
    setCharacter((prev) =>
      prev ? ({ ...prev, spellcastingSystem: system } as DnD5eCharacter) : null,
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleHitDiceChange = useCallback((total: string) => {
    setError('');
    setCharacter((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        hitDice: {
          total,
          current: prev.hitDice?.current ?? 0,
        },
      } as DnD5eCharacter;
    });
    setHasUnsavedChanges(true);
  }, []);

  return {
    character,
    error,
    hasUnsavedChanges,
    isSpellsOpen,
    setIsSpellsOpen,
    markDirty,
    setHasUnsavedChanges,
    handleAttributeChange,
    handleSkillChange,
    handleSavingThrowChange,
    handleBasicInfoChange,
    handleSpellPointsChange,
    handleSpellSlotsChange,
    handleSpellcastingSystemChange,
    handleHitDiceChange,
  };
}
