import { describe, expect, it } from 'vitest';

import { ITEM_GROUP_MATERIALS, spellMaterialOf } from './grimoire-materials';

describe('spellMaterialOf', () => {
  it('uses the damage type when the spell has one', () => {
    expect(spellMaterialOf({ damageType: 'cold', school: 'evocation' })).toBe('glacial-glass');
    expect(spellMaterialOf({ damageType: 'Necrotic', school: 'necromancy' })).toBe('crypt-stone');
  });

  it('does not fall back to the school when the damage type has no material', () => {
    expect(spellMaterialOf({ damageType: 'fire', school: 'abjuration' })).toBeNull();
  });

  it('uses the school when the spell deals no damage', () => {
    expect(spellMaterialOf({ damageType: null, school: 'abjuration' })).toBe('glacial-glass');
    expect(spellMaterialOf({ school: 'divination' })).toBe('divine-parchment');
  });

  it('leaves the card as it is when nothing maps', () => {
    expect(spellMaterialOf({ school: 'illusion' })).toBeNull();
    expect(spellMaterialOf({})).toBeNull();
  });
});

describe('ITEM_GROUP_MATERIALS', () => {
  it('maps every backpack group, some of them to no material', () => {
    expect(ITEM_GROUP_MATERIALS.armor).toBe('crypt-stone');
    expect(ITEM_GROUP_MATERIALS.gear).toBeNull();
  });
});
