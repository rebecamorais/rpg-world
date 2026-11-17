import { describe, expect, it } from 'vitest';

import { EFFECTS } from '@frontend/components/grimoire/card-effect/types';

import { DAMAGE_THEMES, SCHOOL_THEMES } from './damage-themes';
import { spellEffectOf } from './grimoire-effects';

describe('spellEffectOf', () => {
  it('uses the damage type first, then the school', () => {
    expect(spellEffectOf({ damageType: 'Cold', school: 'abjuration' })).toBe('frost-crystals');
    expect(spellEffectOf({ damageType: null, school: 'abjuration' })).toBe('abjuration-aegis-ward');
  });

  it('gives each of the 13 damage types and 8 schools an effect from the catalog', () => {
    expect(Object.keys(DAMAGE_THEMES)).toHaveLength(13);
    expect(Object.keys(SCHOOL_THEMES)).toHaveLength(8);
    for (const damageType of Object.keys(DAMAGE_THEMES)) {
      expect(EFFECTS, damageType).toHaveProperty([spellEffectOf({ damageType })!]);
    }
    for (const school of Object.keys(SCHOOL_THEMES)) {
      expect(EFFECTS, school).toHaveProperty([spellEffectOf({ school })!]);
    }
  });

  it('returns null when nothing maps', () => {
    expect(spellEffectOf({})).toBeNull();
  });
});
