import { describe, expect, it } from 'vitest';

import {
  type ClassContext,
  type FiveToolsClass,
  type FiveToolsClassFile,
  type FiveToolsFeature,
  cellValue,
  isSrdClass,
  toClass,
  toProficiencies,
  toResource,
  toSteps,
  withIds,
} from './5etools-classes';

// Real 5etools objects (v2.38.0), without the fields the conversion ignores and with shorter texts.
const barbarian: FiveToolsClass = {
  name: 'Barbarian',
  source: 'PHB',
  srd: true,
  hd: { number: 1, faces: 12 },
  proficiency: ['str', 'con'],
  startingProficiencies: {
    skills: [{ choose: { from: ['animal handling', 'athletics'], count: 2 } }],
    weapons: ['simple', 'martial'],
    armor: ['light', 'medium', 'shield'],
    armorProficiencies: [{ light: true, medium: true, shield: true }],
  },
  classTableGroups: [
    {
      colLabels: ['Rages', 'Rage Damage'],
      rows: [
        ...Array.from({ length: 2 }, () => ['2', { type: 'bonus' as const, value: 2 }]),
        ...Array.from({ length: 3 }, () => ['3', { type: 'bonus' as const, value: 2 }]),
        ...Array.from({ length: 6 }, () => ['4', { type: 'bonus' as const, value: 3 }]),
        ...Array.from({ length: 5 }, () => ['5', { type: 'bonus' as const, value: 3 }]),
        ...Array.from({ length: 3 }, () => ['6', { type: 'bonus' as const, value: 4 }]),
        ['Unlimited', { type: 'bonus' as const, value: 4 }],
      ],
    },
  ],
  classFeatures: [
    'Rage|Barbarian||1',
    { classFeature: 'Primal Path|Barbarian||3', gainSubclassFeature: true },
    'Primal Knowledge|Barbarian||3|TCE',
    'Ability Score Improvement|Barbarian||4',
    'Ability Score Improvement|Barbarian||8',
  ],
  subclassTitle: 'Primal Path',
};

const feature = (name: string, level: number, entries: FiveToolsFeature['entries']) => ({
  name,
  source: 'PHB',
  srd: true,
  className: 'Barbarian',
  classSource: 'PHB',
  level,
  entries,
});

const file: FiveToolsClassFile = {
  class: [barbarian],
  subclass: [
    {
      name: 'Path of the Berserker',
      shortName: 'Berserker',
      source: 'PHB',
      className: 'Barbarian',
      classSource: 'PHB',
      srd: true,
      subclassFeatures: ['Path of the Berserker|Barbarian||Berserker||3'],
    },
    {
      name: 'Path of the Totem Warrior',
      shortName: 'Totem Warrior',
      source: 'PHB',
      className: 'Barbarian',
      classSource: 'PHB',
      subclassFeatures: [],
    },
  ],
  classFeature: [
    feature('Rage', 1, ['In battle, you fight with primal ferocity.']),
    feature('Primal Path', 3, ['At 3rd level, you choose a path.']),
    {
      ...feature('Primal Knowledge', 3, ['You gain proficiency in one skill.']),
      source: 'TCE',
      srd: undefined,
    },
    feature('Ability Score Improvement', 4, ['You can increase one ability score by 2.']),
    feature('Ability Score Improvement', 8, ['You can increase one ability score by 2.']),
  ],
  subclassFeature: [
    {
      ...feature('Path of the Berserker', 3, [
        'For some barbarians, rage is a means to an end.',
        { type: 'refSubclassFeature', subclassFeature: 'Frenzy|Barbarian||Berserker||3' },
      ]),
      subclassShortName: 'Berserker',
      subclassSource: 'PHB',
    },
    {
      ...feature('Frenzy', 3, ['You can go into a frenzy when you rage.']),
      subclassShortName: 'Berserker',
      subclassSource: 'PHB',
    },
  ],
};

const ctx: ClassContext = { book: 'srd-5.1', file, inSrd: () => true };

const rage = {
  id: 'rage',
  name: 'Rage',
  feature: 'rage',
  unit: 'uses' as const,
  max: { column: 'Rages' },
  recovery: [{ rest: 'long' as const, amount: 'all' as const }],
};

describe('conversão das classes do 5etools', () => {
  const { data, text } = toClass(barbarian, ctx, { class: [rage], subclass: [] });

  it('só a classe do SRD do livro', () => {
    expect(isSrdClass(barbarian, 'srd-5.1')).toBe(true);
    expect(isSrdClass(barbarian, 'srd-5.2')).toBe(false);
  });

  it('dado de vida, salvaguardas e o id vêm da classe', () => {
    expect(data.id).toBe('barbarian');
    expect(data.hitDie).toBe(12);
    expect(data.proficiencies.savingThrows).toEqual(['STR', 'CON']);
  });

  it('deixa de fora as características fora do SRD e marca onde entra a subclasse', () => {
    expect(data.features).toEqual([
      { id: 'rage', level: 1 },
      { id: 'primal-path', level: 3, gainsSubclassFeature: true },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
    ]);
  });

  it('só a subclasse do SRD, com a característica referenciada dentro do texto', () => {
    expect(data.subclasses).toEqual([
      { id: 'berserker', features: [{ id: 'path-of-the-berserker', level: 3 }], resources: [] },
    ]);
    expect(text.subclasses.berserker.features['path-of-the-berserker'].description).toBe(
      'For some barbarians, rage is a means to an end.\nFrenzy. You can go into a frenzy when you rage.',
    );
  });

  it('o máximo da Fúria vem da tabela da classe, ilimitado no nível 20', () => {
    expect(data.resources[0]).toMatchObject({
      id: 'rage',
      feature: 'rage',
      level: 1,
      max: {
        type: 'steps',
        steps: [
          { level: 1, value: 2 },
          { level: 3, value: 3 },
          { level: 6, value: 4 },
          { level: 12, value: 5 },
          { level: 17, value: 6 },
          { level: 20, value: null },
        ],
      },
    });
    expect(text.resources).toEqual({ rage: { name: 'Rage' } });
  });

  it('textos traduzíveis: nome, título da subclasse e características', () => {
    expect(text.name).toBe('Barbarian');
    expect(text.subclassTitle).toBe('Primal Path');
    expect(text.features.rage).toEqual({
      name: 'Rage',
      description: 'In battle, you fight with primal ferocity.',
    });
  });

  it('recusa um recurso de uma característica que não existe', () => {
    expect(() => toResource({ ...rage, feature: 'frenzy' }, barbarian, data.features)).toThrow(
      'no feature "frenzy"',
    );
  });

  it('recusa um máximo da tabela que começa em outro nível', () => {
    expect(() => toResource({ ...rage, level: 2 }, barbarian, data.features)).toThrow(
      'gained at 2, the maximum starts at 1',
    );
  });
});

describe('textos das características', () => {
  const withEntries = (
    entries: FiveToolsFeature['entries'],
    inSrd: ClassContext['inSrd'] = () => true,
  ) => {
    const one: FiveToolsClass = { ...barbarian, classFeatures: ['Rage|Barbarian||1'] };
    const rageWith = { ...file.classFeature[0], entries };
    return toClass(
      one,
      { book: 'srd-5.1', file: { ...file, classFeature: [rageWith] }, inSrd },
      { class: [], subclass: [] },
    ).text.features.rage.description;
  };

  it('a CD e o ataque de magia viram uma linha', () => {
    expect(
      withEntries([
        { type: 'abilityDc', name: 'Spell', attributes: ['cha'] },
        { type: 'abilityAttackMod', name: 'Spell', attributes: ['cha'] },
      ]),
    ).toBe(
      'Spell save DC = 8 + your proficiency bonus + your Charisma modifier\n' +
        'Spell attack modifier = your proficiency bonus + your Charisma modifier',
    );
  });

  it('as opções listadas viram tags, só as do SRD', () => {
    const entries = [
      { type: 'refOptionalfeature', optionalfeature: 'Archery' },
      { type: 'refOptionalfeature', optionalfeature: 'Blind Fighting|TCE' },
      { type: 'refFeat', feat: 'Archery|XPHB' },
    ];
    expect(withEntries(entries, (_, name) => name === 'Archery')).toBe(
      '• {@optfeature Archery|PHB}\n• {@feat Archery|XPHB}',
    );
  });

  it('recusa um tipo de bloco que não conhece', () => {
    expect(() => withEntries([{ type: 'statblock', name: 'Wolf' }])).toThrow('statblock');
  });
});

describe('tabela da classe', () => {
  it.each([
    [3, 3],
    ['12', 12],
    ['Unlimited', null],
    ['{@filter 3rd|spells|level=3|class=Warlock}', 3],
    [{ type: 'dice' as const, toRoll: [{ number: 1, faces: 8 }] }, 8],
    [{ type: 'bonus' as const, value: 2 }, 2],
  ])('lê a célula %j', (cell, value) => {
    expect(cellValue(cell)).toBe(value);
  });

  it('recusa uma célula que não conhece', () => {
    expect(() => cellValue({ type: 'dice', toRoll: [{ number: 2, faces: 6 }] })).toThrow();
  });

  it('degraus só onde o valor muda, sem os zeros do começo', () => {
    expect(toSteps([0, 2, 2, 3])).toEqual([
      { level: 2, value: 2 },
      { level: 4, value: 3 },
    ]);
  });

  it('nome repetido ganha o nível no id', () => {
    expect(
      withIds([
        { name: 'Metamagic', level: 3 },
        { name: 'Metamagic', level: 10 },
        { name: "Land's Stride", level: 6 },
      ]).map((f) => f.id),
    ).toEqual(['metamagic-3', 'metamagic-10', 'land-s-stride']);
  });
});

describe('proficiências', () => {
  it('bardo do SRD 5.1: qualquer perícia, armas pelo id do item, instrumentos à escolha', () => {
    const bard: FiveToolsClass = {
      ...barbarian,
      name: 'Bard',
      proficiency: ['dex', 'cha'],
      startingProficiencies: {
        skills: [{ any: 3 }],
        weapons: ['simple', '{@item hand crossbow|phb|hand crossbows}'],
        toolProficiencies: [{ anyMusicalInstrument: 3 }],
        armor: ['light'],
        armorProficiencies: [{ light: true }],
      },
    };
    const p = toProficiencies(bard);
    expect(p.skills.count).toBe(3);
    expect(p.skills.from).toHaveLength(18);
    expect(p.weapons).toEqual(['simple', 'hand-crossbow']);
    expect(p.tools).toEqual([]);
    expect(p.toolChoice).toEqual({ count: 3, from: ['musical-instrument'] });
    expect(p.armor).toEqual(['light']);
  });

  it('monge do SRD 5.2: armas marciais leves e ferramenta de artesão ou instrumento', () => {
    const monk: FiveToolsClass = {
      ...barbarian,
      name: 'Monk',
      source: 'XPHB',
      startingProficiencies: {
        skills: [{ choose: { from: ['acrobatics', 'sleight of hand'], count: 2 } }],
        weapons: [
          'simple',
          'Martial weapons that have the {@filter Light|items|type=martial weapon|property=light} property',
        ],
        weaponProficiencies: [{ all: { fromFilter: 'type=martial weapon|property=light' } }],
        toolProficiencies: [{ anyArtisansTool: 1 }, { anyMusicalInstrument: 1 }],
      },
    };
    expect(toProficiencies(monk)).toEqual({
      savingThrows: ['STR', 'CON'],
      armor: [],
      weapons: ['simple'],
      martialWeaponsWithProperty: ['L'],
      tools: [],
      toolChoice: { count: 1, from: ['artisan-tools', 'musical-instrument'] },
      skills: { count: 2, from: ['ACROBATICS', 'SLEIGHT_OF_HAND'] },
    });
  });

  it('ferramenta fixa pelo id do item', () => {
    const rogue: FiveToolsClass = {
      ...barbarian,
      startingProficiencies: {
        ...barbarian.startingProficiencies,
        toolProficiencies: [{ "thieves' tools": true }],
      },
    };
    expect(toProficiencies(rogue).tools).toEqual(['thieves-tools']);
  });
});
