import { describe, expect, it } from 'vitest';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { applyChanges, revertChanges } from './quiet-save';

const saved = {
  id: 'c1',
  hpCurrent: 30,
  resources: { a: { used: 1 }, b: { used: 0 } },
} as unknown as DnD5eCharacter;

describe('applyChanges', () => {
  it('põe os campos por cima e junta os mapas chave a chave', () => {
    const next = applyChanges(saved, {
      hpCurrent: 20,
      resources: { b: { used: 2 } },
    } as Partial<DnD5eCharacter>);

    expect(next).toMatchObject({
      hpCurrent: 20,
      resources: { a: { used: 1 }, b: { used: 2 } },
    });
  });
});

describe('revertChanges', () => {
  it('devolve só os campos enviados ao valor salvo', () => {
    const current = { ...saved, hpCurrent: 20, ac: 18 } as DnD5eCharacter;

    const next = revertChanges(current, saved, { hpCurrent: 20 });

    expect(next.hpCurrent).toBe(30);
    // Not part of the failed save: stays as it is on screen
    expect(next.ac).toBe(18);
  });

  it('nos mapas, só as chaves enviadas voltam', () => {
    const current = {
      ...saved,
      resources: { a: { used: 3 }, b: { used: 2 }, c: { used: 1 } },
    } as unknown as DnD5eCharacter;

    const next = revertChanges(current, saved, {
      resources: { b: { used: 2 }, c: { used: 1 } },
    } as Partial<DnD5eCharacter>);

    expect(next.resources).toEqual({ a: { used: 3 }, b: { used: 0 } });
  });

  it('um campo que o servidor não tinha deixa de existir', () => {
    const current = { ...saved, deathSaves: { successes: 1, failures: 0 } } as DnD5eCharacter;

    const next = revertChanges(current, saved, { deathSaves: { successes: 1, failures: 0 } });

    expect(next).not.toHaveProperty('deathSaves');
  });
});
