import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { withAttribute, withSkill } from './character-sheet-updates';

const character = {
  ...createDnD5eCharacter('owner-1', 'Thor'),
  id: 'char-1',
  passivePerception: 12, // legacy value stored by older versions of the editor
} as DnD5eCharacter;

describe('withAttribute', () => {
  it('changes only the given attribute', () => {
    const updated = withAttribute(character, 'WIS', 16);
    expect(updated.attributes).toEqual({ ...character.attributes, WIS: 16 });
    expect(character.attributes.WIS).toBe(10);
  });

  it('does not write the derived passive perception', () => {
    expect(withAttribute(character, 'WIS', 18).passivePerception).toBe(12);
  });
});

describe('withSkill', () => {
  it('sets the skill proficiency', () => {
    const updated = withSkill(character, 'PERCEPTION', { isProficient: true, expertise: true });
    expect(updated.skills.PERCEPTION).toEqual({ isProficient: true, expertise: true });
  });

  it('does not write the derived passive perception', () => {
    const updated = withSkill(character, 'PERCEPTION', { isProficient: true });
    expect(updated.passivePerception).toBe(12);
  });
});
