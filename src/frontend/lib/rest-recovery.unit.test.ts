import { describe, expect, it } from 'vitest';

import type { ResourceBox } from '@shared/systems/dnd5e/class-resources';
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
    hitDice: { total: '5d8', current: 1 },
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
      hitDice: { total: '5d8', current: 3 },
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
    const { fields } = restRecovery('long', hero({ hitDice: { total: '5d8', current: 4 } }), []);
    expect(fields.hitDice).toEqual({ total: '5d8', current: 5 });
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
