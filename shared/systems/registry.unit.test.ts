import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM, SYSTEMS, fromDbSystem, parseSystemId, toDbSystem } from './registry';

describe('parseSystemId', () => {
  it.each(['dnd5e', 'DnD_5e', 'dnd_5e'])('reads %s as dnd5e', (value) => {
    expect(parseSystemId(value)).toBe('dnd5e');
  });
  it.each(['', 'DND5E ', 'pathfinder_2e', 'ezd6', 'daggerheart'])('rejects %j', (value) => {
    expect(parseSystemId(value)).toBeNull();
  });
});

it('writes dnd5e as the database value dnd_5e and reads it back', () => {
  expect(toDbSystem('dnd5e')).toBe('dnd_5e');
  expect(fromDbSystem('dnd_5e')).toBe('dnd5e');
  expect(fromDbSystem('pathfinder_2e')).toBeNull();
});

it('describes D&D 5e with levels 1 to 20 and its label key', () => {
  expect(SYSTEMS.dnd5e).toEqual({
    id: 'dnd5e',
    dbValue: 'dnd_5e',
    labelKey: 'systems.dnd5e',
    levels: { min: 1, max: 20 },
  });
  expect(DEFAULT_SYSTEM).toBe('dnd5e');
});
