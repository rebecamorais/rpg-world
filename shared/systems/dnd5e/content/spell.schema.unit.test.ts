import { describe, expect, it } from 'vitest';

import { spellDataSchema, spellTextSchema } from './spell.schema';

const fireball = {
  id: 'fireball',
  level: 3,
  school: 'evocation',
  classes: ['sorcerer', 'wizard'],
  components: ['V', 'S', 'M'],
  castingTime: 'action',
  castingValue: 1,
  rangeUnit: 'feet',
  rangeValue: 150,
  durationUnit: 'instantaneous',
  durationValue: null,
  concentration: false,
  ritual: false,
  isScaling: true,
  materialCost: 0,
  damageType: 'fire',
  spellCategory: null,
  bgStyleId: 'classic-aura',
};

describe('schemas de magia', () => {
  it('aceita uma magia completa', () => {
    expect(spellDataSchema.safeParse(fireball).success).toBe(true);
  });

  it.each([
    ['nível 10', { level: 10 }],
    ['componente desconhecido', { components: ['X'] }],
    ['categoria desconhecida', { spellCategory: 'damage' }],
  ])('recusa %s', (_, patch) => {
    expect(spellDataSchema.safeParse({ ...fireball, ...patch }).success).toBe(false);
  });

  it('texto sem "em níveis superiores" nem material omite os campos', () => {
    expect(spellTextSchema.safeParse({ name: 'Light', description: 'Glow.' }).success).toBe(true);
    expect(
      spellTextSchema.safeParse({ name: 'Light', description: 'Glow.', material: null }).success,
    ).toBe(false);
  });

  it('texto precisa de nome e descrição', () => {
    expect(spellTextSchema.safeParse({ name: 'Fireball', description: 'Boom.' }).success).toBe(
      true,
    );
    expect(spellTextSchema.safeParse({ name: '', description: 'x' }).success).toBe(false);
  });
});
