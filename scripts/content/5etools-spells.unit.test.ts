import { describe, expect, it } from 'vitest';

import {
  type FiveToolsSpell,
  extrasOf,
  renderEntries,
  stripTags,
  toSpellData,
  toSpellId,
  toSpellText,
} from './5etools-spells';

// Fireball as 5etools v2.38.0 has it (data/spells/spells-xphb.json), trimmed
const fireball: FiveToolsSpell = {
  name: 'Fireball',
  source: 'XPHB',
  srd52: true,
  level: 3,
  school: 'V',
  time: [{ number: 1, unit: 'action' }],
  range: { type: 'point', distance: { type: 'feet', amount: 150 } },
  components: { v: true, s: true, m: 'a ball of bat guano and sulfur' },
  duration: [{ type: 'instant' }],
  entries: [
    'A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius {@variantrule Sphere [Area of Effect]|XPHB|Sphere} centered on that point makes a Dexterity saving throw, taking {@damage 8d6} Fire damage on a failed save or half as much damage on a successful one.',
    "Flammable objects in the area that aren't being worn or carried start {@hazard burning|XPHB}.",
  ],
  entriesHigherLevel: [
    {
      type: 'entries',
      name: 'Using a Higher-Level Spell Slot',
      entries: [
        'The damage increases by {@scaledamage 8d6|3-9|1d6} for each spell slot level above 3.',
      ],
    },
  ],
  damageInflict: ['fire'],
};

describe('conversão das magias do 5etools', () => {
  it('o id vem do nome no SRD', () => {
    expect(toSpellId(fireball)).toBe('fireball');
    expect(toSpellId({ ...fireball, name: "Melf's Acid Arrow", srd52: 'Acid Arrow' })).toBe(
      'acid-arrow',
    );
    expect(toSpellId({ ...fireball, name: "Bigby's Hand", srd52: 'Arcane Hand' })).toBe(
      'arcane-hand',
    );
  });

  it('converte os dados mecânicos', () => {
    expect(toSpellData(fireball, ['sorcerer', 'wizard'])).toEqual({
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
      isScaling: false,
      materialCost: 0,
      damageType: 'fire',
      spellCategory: 'utility',
      bgStyleId: 'grid-mesh',
    });
  });

  it('reaproveita o visual e o tipo de dano da magia de 2014', () => {
    const data = toSpellData({ ...fireball, damageInflict: ['cold', 'fire'] }, [], {
      ...toSpellData(fireball, []),
      damageType: 'fire',
      spellCategory: 'control',
      bgStyleId: 'ethereal-glow',
    });
    expect(data).toMatchObject({
      damageType: 'fire',
      spellCategory: 'control',
      bgStyleId: 'ethereal-glow',
    });
    expect(toSpellData({ ...fireball, damageInflict: undefined }, [])).toMatchObject({
      damageType: null,
      bgStyleId: 'dots-space',
    });
  });

  it('mapeia tempo, alcance, duração e material', () => {
    const data = toSpellData(
      {
        ...fireball,
        time: [{ number: 1, unit: 'bonus' }],
        range: { type: 'emanation', distance: { type: 'feet', amount: 10 } },
        duration: [
          { type: 'timed', duration: { type: 'minute', amount: 10 }, concentration: true },
        ],
        components: { v: true, m: { text: 'gold dust worth 25+ GP', cost: 2500 } },
        meta: { ritual: true },
      },
      [],
    );
    expect(data).toMatchObject({
      castingTime: 'bonus_action',
      rangeUnit: 'self',
      rangeValue: null,
      durationUnit: 'minute',
      durationValue: 10,
      concentration: true,
      components: ['V', 'M'],
      materialCost: 25,
      ritual: true,
    });
    expect(
      toSpellData(
        { ...fireball, range: { type: 'point', distance: { type: 'miles', amount: 1 } } },
        [],
      ).rangeUnit,
    ).toBe('mile');
    expect(toSpellData({ ...fireball, duration: [{ type: 'permanent' }] }, []).durationUnit).toBe(
      'special',
    );
  });

  it('converte o texto sem deixar marcações', () => {
    const text = toSpellText(fireball);
    expect(text.name).toBe('Fireball');
    expect(text.description).toContain('20-foot-radius Sphere centered');
    expect(text.description).toContain('taking 8d6 Fire damage');
    expect(text.description).toContain('start burning.');
    expect(text.description).not.toContain('{@');
    expect(text.higherLevel).toBe('The damage increases by 1d6 for each spell slot level above 3.');
    expect(text.material).toBe('A ball of bat guano and sulfur.');
  });

  it('marcações, listas e tabelas', () => {
    expect(stripTags('{@chance 50} of the time, {@b bold} and {@spell fireball|XPHB}')).toBe(
      '50% of the time, bold and fireball',
    );
    expect(
      renderEntries([
        {
          type: 'table',
          colLabels: ['Omen', 'Result'],
          rows: [
            ['Weal', 'Good'],
            ['Woe', 'Bad'],
          ],
        },
      ]),
    ).toBe('Omen | Result\nWeal | Good\nWoe | Bad');
    expect(
      renderEntries([
        'Choose one:',
        {
          type: 'list',
          items: [{ type: 'item', name: 'Audible Alarm', entries: ['A handbell.'] }, 'Plain item.'],
        },
        { type: 'entries', name: 'Hold', entries: ['The target is held.'] },
      ]),
    ).toBe('Choose one:\n• Audible Alarm. A handbell.\n• Plain item.\nHold. The target is held.');
  });

  it.each([
    ['A {@filter Tiny|bestiary|size=T} beast', 'A Tiny beast'],
    ['either a {@filter Beast|bestiary|type=beast} or not', 'either a Beast or not'],
    ['the rules on {@book mounted combat|XPHB|1|Mounted Combat}.', 'the rules on mounted combat.'],
    ['make a {@dc 15} Intelligence saving throw', 'make a DC 15 Intelligence saving throw'],
  ])('marcação %s', (text, expected) => {
    expect(stripTags(text)).toBe(expected);
  });

  it('tabela com título mostra o título antes', () => {
    expect(
      renderEntries([
        {
          type: 'table',
          caption: 'Wind',
          colLabels: ['Stage', 'Condition'],
          rows: [['1', 'Calm']],
        },
      ]),
    ).toBe('Wind\nStage | Condition\n1 | Calm');
  });

  it('tipo de dano: a classificação do 5.1 vale, inclusive sem dano', () => {
    const previous = toSpellData({ ...fireball, damageInflict: undefined }, []);
    expect(
      toSpellData({ ...fireball, damageInflict: ['fire'] }, [], previous).damageType,
    ).toBeNull();
    expect(
      toSpellData({ ...fireball, damageInflict: ['cold'] }, [], { ...previous, damageType: 'fire' })
        .damageType,
    ).toBe('cold');
    expect(toSpellData({ ...fireball, damageInflict: ['acid', 'fire'] }, []).damageType).toBe(
      'acid',
    );
  });

  it('o id de uma magia do livro de 2014 vem do nome no SRD 5.1', () => {
    const { srd52: _, ...phb } = fireball;
    expect(toSpellId({ ...phb, name: "Bigby's Hand", srd: 'Arcane Hand' })).toBe('arcane-hand');
    expect(toSpellId({ ...phb, srd: true })).toBe('fireball');
  });

  it('reação e ação bônus guardam a condição de uso', () => {
    const counterspell: FiveToolsSpell = {
      ...fireball,
      name: 'Counterspell',
      time: [
        {
          number: 1,
          unit: 'reaction',
          condition:
            'which you take when you see a creature within 60 feet of yourself casting a spell',
        },
      ],
    };
    expect(toSpellText(counterspell).trigger).toBe(
      'which you take when you see a creature within 60 feet of yourself casting a spell',
    );
    expect(toSpellText(fireball)).not.toHaveProperty('trigger');
  });

  it('os outros tempos de conjuração ficam em extraCastingTimes', () => {
    const plantGrowth: FiveToolsSpell = {
      ...fireball,
      time: [
        { number: 1, unit: 'action' },
        { number: 8, unit: 'hour' },
      ],
    };
    expect(toSpellData(plantGrowth, [])).toMatchObject({
      castingTime: 'action',
      castingValue: 1,
      extraCastingTimes: [{ castingTime: 'hour', castingValue: 8 }],
    });
    expect(toSpellData(fireball, [])).not.toHaveProperty('extraCastingTimes');
  });

  it('extrasOf traz só os campos novos, para completar as magias de 2014', () => {
    expect(
      extrasOf({
        ...fireball,
        time: [
          { number: 1, unit: 'action' },
          { number: 8, unit: 'hour' },
        ],
      }),
    ).toEqual({ extraCastingTimes: [{ castingTime: 'hour', castingValue: 8 }] });
    expect(
      extrasOf({
        ...fireball,
        time: [{ number: 1, unit: 'reaction', condition: 'which you take' }],
      }),
    ).toEqual({ trigger: 'which you take' });
    expect(extrasOf(fireball)).toEqual({});
  });
});
