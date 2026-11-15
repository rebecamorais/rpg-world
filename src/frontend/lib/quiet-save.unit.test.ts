import { describe, expect, it, vi } from 'vitest';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import {
  QuietSaver,
  type Revisioned,
  applyChanges,
  revertChanges,
  withoutLaterKeys,
} from './quiet-save';

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

describe('withoutLaterKeys', () => {
  it('tira os campos e as chaves dos mapas que um envio posterior escreve', () => {
    const kept = withoutLaterKeys(
      {
        hpCurrent: 20,
        ac: 15,
        resources: { a: { used: 2 }, b: { used: 1 } },
      } as Partial<DnD5eCharacter>,
      { hpCurrent: 18, resources: { b: { used: 3 } } } as Partial<DnD5eCharacter>,
    );

    expect(kept).toEqual({ ac: 15, resources: { a: { used: 2 } } });
  });
});

describe('QuietSaver', () => {
  function setup(initial: Revisioned) {
    let cache: Revisioned | undefined = initial;
    const replies: { resolve: () => void; reject: (error: Error) => void }[] = [];
    const onFail = vi.fn();
    const saver = new QuietSaver({
      send: () =>
        new Promise((resolve, reject) =>
          replies.push({ resolve: () => resolve({ revision: initial.revision }), reject }),
        ),
      read: () => cache,
      write: (update) => (cache = update(cache)),
      onFail,
    });
    return { saver, replies, onFail, cache: () => cache };
  }

  it('o primeiro falha e o segundo, na mesma chave e no mesmo mapa, dá certo: fica o segundo', async () => {
    const { saver, replies, onFail, cache } = setup({ ...saved, revision: 3 });

    const first = saver.push(
      applyChanges(saved, {
        hpCurrent: 23,
        resources: { b: { used: 1 } },
      } as Partial<DnD5eCharacter>),
      { hpCurrent: 23, resources: { b: { used: 1 } } } as Partial<DnD5eCharacter>,
    );
    const second = saver.push(
      applyChanges(saved, {
        hpCurrent: 20,
        resources: { b: { used: 2 } },
      } as Partial<DnD5eCharacter>),
      { hpCurrent: 20, resources: { b: { used: 2 } } } as Partial<DnD5eCharacter>,
    );

    replies[0].reject(new Error('offline'));
    await expect(first).rejects.toThrow('offline');
    // Nothing of the first is left to put back or to try again: the second writes all of it
    expect(onFail).toHaveBeenCalledWith(expect.any(Error), {});
    expect(cache()).toMatchObject({ hpCurrent: 20, resources: { b: { used: 2 } } });

    await vi.waitFor(() => expect(replies).toHaveLength(2));
    replies[1].resolve();
    await second;
    expect(cache()).toMatchObject({ hpCurrent: 20, resources: { a: { used: 1 }, b: { used: 2 } } });
  });

  it('não leva a revisão guardada para trás', async () => {
    const { saver, replies, cache } = setup({ ...saved, revision: 5 });

    // Built from an older render, before a Save moved the revision
    const done = saver.push({ ...saved, revision: 4, hpCurrent: 7 } as Revisioned, {
      hpCurrent: 7,
    });
    replies[0].resolve();
    await done;

    expect(cache()).toMatchObject({ hpCurrent: 7, revision: 5 });
  });
});
