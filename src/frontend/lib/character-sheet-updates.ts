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
  (c) => ({ hitDice: { total, current: c.hitDice?.current ?? 0 } });

export const setDeathSaves = (successes: number, failures: number): Patch => ({
  deathSaves: { successes, failures },
});
