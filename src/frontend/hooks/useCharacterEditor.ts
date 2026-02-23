'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AttributeKey, DnD5eCharacter } from '@/systems/dnd5e';
import { getProficiencyBonus } from '@/systems/dnd5e/calculations';
import type { SkillKey } from '@/systems/dnd5e/constants';
import type { CharacterSkill } from '@/systems/dnd5e/types';

interface UseCharacterEditorOptions {
  fetchedCharacter: DnD5eCharacter | undefined;
  queryError: Error | null;
}

export function useCharacterEditor({
  fetchedCharacter,
  queryError,
}: UseCharacterEditorOptions) {
  const [character, setCharacter] = useState<DnD5eCharacter | null>(null);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSpellsOpen, setIsSpellsOpen] = useState(false);

  // Sync fetched data to local state buffer for optimistic UI edits
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active && fetchedCharacter && !hasUnsavedChanges) {
        setCharacter(fetchedCharacter);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchedCharacter, hasUnsavedChanges]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active && queryError) {
        setError(queryError.message);
      }
    });
    return () => {
      active = false;
    };
  }, [queryError]);

  const markDirty = useCallback(() => {
    setError('');
    setHasUnsavedChanges(true);
  }, []);

  const handleAttributeChange = useCallback(
    (key: AttributeKey, value: number) => {
      setError('');

      setCharacter((prev) => {
        if (!prev) return null;

        let newPassivePerception = prev.passivePerception ?? 10;
        if (key === 'WIS') {
          const wisMod = Math.floor((value - 10) / 2);
          const isProficient = prev.skills?.PERCEPTION?.isProficient;
          newPassivePerception =
            10 + wisMod + (isProficient ? getProficiencyBonus(prev.level) : 0);
        }

        return {
          ...prev,
          attributes: { ...prev.attributes, [key]: value } as Record<
            AttributeKey,
            number
          >,
          passivePerception: newPassivePerception,
        } as DnD5eCharacter;
      });

      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleSkillChange = useCallback(
    (key: SkillKey, skillData: CharacterSkill) => {
      setError('');

      setCharacter((prev) => {
        if (!prev) return null;

        let newPassivePerception = prev.passivePerception ?? 10;
        if (key === 'PERCEPTION') {
          const wisMod = prev.attributes.WIS
            ? Math.floor((prev.attributes.WIS - 10) / 2)
            : 0;
          newPassivePerception =
            10 +
            wisMod +
            (skillData.isProficient ? getProficiencyBonus(prev.level) : 0);
        }

        return {
          ...prev,
          skills: { ...prev.skills, [key]: skillData },
          passivePerception: newPassivePerception,
        } as DnD5eCharacter;
      });

      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleSavingThrowChange = useCallback(
    (key: AttributeKey, isProficient: boolean) => {
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
    },
    [],
  );

  const handleBasicInfoChange = useCallback(
    (field: keyof DnD5eCharacter, value: string | number) => {
      setError('');
      setCharacter((prev) =>
        prev ? ({ ...prev, [field]: value } as DnD5eCharacter) : null,
      );
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleSpellPointsChange = useCallback(
    (field: 'current' | 'max', value: number) => {
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
    },
    [],
  );

  const handleSpellSlotsChange = useCallback(
    (level: string, max: number, used: number) => {
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
    },
    [],
  );

  const handleSpellcastingSystemChange = useCallback(
    (system: 'slots' | 'points') => {
      setError('');
      setCharacter((prev) =>
        prev
          ? ({ ...prev, spellcastingSystem: system } as DnD5eCharacter)
          : null,
      );
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleLearnSpell = useCallback((spellIndex: string) => {
    setCharacter((prev) => {
      if (!prev) return null;
      const current = prev.spellsKnown || [];
      if (current.includes(spellIndex)) return prev;
      return {
        ...prev,
        spellsKnown: [...current, spellIndex],
      } as DnD5eCharacter;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleForgetSpell = useCallback((spellIndex: string) => {
    setCharacter((prev) => {
      if (!prev) return null;
      const current = prev.spellsKnown || [];
      return {
        ...prev,
        spellsKnown: current.filter((s) => s !== spellIndex),
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
    handleLearnSpell,
    handleForgetSpell,
  };
}
