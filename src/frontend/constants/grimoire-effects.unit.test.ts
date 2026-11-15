import { describe, expect, it } from 'vitest';

import { DAMAGE_THEMES, SCHOOL_THEMES } from './damage-themes';
import { spellEffectOf } from './grimoire-effects';

describe('spellEffectOf', () => {
  it('uses the damage type first, then the school', () => {
    expect(spellEffectOf({ damageType: 'Cold', school: 'abjuration' })).toBe('frost-crystals');
    expect(spellEffectOf({ damageType: null, school: 'abjuration' })).toBe('ward-mesh');
  });

  it('gives every damage type and every school an effect', () => {
    for (const damageType of Object.keys(DAMAGE_THEMES)) {
      expect(spellEffectOf({ damageType }), damageType).not.toBeNull();
    }
    for (const school of Object.keys(SCHOOL_THEMES)) {
      expect(spellEffectOf({ school }), school).not.toBeNull();
    }
  });

  it('returns null when nothing maps', () => {
    expect(spellEffectOf({})).toBeNull();
  });
});
