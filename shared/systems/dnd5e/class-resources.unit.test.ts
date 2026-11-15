import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type ClassResourcesContent,
  type ResourceContent,
  type ResourceState,
  buildResourceBoxes,
  matchSubclass,
  recoveryOn,
} from './class-resources';
import type { ClassData, ClassText } from './content/class.schema';
import type { AttributeKey } from './types';

const ATTRS: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};
const LONG = { rest: 'long', amount: 'all' } as const;

function res(
  over: Partial<ResourceContent> & Pick<ResourceContent, 'id' | 'max'>,
): ResourceContent {
  return {
    feature: over.id,
    level: 1,
    unit: 'uses',
    recovery: [LONG],
    name: over.id,
    description: `desc ${over.id}`,
    ...over,
  };
}

function content(
  classId: string,
  resources: ResourceContent[],
  subResources: ResourceContent[] = [],
  edition: '2014' | '2024' = '2014',
): ClassResourcesContent {
  return {
    classId,
    edition,
    hitDie: 8,
    resources,
    subclass: { id: 'berserker', names: ['berserker', 'Berserker (pt)'], resources: subResources },
  };
}

function build(
  c: ClassResourcesContent,
  level: number,
  extra: Partial<{
    attributes: Record<AttributeKey, number>;
    state: Record<string, ResourceState>;
    subclassId: string | null;
  }> = {},
) {
  return buildResourceBoxes({
    content: c,
    subclassId: extra.subclassId ?? null,
    level,
    attributes: extra.attributes ?? ATTRS,
    state: extra.state,
  });
}

const rage = res({
  id: 'rage',
  max: {
    type: 'steps',
    steps: [
      { level: 1, value: 2 },
      { level: 3, value: 3 },
      { level: 20, value: null },
    ],
  },
  recovery: [LONG],
});

const bardic = (cha: number, level: number) =>
  build(
    content('bard', [
      res({
        id: 'bardic-inspiration',
        max: { type: 'ability', ability: 'CHA', bonus: 0, minimum: 1 },
        recovery: [LONG, { rest: 'short', amount: 'all', fromLevel: 5 }],
        die: [
          { level: 1, value: 6 },
          { level: 5, value: 8 },
        ],
      }),
    ]),
    level,
    { attributes: { ...ATTRS, CHA: cha } },
  )[0];

describe('buildResourceBoxes', () => {
  it('Bárbaro 20 (2014): Fúria é ilimitada', () => {
    const [box] = build(content('barbarian', [rage]), 20);
    expect(box.max).toBeNull();
    expect(box.used).toBe(0);
    expect(box.key).toBe('class:barbarian:rage');
    expect(box.source).toBe('class');
  });

  it('usa o último degrau com nível <= nível do personagem', () => {
    expect(build(content('barbarian', [rage]), 2)[0].max).toBe(2);
    expect(build(content('barbarian', [rage]), 3)[0].max).toBe(3);
  });

  it('classLevel: Mão Consagrada do Paladino 5 tem 25 pontos de vida', () => {
    const [box] = build(
      content('paladin', [
        res({ id: 'lay-on-hands', unit: 'hit-points', max: { type: 'classLevel', multiplier: 5 } }),
      ]),
      5,
    );
    expect(box.unit).toBe('hit-points');
    expect(box.max).toBe(25);
  });

  it('ability: Inspiração de Bardo respeita o mínimo e o modificador', () => {
    expect(bardic(8, 1).max).toBe(1);
    expect(bardic(16, 1).max).toBe(3);
  });

  it('die segue os degraus do nível', () => {
    expect(bardic(16, 4).die).toBe(6);
    expect(bardic(16, 5).die).toBe(8);
  });

  it('recuperação com fromLevel só vale a partir do nível', () => {
    const b4 = bardic(16, 4);
    expect(b4.recovery).toEqual([LONG]);
    expect(recoveryOn(b4, 'short')).toBeNull();
    const b5 = bardic(16, 5);
    expect(recoveryOn(b5, 'short')).toBe('all');
    expect(recoveryOn(b5, 'long')).toBe('all');
  });

  it('Fúria no SRD 5.2 devolve 1 uso no descanso curto', () => {
    const [box] = build(
      content(
        'barbarian',
        [{ ...rage, recovery: [{ rest: 'short', amount: 1 }, LONG] }],
        [],
        '2024',
      ),
      5,
    );
    expect(recoveryOn(box, 'short')).toBe(1);
  });

  it('espaços de magia nunca viram caixinha; Arcana Mística aparece no nível 11', () => {
    const warlock = content('warlock', [
      res({
        id: 'pact-magic',
        unit: 'spell-slots',
        max: { type: 'steps', steps: [{ level: 1, value: 1 }] },
      }),
      res({
        id: 'mystic-arcanum-6',
        level: 11,
        max: { type: 'steps', steps: [{ level: 11, value: 1 }] },
      }),
    ]);
    expect(build(warlock, 11).map((b) => b.key)).toEqual(['class:warlock:mystic-arcanum-6']);
    expect(build(warlock, 10)).toEqual([]);
  });

  it('limita used a [0, max] sem alterar o state de entrada', () => {
    const state = Object.freeze({
      'class:barbarian:rage': Object.freeze({ used: 9 }),
    }) as Record<string, ResourceState>;
    const [box] = build(content('barbarian', [rage]), 1, { state });
    expect(box.max).toBe(2);
    expect(box.used).toBe(2);
    expect(state['class:barbarian:rage'].used).toBe(9);
  });

  it('used negativo vira 0', () => {
    const [box] = build(content('barbarian', [rage]), 1, {
      state: { 'class:barbarian:rage': { used: -3 } },
    });
    expect(box.used).toBe(0);
  });

  it('recurso ganho depois do nível atual fica de fora', () => {
    const c = content('x', [
      res({ id: 'late', level: 6, max: { type: 'steps', steps: [{ level: 6, value: 1 }] } }),
    ]);
    expect(build(c, 5)).toEqual([]);
    expect(build(c, 6)).toHaveLength(1);
  });

  it('caixinhas da subclasse só aparecem com subclassId igual, depois das da classe', () => {
    const sub = res({ id: 'frenzy', max: { type: 'steps', steps: [{ level: 1, value: 1 }] } });
    const c = content('barbarian', [rage], [sub]);
    expect(build(c, 5).map((b) => b.key)).toEqual(['class:barbarian:rage']);
    expect(build(c, 5, { subclassId: 'other' })).toHaveLength(1);
    const boxes = build(c, 5, { subclassId: 'berserker' });
    expect(boxes.map((b) => b.key)).toEqual([
      'class:barbarian:rage',
      'subclass:barbarian/berserker:frenzy',
    ]);
    expect(boxes[1].source).toBe('subclass');
  });

  it('carrega nome, descrição e nota do conteúdo', () => {
    const [box] = build(
      content('x', [
        res({
          id: 'a',
          name: 'Name A',
          description: 'Text A',
          note: 'Wait',
          max: { type: 'steps', steps: [{ level: 1, value: 1 }] },
        }),
      ]),
      1,
    );
    expect(box).toMatchObject({ name: 'Name A', description: 'Text A', note: 'Wait' });
  });

  it('monge 5 (conteúdo real do SRD 5.1): Ki com 5 pontos, descanso curto e longo', () => {
    const base = join(process.cwd(), 'content/dnd5e/srd-5.1');
    const data = (JSON.parse(readFileSync(join(base, 'classes.json'), 'utf8')) as ClassData[]).find(
      (c) => c.id === 'monk',
    )!;
    const text = (
      JSON.parse(readFileSync(join(base, 'i18n/en/classes.json'), 'utf8')) as Record<
        string,
        ClassText
      >
    ).monk;
    const sub = data.subclasses[0];
    const toContent = (
      r: ClassData['resources'][number],
      t: ClassText['resources'],
    ): ResourceContent => ({
      ...r,
      name: t[r.id].name,
      note: t[r.id].note,
      description: text.features[r.feature]?.description ?? '',
    });
    const c: ClassResourcesContent = {
      classId: 'monk',
      edition: '2014',
      hitDie: data.hitDie,
      resources: data.resources.map((r) => toContent(r, text.resources)),
      subclass: {
        id: sub.id,
        names: [sub.id, text.subclasses[sub.id].name],
        resources: sub.resources.map((r) => toContent(r, text.subclasses[sub.id].resources)),
      },
    };
    const ki = build(c, 5).find((b) => b.key === 'class:monk:ki')!;
    expect(ki.max).toBe(5);
    expect(ki.unit).toBe('points');
    expect(recoveryOn(ki, 'short')).toBe('all');
    expect(recoveryOn(ki, 'long')).toBe('all');
  });
});

describe('matchSubclass', () => {
  const c = content('barbarian', [rage]);

  it('ignora caixa, acentos e espaços', () => {
    expect(matchSubclass(c, ' berserker ')).toBe('berserker');
    expect(matchSubclass(c, 'BÉRSERKER (PT)')).toBe('berserker');
  });

  it('casa o nome do idioma', () => {
    expect(matchSubclass(c, 'Berserker (pt)')).toBe('berserker');
  });

  it('retorna null quando não casa ou não há texto', () => {
    expect(matchSubclass(c, 'Path of Wild Magic')).toBeNull();
    expect(matchSubclass(c, undefined)).toBeNull();
    expect(matchSubclass(c, '  ')).toBeNull();
  });
});
