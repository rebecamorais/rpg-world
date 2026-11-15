import { describe, expect, it } from 'vitest';

import { MONK } from '@frontend/components/character/resources/fixtures';

import { buildResourceBoxes } from '@shared/systems/dnd5e/class-resources';
import type { ClassResourcesContent } from '@shared/systems/dnd5e/class-resources';

import { buildRestChecklist } from './rest-checklist';

const boxesOf = (content: ClassResourcesContent | null, level: number) =>
  content
    ? buildResourceBoxes({
        content,
        subclassId: null,
        level,
        attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        state: undefined,
      })
    : [];

const BARD: ClassResourcesContent = {
  classId: 'bard',
  edition: '2014',
  hitDie: 8,
  resources: [
    {
      feature: 'f',
      level: 1,
      id: 'bardic-inspiration',
      name: 'Bardic Inspiration',
      description: 'd',
      unit: 'uses',
      max: { type: 'classLevel', multiplier: 1 },
      recovery: [
        { rest: 'long', amount: 'all' },
        { rest: 'short', amount: 'all', fromLevel: 5 },
      ],
    },
  ],
  subclass: { id: 'lore', names: ['Lore'], resources: [] },
};

const base = {
  conMod: 2,
  hitDiceAvailable: 3,
  hasSpellSlots: false,
  hasPactSlots: false,
};

describe('buildRestChecklist', () => {
  it('monge 5 no descanso curto: dados de vida, Ki, lembrete e sem PV cheio', () => {
    const items = buildRestChecklist({
      ...base,
      rest: 'short',
      level: 5,
      hitDie: 8,
      boxes: boxesOf(MONK, 5),
    });
    expect(items.map((i) => [i.message, i.values])).toEqual([
      ['spendHitDice', { die: 'd8', bonus: '+2', left: 3 }],
      ['boxBack', { name: 'Ki', amount: 'all' }],
      ['notBackShort', undefined],
    ]);
    expect(items.some((i) => i.message === 'fullHp')).toBe(false);
  });

  it('usa o sinal de menos de verdade no bônus negativo', () => {
    const [first] = buildRestChecklist({
      ...base,
      conMod: -1,
      rest: 'short',
      level: 1,
      hitDie: 8,
      boxes: [],
    });
    expect(first.values?.bonus).toBe('−1');
  });

  it('descanso longo no nível 5: metade dos dados de vida e Ki', () => {
    const items = buildRestChecklist({
      ...base,
      rest: 'long',
      level: 5,
      hitDie: 8,
      boxes: boxesOf(MONK, 5),
    });
    expect(items.map((i) => i.message)).toEqual(['fullHp', 'hitDiceBack', 'boxBack']);
    expect(items[1].values).toEqual({ count: 2 });
  });

  it('descanso longo no nível 1 devolve ao menos 1 dado', () => {
    const items = buildRestChecklist({ ...base, rest: 'long', level: 1, hitDie: 8, boxes: [] });
    expect(items[1].values).toEqual({ count: 1 });
  });

  it('bardo 4 não recupera Inspiração no curto, bardo 5 sim', () => {
    const at = (level: number) =>
      buildRestChecklist({
        ...base,
        rest: 'short',
        level,
        hitDie: 8,
        boxes: boxesOf(BARD, level),
      }).some((i) => i.message === 'boxBack');
    expect(at(4)).toBe(false);
    expect(at(5)).toBe(true);
  });

  it('sem classe: dado desconhecido e nenhuma caixinha', () => {
    const items = buildRestChecklist({ ...base, rest: 'short', level: 3, hitDie: null, boxes: [] });
    expect(items.map((i) => i.message)).toEqual(['spendHitDiceNoDie', 'notBackShort']);
  });

  it('espaços de pacto no curto e espaços de magia no longo', () => {
    const short = buildRestChecklist({
      ...base,
      rest: 'short',
      level: 3,
      hitDie: 8,
      boxes: [],
      hasPactSlots: true,
    });
    expect(short.map((i) => i.message)).toContain('pactSlotsBack');
    const long = buildRestChecklist({
      ...base,
      rest: 'long',
      level: 3,
      hitDie: 8,
      boxes: [],
      hasSpellSlots: true,
    });
    expect(long.map((i) => i.message)).toContain('spellSlotsBack');
  });
});
