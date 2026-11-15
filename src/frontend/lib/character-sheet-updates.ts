import type { DraftPatch } from '@frontend/hooks/useDraft';

import type { SkillKey } from '@shared/systems/dnd5e/constants';
import type { AttributeKey, CharacterSkill, DnD5eCharacter } from '@shared/systems/dnd5e/types';

/*
 * Edits the sheet makes to a character, as patches for `update()` (see useDraft). Plain fields
 * need no helper (`update({ ac: 15 })`); these cover the nested ones. They only touch what the
 * player changed: derived values (modifiers, skill totals, passive perception) are computed on
 * display by `@shared/systems/dnd5e/calculations`, never stored.
 */

type Patch = DraftPatch<DnD5eCharacter>;

export const setAttribute =
  (key: AttributeKey, value: number): Patch =>
  (c) => ({ attributes: { ...c.attributes, [key]: value } });

export const setAttributes = (attributes: Record<AttributeKey, number>): Patch => ({
  attributes,
});

export const setSkill =
  (key: SkillKey, skill: CharacterSkill): Patch =>
  (c) => ({ skills: { ...c.skills, [key]: skill } });

export const setSavingThrow =
  (key: AttributeKey, isProficient: boolean): Patch =>
  (c) => ({
    savingThrowProficiencies: { ...c.savingThrowProficiencies, [key]: isProficient },
  });

export const setSpellPoints =
  (field: 'current' | 'max', value: number): Patch =>
  (c) => ({
    spellPoints: {
      current: c.spellPoints?.current ?? 0,
      max: c.spellPoints?.max ?? 0,
      [field]: value,
    },
  });

export const setSpellSlots =
  (level: string, max: number, used: number): Patch =>
  (c) => ({ spellSlots: { ...c.spellSlots, [level]: { max, used } } });

export const setHitDice =
  (total: string): Patch =>
  (c) => ({ hitDice: { total, current: c.hitDice?.current ?? c.level } });

/** Saved with `saveNow`, the patch reads the server copy: a pending die edit stays pending. */
export const setHitDiceRemaining =
  (current: number): Patch =>
  (c) => ({ hitDice: { total: c.hitDice?.total ?? '', current } });

/**
 * Changes the level. Hit dice left follow it: a new level brings its die already available, a
 * lower one caps them. A sheet that never set them keeps having them all.
 */
export const setLevel =
  (level: number): Patch =>
  (c) =>
    c.hitDice?.current === undefined
      ? { level }
      : {
          level,
          hitDice: {
            ...c.hitDice,
            current: Math.min(Math.max(c.hitDice.current + level - c.level, 0), level),
          },
        };

/** The die's sides in a hit dice total (`5d10` → 10), or null without a die. */
export const hitDieSides = (total: string | undefined): number | null => {
  const sides = total?.match(/d(\d+)$/)?.[1];
  return sides ? Number(sides) : null;
};

/** Hit dice left to spend, between 0 and the level. A sheet that never set them has them all. */
export const hitDiceAvailable = (c: Pick<DnD5eCharacter, 'hitDice' | 'level'>) =>
  Math.min(Math.max(c.hitDice?.current ?? c.level, 0), c.level);

export const setResourceUsed =
  (key: string, used: number): Patch =>
  (c) => ({ resources: { ...c.resources, [key]: { ...c.resources?.[key], used } } });

export const setDeathSaves = (successes: number, failures: number): Patch => ({
  deathSaves: { successes, failures },
});
