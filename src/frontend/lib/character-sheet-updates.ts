import type { SkillKey } from '@shared/systems/dnd5e/constants';
import type { AttributeKey, CharacterSkill, DnD5eCharacter } from '@shared/systems/dnd5e/types';

/*
 * Edits the sheet makes to a character. They only touch the fields the player changed:
 * derived values (modifiers, skill totals, passive perception) are computed on display by
 * `@shared/systems/dnd5e/calculations`, never stored.
 */

export function withAttribute(
  character: DnD5eCharacter,
  key: AttributeKey,
  value: number,
): DnD5eCharacter {
  return { ...character, attributes: { ...character.attributes, [key]: value } };
}

export function withSkill(
  character: DnD5eCharacter,
  key: SkillKey,
  skill: CharacterSkill,
): DnD5eCharacter {
  return { ...character, skills: { ...character.skills, [key]: skill } };
}
