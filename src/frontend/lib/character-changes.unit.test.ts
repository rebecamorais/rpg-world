import { describe, expect, it } from 'vitest';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { characterChanges } from './character-changes';

const base = {
  id: 'c1',
  hpCurrent: 10,
  coins: { cp: 0, sp: 0, ep: 0, gp: 1, pp: 0 },
  attributes: { STR: 10, DEX: 12 },
  skills: { stealth: { isProficient: false } },
} as unknown as DnD5eCharacter;

describe('characterChanges', () => {
  it('manda só os campos editados', () => {
    expect(characterChanges(base, { hpCurrent: 7 })).toEqual({ hpCurrent: 7 });
  });

  it('em attributes e skills manda só as chaves que mudaram', () => {
    const edits = {
      attributes: { STR: 16, DEX: 12 },
      skills: { stealth: { isProficient: false }, arcana: { isProficient: true } },
    } as unknown as Partial<DnD5eCharacter>;

    expect(characterChanges(base, edits)).toEqual({
      attributes: { STR: 16 },
      skills: { arcana: { isProficient: true } },
    });
  });

  it('um campo editado de volta ao valor do servidor não vai', () => {
    const edits = {
      hpCurrent: 10,
      attributes: { STR: 10, DEX: 12 },
    } as unknown as Partial<DnD5eCharacter>;

    expect(characterChanges(base, edits)).toEqual({});
  });
});
