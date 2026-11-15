import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  halfProficiencyAt,
  pactMagic,
  slotMaximums,
  spellCounts,
  tableValue,
} from './class-progression';
import type { ClassData } from './content/class.schema';
import type { AttributeKey } from './types';

/*
 * The numbers below are the SRD 5.1 class tables, typed from the book (and from the map in
 * docs/class-sheet-map.md), one value per class level, 1 to 20. They are checked against the
 * content the sheet reads, so a wrong import or a wrong formula shows up in the level it breaks.
 */

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];
const classOf = (id: string) => {
  const found = classes.find((c) => c.id === id);
  if (!found) throw new Error(`no class ${id}`);
  return found;
};
const castingOf = (id: string) => {
  const { spellcasting } = classOf(id);
  if (!spellcasting) throw new Error(`${id} casts no spells`);
  return spellcasting;
};

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const ATTRS: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

const FULL = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

// The paladin and ranger tables
const HALF = [
  [],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];

describe('espaços de magia por nível (SRD 5.1)', () => {
  it.each(['bard', 'cleric', 'druid', 'sorcerer', 'wizard'])(
    '%s: conjurador completo, nível 1 a 20',
    (id) => {
      const { progression } = castingOf(id);
      expect(LEVELS.map((level) => slotMaximums(progression, level))).toEqual(FULL);
    },
  );

  it.each(['paladin', 'ranger'])('%s: meio conjurador, nível 1 a 20', (id) => {
    const { progression } = castingOf(id);
    expect(LEVELS.map((level) => slotMaximums(progression, level))).toEqual(HALF);
  });

  it('meio conjurador não tem espaço no nível 1', () => {
    expect(slotMaximums('half', 1)).toEqual([]);
    expect(slotMaximums('half', 2)).toEqual([2]);
  });

  it('bárbaro, guerreiro, monge e ladino não conjuram', () => {
    for (const id of ['barbarian', 'fighter', 'monk', 'rogue']) {
      expect(classOf(id).spellcasting).toBeUndefined();
    }
  });

  it('nível fora de 1 a 20: nada abaixo, o nível 20 acima', () => {
    expect(slotMaximums('full', 0)).toEqual([]);
    expect(slotMaximums('full', 25)).toEqual(FULL[19]);
  });

  it('devolve uma cópia: mudar o resultado não muda a tabela', () => {
    slotMaximums('full', 1).push(99);
    expect(slotMaximums('full', 1)).toEqual([2]);
  });
});

describe('Magia de Pacto (SRD 5.1)', () => {
  const warlock = classOf('warlock');
  const SLOTS = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
  const SPELL_LEVEL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

  it('quantos espaços e de que círculo, nível 1 a 20: todos no mesmo círculo', () => {
    expect(LEVELS.map((level) => pactMagic(warlock.resources, level))).toEqual(
      LEVELS.map((_, i) => ({ slots: SLOTS[i], spellLevel: SPELL_LEVEL[i] })),
    );
  });

  it('o bruxo não entra na tabela de espaços comuns', () => {
    expect(LEVELS.flatMap((level) => slotMaximums('pact', level))).toEqual([]);
  });

  it('classe sem Magia de Pacto é null', () => {
    expect(pactMagic(classOf('wizard').resources, 5)).toBeNull();
    expect(pactMagic(warlock.resources, 0)).toBeNull();
  });
});

describe('truques e magias por nível (SRD 5.1)', () => {
  const counts = (id: string, attributes = ATTRS) =>
    LEVELS.map((level) => spellCounts(castingOf(id), level, attributes));

  it.each([
    ['bard', [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]],
    ['cleric', [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
    ['druid', [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]],
    ['sorcerer', [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]],
    ['warlock', [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]],
    ['wizard', [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
    ['paladin', Array.from({ length: 20 }, () => 0)],
    ['ranger', Array.from({ length: 20 }, () => 0)],
  ])('%s: truques conhecidos', (id, expected) => {
    expect(counts(id).map((c) => c.cantrips)).toEqual(expected);
  });

  it.each([
    // Magical Secrets (10, 14, 18) are already in the bard's numbers
    ['bard', [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]],
    ['sorcerer', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]],
    ['warlock', [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]],
    ['ranger', [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]],
  ])('%s: magias conhecidas, e nenhuma preparada', (id, expected) => {
    expect(counts(id).map((c) => c.known)).toEqual(expected);
    expect(counts(id).every((c) => c.prepared === null)).toBe(true);
  });

  it.each(['cleric', 'druid', 'wizard'])('%s: prepara modificador + nível, no mínimo 1', (id) => {
    const ability = castingOf(id).ability;
    // +3 no atributo
    expect(counts(id, { ...ATTRS, [ability]: 16 }).map((c) => c.prepared)).toEqual(
      LEVELS.map((level) => level + 3),
    );
    // -1 no atributo: nível 1 daria 0
    expect(counts(id, { ...ATTRS, [ability]: 8 }).map((c) => c.prepared)).toEqual(
      LEVELS.map((level) => Math.max(1, level - 1)),
    );
    expect(counts(id).every((c) => c.known === null)).toBe(true);
  });

  it('paladino: modificador de CAR + metade do nível (pra baixo), a partir do nível 2', () => {
    expect(counts('paladin', { ...ATTRS, CHA: 16 }).map((c) => c.prepared)).toEqual([
      null,
      4,
      4,
      5,
      5,
      6,
      6,
      7,
      7,
      8,
      8,
      9,
      9,
      10,
      10,
      11,
      11,
      12,
      12,
      13,
    ]);
    expect(spellCounts(castingOf('paladin'), 2, { ...ATTRS, CHA: 6 }).prepared).toBe(1);
  });

  it('mago: o grimório tem 6 magias no nível 1 e ganha 2 por nível', () => {
    expect(counts('wizard').map((c) => c.spellbook)).toEqual(LEVELS.map((level) => 4 + 2 * level));
    expect(counts('cleric').every((c) => c.spellbook === null)).toBe(true);
  });
});

describe('números da tabela da classe (SRD 5.1)', () => {
  const table = (classId: string, id: string) => {
    const found = classOf(classId).tables?.find((t) => t.id === id);
    if (!found) throw new Error(`no table ${classId}/${id}`);
    return found;
  };
  const values = (classId: string, id: string) =>
    LEVELS.map((level) => tableValue(table(classId, id), level));

  it('dano de fúria: +2, +3 no nível 9, +4 no 16', () => {
    expect(table('barbarian', 'rage-damage').kind).toBe('bonus');
    expect(values('barbarian', 'rage-damage')).toEqual([
      2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4,
    ]);
  });

  it('Artes Marciais: d4, d6 no nível 5, d8 no 11, d10 no 17', () => {
    expect(table('monk', 'martial-arts').kind).toBe('die');
    expect(values('monk', 'martial-arts')).toEqual([
      4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10,
    ]);
  });

  it('Movimento sem Armadura: em pés, do nível 2 em diante', () => {
    expect(table('monk', 'unarmored-movement').kind).toBe('speed');
    expect(values('monk', 'unarmored-movement')).toEqual([
      null,
      10,
      10,
      10,
      10,
      15,
      15,
      15,
      15,
      20,
      20,
      20,
      20,
      25,
      25,
      25,
      25,
      30,
      30,
      30,
    ]);
  });

  it('Ataque Furtivo: um d6 a mais a cada nível ímpar', () => {
    expect(table('rogue', 'sneak-attack')).toMatchObject({ kind: 'dice', faces: 6 });
    expect(values('rogue', 'sneak-attack')).toEqual(LEVELS.map((level) => Math.ceil(level / 2)));
  });

  it('cada tabela aponta para uma característica da própria classe', () => {
    for (const c of classes) {
      for (const t of c.tables ?? []) {
        expect(c.features.map((f) => f.id)).toContain(t.feature);
      }
    }
  });
});

describe('quem tem meia proficiência', () => {
  it('bardo: Pau pra Toda Obra do nível 2 em diante, pra baixo, em todo atributo', () => {
    const { features } = classOf('bard');
    expect(halfProficiencyAt(features, 1)).toBeNull();
    expect(halfProficiencyAt(features, 2)).toEqual({ rounding: 'down' });
  });

  it('Campeão: Atleta Extraordinário no nível 7, pra cima, só FOR, DES e CON', () => {
    const fighter = classOf('fighter');
    const withChampion = [...fighter.features, ...fighter.subclasses[0].features];
    expect(halfProficiencyAt(withChampion, 6)).toBeNull();
    expect(halfProficiencyAt(withChampion, 7)).toEqual({
      rounding: 'up',
      abilities: ['STR', 'DEX', 'CON'],
    });
    // Without the subclass the fighter has none
    expect(halfProficiencyAt(fighter.features, 20)).toBeNull();
  });

  it('as outras classes não têm', () => {
    for (const c of classes.filter((c) => c.id !== 'bard' && c.id !== 'fighter')) {
      expect(halfProficiencyAt([...c.features, ...c.subclasses[0].features], 20)).toBeNull();
    }
  });
});
