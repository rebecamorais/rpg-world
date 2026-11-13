import { describe, expect, it } from 'vitest';

import { classDataSchema, classTextSchema, classTranslationSchema } from './class.schema';

const rage = {
  id: 'rage',
  feature: 'rage',
  level: 1,
  unit: 'uses',
  max: {
    type: 'steps',
    steps: [
      { level: 1, value: 2 },
      { level: 20, value: null },
    ],
  },
  recovery: [{ rest: 'long', amount: 'all' }],
};

const barbarian = {
  id: 'barbarian',
  hitDie: 12,
  proficiencies: {
    savingThrows: ['STR', 'CON'],
    armor: ['light', 'medium', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skills: { count: 2, from: ['ATHLETICS', 'SURVIVAL'] },
  },
  features: [
    { id: 'rage', level: 1 },
    { id: 'primal-path', level: 3, gainsSubclassFeature: true },
  ],
  resources: [rage],
  choices: [],
  subclasses: [{ id: 'berserker', features: [{ id: 'frenzy', level: 3 }], resources: [] }],
};

describe('schema das classes', () => {
  it('aceita o Bárbaro', () => {
    expect(classDataSchema.safeParse(barbarian).success).toBe(true);
  });

  it.each([
    ['dado de vida que não existe', { ...barbarian, hitDie: 7 }],
    [
      'uma salvaguarda só',
      { ...barbarian, proficiencies: { ...barbarian.proficiencies, savingThrows: ['STR'] } },
    ],
    [
      'perícia fora da lista',
      {
        ...barbarian,
        proficiencies: { ...barbarian.proficiencies, skills: { count: 1, from: ['FLYING'] } },
      },
    ],
    ['nível 21', { ...barbarian, features: [{ id: 'rage', level: 21 }] }],
    ['sem subclasse', { ...barbarian, subclasses: [] }],
    [
      'degraus que descem de nível',
      {
        ...barbarian,
        resources: [
          {
            ...rage,
            max: {
              type: 'steps',
              steps: [
                { level: 3, value: 3 },
                { level: 1, value: 2 },
              ],
            },
          },
        ],
      },
    ],
    ['recurso que nunca volta', { ...barbarian, resources: [{ ...rage, recovery: [] }] }],
    [
      'descanso que não existe',
      { ...barbarian, resources: [{ ...rage, recovery: [{ rest: 'nap', amount: 'all' }] }] },
    ],
  ])('recusa %s', (_, data) => {
    expect(classDataSchema.safeParse(data).success).toBe(false);
  });

  it('aceita máximo pelo nível da classe ou por atributo, e o dado que escala', () => {
    const resources = [
      { ...rage, id: 'ki', max: { type: 'classLevel', multiplier: 1 } },
      {
        ...rage,
        id: 'bardic-inspiration',
        max: { type: 'ability', ability: 'CHA', bonus: 0, minimum: 1 },
        recovery: [
          { rest: 'long', amount: 'all' },
          { rest: 'short', amount: 'all', fromLevel: 5 },
        ],
        die: [
          { level: 1, value: 6 },
          { level: 5, value: 8 },
        ],
      },
    ];
    expect(classDataSchema.safeParse({ ...barbarian, resources }).success).toBe(true);
  });

  it('texto em inglês exige nome e descrição; a tradução pode faltar campos', () => {
    const text = {
      name: 'Barbarian',
      subclassTitle: 'Primal Path',
      features: { rage: { name: 'Rage', description: 'In battle…' } },
      resources: { rage: { name: 'Rage' } },
      choices: {},
      subclasses: { berserker: { name: 'Path of the Berserker', features: {}, resources: {} } },
    };
    expect(classTextSchema.safeParse(text).success).toBe(true);
    expect(
      classTextSchema.safeParse({ ...text, features: { rage: { name: 'Rage' } } }).success,
    ).toBe(false);
    expect(
      classTranslationSchema.safeParse({ features: { rage: { name: 'Fúria' } } }).success,
    ).toBe(true);
  });
});
