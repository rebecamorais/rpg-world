import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type ClassResourcesContent,
  type ResourceBox,
  type ResourceState,
  buildResourceBoxes,
} from '@shared/systems/dnd5e/class-resources';
import type { ClassData, ClassText } from '@shared/systems/dnd5e/content/class.schema';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { restRecovery } from './rest-recovery';

const box = (key: string, max: number | null, recovery: ResourceBox['recovery']): ResourceBox =>
  ({ key, name: key, description: '', unit: 'uses', max, used: 0, recovery }) as ResourceBox;

const KI = box('class:monk:ki', 5, [
  { rest: 'short', amount: 'all' },
  { rest: 'long', amount: 'all' },
]);
const RAGE = box('class:barbarian:rage', 3, [
  { rest: 'short', amount: 1 },
  { rest: 'long', amount: 'all' },
]);
const LUCK = box('custom:luck', 3, [{ rest: 'long', amount: 'all' }]);

const hero = (overrides: Partial<DnD5eCharacter> = {}) =>
  ({
    ...createDnD5eCharacter('o', 'Hero'),
    id: 'c1',
    level: 5,
    hpCurrent: 4,
    hpMax: 38,
    hitDice: { die: 'd8', spent: 4 },
    resources: {
      [KI.key]: { used: 4 },
      [RAGE.key]: { used: 3 },
      [LUCK.key]: { used: 2, hidden: false },
    },
    ...overrides,
  }) as DnD5eCharacter;

describe('restRecovery', () => {
  it('descanso curto: só as caixas que voltam no curto, na quantidade de cada uma', () => {
    const { fields, items } = restRecovery('short', hero(), [KI, RAGE, LUCK]);

    expect(fields).toEqual({
      resources: {
        [KI.key]: { used: 0 },
        [RAGE.key]: { used: 2 },
        [LUCK.key]: { used: 2, hidden: false },
      },
    });
    expect(items).toEqual([`box:${KI.key}`, `box:${RAGE.key}`]);
  });

  it('descanso longo: PV cheio, metade dos dados de vida, espaços e caixas', () => {
    const { fields, items } = restRecovery(
      'long',
      hero({ spellcastingSystem: 'slots', spellSlots: { '1': { max: 4, used: 3 } } }),
      [KI, LUCK],
    );

    expect(fields).toMatchObject({
      hpCurrent: 38,
      hitDice: { die: 'd8', spent: 2 },
      spellSlots: { '1': { max: 4, used: 0 } },
      resources: { [KI.key]: { used: 0 }, [LUCK.key]: { used: 0, hidden: false } },
    });
    expect(items).toEqual([
      'full-hp',
      'hit-dice-back',
      'spell-slots',
      `box:${KI.key}`,
      `box:${LUCK.key}`,
    ]);
  });

  it('os dados de vida não passam do nível', () => {
    const { fields } = restRecovery('long', hero({ hitDice: { die: 'd8', spent: 1 } }), []);
    expect(fields.hitDice).toEqual({ die: 'd8', spent: 0 });
  });

  it('gastos guardados acima do nível: devolve a partir do que a ficha mostra', () => {
    // Spent 5 at level 5, now level 3: the sheet shows 3 spent, and 1 comes back
    const { fields } = restRecovery(
      'long',
      hero({ level: 3, hitDice: { die: 'd8', spent: 5 } }),
      [],
    );
    expect(fields.hitDice).toEqual({ die: 'd8', spent: 2 });
  });

  it('ficha no formato antigo sai no formato novo, e sem dado não grava a chave', () => {
    const legacy = restRecovery('long', hero({ hitDice: { total: '5d10', current: 1 } }), []);
    expect(legacy.fields.hitDice).toEqual({ die: 'd10', spent: 2 });

    const noDie = restRecovery('long', hero({ hitDice: undefined }), []);
    expect(noDie.fields.hitDice).toEqual({ spent: 0 });
    expect(noDie.fields.hitDice).not.toHaveProperty('die');
  });

  it('pontos de magia voltam ao máximo', () => {
    const { fields, items } = restRecovery(
      'long',
      hero({ spellcastingSystem: 'points', spellPoints: { current: 1, max: 9 } }),
      [],
    );
    expect(fields.spellPoints).toEqual({ current: 9, max: 9 });
    expect(items).toContain('spell-points');
  });

  it('caixa sem limite não muda', () => {
    const free = box('custom:free', null, [{ rest: 'short', amount: 'all' }]);
    expect(restRecovery('short', hero(), [free])).toEqual({ fields: {}, items: [] });
  });
});

/*
 * #213: Signature Spells' old pool of 2 can't say which spell `used = 1` was. The sheet keeps it
 * until the player's own rest gives it back; only then, with nothing left to misread, the two
 * boxes of one spell each take its place. Opening the sheet never converts anything.
 */
describe.each(['srd-5.1', 'srd-5.2'] as const)(
  'Magias Assinatura: da reserva de 2 para uma caixinha por magia (%s)',
  (source) => {
    const OLD = 'class:wizard:signature-spells';
    const NEW = ['class:wizard:signature-spell-1', 'class:wizard:signature-spell-2'];
    const base = join(process.cwd(), 'content/dnd5e', source);
    const data = (JSON.parse(readFileSync(join(base, 'classes.json'), 'utf8')) as ClassData[]).find(
      (c) => c.id === 'wizard',
    )!;
    const text = (
      JSON.parse(readFileSync(join(base, 'i18n/en/classes.json'), 'utf8')) as Record<
        string,
        ClassText
      >
    ).wizard;
    const wizard: ClassResourcesContent = {
      classId: 'wizard',
      edition: source === 'srd-5.1' ? '2014' : '2024',
      hitDie: data.hitDie,
      resources: data.resources.map((r) => ({ ...r, ...text.resources[r.id], description: '' })),
      subclass: { id: data.subclasses[0].id, names: [], resources: [] },
    };
    const sheet = (resources: Record<string, ResourceState>) =>
      hero({ level: 20, resources }) as DnD5eCharacter;
    const boxesOf = (character: DnD5eCharacter) =>
      buildResourceBoxes({
        content: wizard,
        subclassId: null,
        level: 20,
        attributes: character.attributes,
        state: character.resources,
      }).filter((b) => b.key.includes('signature-spell'));

    it('used = 1 salvo: abrir não converte; o descanso dela devolve a reserva e aí vêm as duas', () => {
      const before = sheet({ [OLD]: { used: 1 } });
      const saved = structuredClone(before.resources);

      const opened = boxesOf(before);
      expect(opened).toMatchObject([{ key: OLD, max: 2, used: 1 }]);
      expect(before.resources).toEqual(saved);

      const { fields, items } = restRecovery('short', before, boxesOf(before));
      expect(items).toContain(`box:${OLD}`);
      expect(fields.resources?.[OLD]).toEqual({ used: 0 });
      // Nothing is written to the new keys: they start empty, as the pool came back
      expect(Object.keys(fields.resources ?? {}).filter((k) => NEW.includes(k))).toEqual([]);

      const after = boxesOf({ ...before, ...fields } as DnD5eCharacter);
      expect(after).toMatchObject([
        { key: NEW[0], max: 1, used: 0 },
        { key: NEW[1], max: 1, used: 0 },
      ]);
    });

    it('used = 2 salvo: as duas gastas continuam gastas até o descanso', () => {
      expect(boxesOf(sheet({ [OLD]: { used: 2 } }))).toMatchObject([{ key: OLD, max: 2, used: 2 }]);
    });

    it('nome editado na reserva antiga: ela fica, e o gasto volta nela no descanso', () => {
      const before = sheet({ [OLD]: { used: 1, overrides: { name: 'Bola de Fogo' } } });
      const { fields } = restRecovery('short', before, boxesOf(before));
      expect(fields.resources?.[OLD]).toEqual({ used: 0, overrides: { name: 'Bola de Fogo' } });
      expect(boxesOf({ ...before, ...fields } as DnD5eCharacter)).toMatchObject([
        { key: OLD, name: 'Bola de Fogo', used: 0 },
      ]);
    });
  },
);
