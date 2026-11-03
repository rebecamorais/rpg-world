import { describe, expect, it } from 'vitest';

import {
  type FiveToolsItem,
  isCommonSrdItem,
  toItemData,
  toItemId,
  toItemText,
} from './5etools-items';

// Real 5etools objects (v2.38.0), without the fields the conversion ignores.
const plate: FiveToolsItem = {
  name: 'Plate Armor',
  source: 'XPHB',
  srd52: true,
  type: 'HA|XPHB',
  rarity: 'none',
  weight: 65,
  value: 150000,
  ac: 18,
  strength: '15',
  stealth: true,
};

const longsword: FiveToolsItem = {
  name: 'Longsword',
  source: 'XPHB',
  srd52: true,
  type: 'M|XPHB',
  rarity: 'none',
  weight: 3,
  value: 1500,
  property: ['V|XPHB'],
  dmg1: '1d8',
  dmgType: 'S',
  dmg2: '1d10',
};

const shield: FiveToolsItem = {
  name: 'Shield',
  source: 'PHB',
  srd: true,
  type: 'S',
  rarity: 'none',
  weight: 6,
  value: 1000,
  ac: 2,
  entries: [
    'A shield is made from wood or metal and is carried in one hand. Wielding a shield increases your Armor Class by 2. You can benefit from only one shield at a time.',
  ],
};

const rope: FiveToolsItem = {
  name: 'Hempen Rope (50 feet)',
  source: 'PHB',
  srd: true,
  type: 'G',
  rarity: 'none',
  weight: 10,
  value: 100,
  entries: [
    'Rope, whether made of hemp or silk, has 2 hit points and can be burst with a {@dc 17} Strength check.',
  ],
};

const backpack: FiveToolsItem = {
  name: 'Backpack',
  source: 'XPHB',
  srd52: true,
  type: 'G|XPHB',
  rarity: 'none',
  weight: 5,
  value: 200,
  entries: [
    'A Backpack holds up to 30 pounds within 1 cubic foot. It can also serve as a saddlebag.',
  ],
};

const scholarsPack: FiveToolsItem = {
  name: "Scholar's Pack",
  source: 'XPHB',
  srd52: true,
  type: 'G|XPHB',
  rarity: 'none',
  weight: 22,
  value: 4000,
  entries: [
    "A Scholar's Pack contains the following items: {@item Backpack|XPHB}, {@item Book|XPHB}.",
  ],
  packContents: ['backpack|xphb', 'book|xphb', { item: 'oil|xphb', quantity: 10 }],
};

const arrows: FiveToolsItem = {
  name: 'Arrows (20)',
  source: 'PHB',
  srd: true,
  type: 'A',
  rarity: 'none',
  weight: 1,
  value: 100,
  packContents: [{ item: 'arrow|phb', quantity: 20 }],
};

const dart: FiveToolsItem = {
  name: 'Dart',
  source: 'XPHB',
  srd52: true,
  type: 'R|XPHB',
  rarity: 'none',
  weight: 0.25,
  value: 5,
  property: ['F|XPHB', 'T|XPHB'],
  range: '20/60',
  dmg1: '1d4',
  dmgType: 'P',
};

const healing: FiveToolsItem = {
  name: 'Potion of Healing',
  source: 'XPHB',
  srd52: true,
  type: 'P|XPHB',
  rarity: 'common',
  weight: 0.5,
  value: 5000,
};

describe('conversão de itens do 5etools', () => {
  it('converte a Armadura de Placas', () => {
    expect(toItemData(plate)).toEqual({
      id: 'plate-armor',
      category: 'armor',
      value: 150000,
      weight: 65,
      ac: 18,
      strength: 15,
      stealthDisadvantage: true,
    });
  });

  it('converte a Espada Longa com dano, versátil e propriedades', () => {
    expect(toItemData(longsword)).toEqual({
      id: 'longsword',
      category: 'weapon',
      value: 1500,
      weight: 3,
      damage: { dice: '1d8', type: 'slashing' },
      versatile: '1d10',
      properties: ['V'],
    });
  });

  it('converte o alcance de uma arma de arremesso', () => {
    expect(toItemData(dart)).toMatchObject({
      damage: { dice: '1d4', type: 'piercing' },
      properties: ['F', 'T'],
      range: '20/60',
    });
  });

  it('classifica escudo, equipamento, kit e munição', () => {
    expect(toItemData(shield)).toMatchObject({ category: 'shield', ac: 2 });
    expect(toItemData(rope).category).toBe('gear');
    expect(toItemData(backpack).category).toBe('gear');
    expect(toItemData(scholarsPack).category).toBe('kit');
    expect(toItemData(arrows).category).toBe('ammunition');
  });

  it('item sem tipo é equipamento e tipo desconhecido é outro', () => {
    expect(toItemData({ name: 'X', source: 'PHB' }).category).toBe('gear');
    expect(toItemData({ name: 'X', source: 'PHB', type: 'ZZ' }).category).toBe('other');
  });

  it('só aceita item comum do SRD do livro pedido', () => {
    expect(isCommonSrdItem(plate, 'srd-5.2')).toBe(true);
    expect(isCommonSrdItem(plate, 'srd-5.1')).toBe(false);
    expect(isCommonSrdItem(shield, 'srd-5.1')).toBe(true);
    expect(isCommonSrdItem({ ...shield, rarity: undefined }, 'srd-5.1')).toBe(true);
    expect(isCommonSrdItem({ ...shield, srd: undefined }, 'srd-5.1')).toBe(false);
    expect(isCommonSrdItem(healing, 'srd-5.2')).toBe(false);
  });

  it('o texto mantém as tags do 5etools', () => {
    expect(toItemText(rope)).toEqual({
      name: 'Hempen Rope (50 feet)',
      description:
        'Rope, whether made of hemp or silk, has 2 hit points and can be burst with a {@dc 17} Strength check.',
    });
    expect(toItemText(scholarsPack).description).toContain('{@item Backpack|XPHB}');
  });

  it('item sem entries não tem descrição', () => {
    expect(toItemText(plate)).toEqual({ name: 'Plate Armor' });
  });

  it('o id vem do nome em inglês', () => {
    expect(toItemId(arrows)).toBe('arrows-20');
  });
});
