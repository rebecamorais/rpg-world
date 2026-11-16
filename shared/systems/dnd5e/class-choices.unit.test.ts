import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CHOICE_KEY,
  TOOL_KIND_ITEMS,
  acceptedSelections,
  choiceOptions,
  countedSelections,
} from './class-choices';
import { classDefaults } from './class-defaults';
import type { ClassData } from './content/class.schema';
import type { AttributeKey } from './types';

const read = <T>(path: string) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')) as T;
const classes = read<ClassData[]>('content/dnd5e/srd-5.1/classes.json');
const items = read<{ id: string; category: string }[]>('content/dnd5e/srd-5.1/items.json');

const ATTRS = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } as Record<
  AttributeKey,
  number
>;

const choicesOf = (id: string) => {
  const data = classes.find((c) => c.id === id)!;
  const content = { classId: id, edition: '2014' as const, ...data };
  return classDefaults('2014', content, ATTRS)!.choices;
};

describe('TOOL_KIND_ITEMS', () => {
  it('instrumentos: todos os itens de categoria instrument do SRD 5.1, nem mais nem menos', () => {
    const instruments = items.filter((i) => i.category === 'instrument').map((i) => i.id);
    expect([...TOOL_KIND_ITEMS['musical-instrument']].sort()).toEqual(instruments.sort());
  });

  it('ferramentas de artesão: as 17 do SRD, todas itens de categoria tool', () => {
    const tools = new Set(items.filter((i) => i.category === 'tool').map((i) => i.id));
    expect(TOOL_KIND_ITEMS['artisan-tools']).toHaveLength(17);
    for (const id of TOOL_KIND_ITEMS['artisan-tools']) expect(tools.has(id), id).toBe(true);
    // Kits and gaming sets are tools too, but not an artisan's
    for (const id of ['thieves-tools', 'herbalism-kit', 'dice-set', 'navigator-s-tools']) {
      expect(TOOL_KIND_ITEMS['artisan-tools']).not.toContain(id);
    }
  });

  it('toda escolha de ferramenta do SRD 5.1 tem a lista do seu tipo', () => {
    for (const data of classes) {
      for (const kind of data.proficiencies.toolChoice?.from ?? []) {
        expect(TOOL_KIND_ITEMS[kind], `${data.id}: ${kind}`).toBeDefined();
      }
    }
  });
});

describe('choiceOptions', () => {
  it('perícias: as da lista da classe; ferramentas: os itens dos tipos', () => {
    const [skills, tools] = choicesOf('bard');
    expect(choiceOptions(skills)).toHaveLength(18);
    expect(choiceOptions(tools)).toEqual([...TOOL_KIND_ITEMS['musical-instrument']]);

    // Monk: one artisan's tool or one instrument
    const monkTools = choicesOf('monk')[1];
    expect(choiceOptions(monkTools)).toHaveLength(27);
    expect(choiceOptions(monkTools)).toContain('smith-s-tools');
    expect(choiceOptions(monkTools)).toContain('lute');
  });
});

describe('countedSelections', () => {
  const [barbarianSkills] = choicesOf('barbarian');

  it('conta só as da lista, sem repetição e até a quantidade pedida', () => {
    expect(countedSelections(barbarianSkills, ['ATHLETICS', 'ARCANA'])).toEqual(['ATHLETICS']);
    expect(countedSelections(barbarianSkills, ['ATHLETICS', 'ATHLETICS'])).toEqual(['ATHLETICS']);
    expect(
      countedSelections(barbarianSkills, ['ATHLETICS', 'NATURE', 'SURVIVAL', 'PERCEPTION']),
    ).toEqual(['ATHLETICS', 'NATURE']);
    expect(countedSelections(barbarianSkills, undefined)).toEqual([]);
  });
});

describe('acceptedSelections', () => {
  it('guarda pela identidade da escolha e deixa de fora escolha de outra classe e vazia', () => {
    const bard = choicesOf('bard');
    expect(
      acceptedSelections(bard, {
        '2014/bard/skills': ['ARCANA', 'HISTORY'],
        '2014/bard/tools': [],
        '2014/rogue/skills': ['STEALTH'],
      }),
    ).toEqual({ '2014/bard/skills': ['ARCANA', 'HISTORY'] });
  });

  it('a identidade de toda escolha do SRD 5.1 segue o formato aceito pela API', () => {
    for (const data of classes) {
      for (const choice of choicesOf(data.id)) expect(choice.key).toMatch(CHOICE_KEY);
    }
  });
});
