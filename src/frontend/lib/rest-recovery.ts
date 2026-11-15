import { type ResourceBox, recoveryOn } from '@shared/systems/dnd5e/class-resources';
import { readHitDice } from '@shared/systems/dnd5e/hit-dice';
import { effectiveState } from '@shared/systems/dnd5e/sheet-values';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

/**
 * What a rest gives back by itself, as one change to the sheet, and the checklist items it
 * covers (ids from `buildRestChecklist`). Spending hit dice and pact slots stay with the player:
 * they're choices, or depend on how the sheet tracks them.
 * `boxes` give each box's size and recovery; how much is used is read from `character`.
 */
export function restRecovery(
  rest: 'short' | 'long',
  character: DnD5eCharacter,
  boxes: ResourceBox[],
): { fields: Partial<DnD5eCharacter>; items: string[] } {
  const fields: Partial<DnD5eCharacter> = {};
  const items: string[] = [];

  if (rest === 'long') {
    fields.hpCurrent = Math.max(character.hpCurrent ?? 0, character.hpMax ?? 0);
    items.push('full-hp');

    const back = Math.max(1, Math.floor(character.level / 2));
    const { die, spent } = readHitDice(character.hitDice, character.level);
    // From what the sheet shows: spent dice a lower level hides don't hold the recovery back
    const stillSpent = Math.max(effectiveState(spent, character.level) - back, 0);
    fields.hitDice = { ...(die && { die }), spent: stillSpent };
    items.push('hit-dice-back');

    if (character.spellcastingSystem === 'slots') {
      const slots = Object.entries(character.spellSlots ?? {});
      if (slots.some(([, slot]) => slot.max > 0)) {
        fields.spellSlots = Object.fromEntries(
          slots.map(([level, slot]) => [level, { ...slot, used: 0 }]),
        );
        items.push('spell-slots');
      }
    } else if ((character.spellPoints?.max ?? 0) > 0) {
      fields.spellPoints = { current: character.spellPoints!.max, max: character.spellPoints!.max };
      items.push('spell-points');
    }
  }

  const resources = { ...character.resources };
  for (const box of boxes) {
    const amount = recoveryOn(box, rest);
    if (amount === null || box.max === null) continue;
    const state = resources[box.key] ?? { used: 0 };
    const used = amount === 'all' ? 0 : Math.max(0, state.used - amount);
    resources[box.key] = { ...state, used };
    items.push(`box:${box.key}`);
  }
  if (items.some((id) => id.startsWith('box:'))) fields.resources = resources;

  return { fields, items };
}
