import { describe, expect, it } from 'vitest';

import { itemDataSchema, itemTextSchema } from './item.schema';

const plate = {
  id: 'plate-armor',
  category: 'armor',
  value: 150000,
  weight: 65,
  ac: 18,
  strength: 15,
  stealthDisadvantage: true,
};

describe('schema dos itens', () => {
  it('aceita a Armadura de Placas', () => {
    expect(itemDataSchema.safeParse(plate).success).toBe(true);
  });

  it.each([
    ['id com maiúscula', { ...plate, id: 'Plate-Armor' }],
    ['categoria fora da lista', { ...plate, category: 'potion' }],
    ['valor negativo', { ...plate, value: -1 }],
  ])('recusa %s', (_, data) => {
    expect(itemDataSchema.safeParse(data).success).toBe(false);
  });

  it('texto exige nome, descrição é opcional', () => {
    expect(itemTextSchema.safeParse({ name: 'Rope' }).success).toBe(true);
    expect(itemTextSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
