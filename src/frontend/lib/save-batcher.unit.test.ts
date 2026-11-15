import { describe, expect, it, vi } from 'vitest';

import { SaveBatcher, mergeChanges } from './save-batcher';

/** A send whose requests end only when the test says so. */
function controlledSend() {
  const calls: { changes: unknown; finish: () => void; fail: (e: Error) => void }[] = [];
  const send = vi.fn(
    (changes: unknown) =>
      new Promise<void>((resolve, reject) =>
        calls.push({ changes, finish: resolve, fail: reject }),
      ),
  );
  return { send, calls };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('mergeChanges', () => {
  it('o mais novo vence; resources, atributos e perícias juntam por chave', () => {
    expect(
      mergeChanges(
        { hpCurrent: 7, resources: { a: { used: 1 } }, attributes: { STR: 10 } as never },
        { hpCurrent: 6, resources: { b: { used: 2 } }, attributes: { DEX: 12 } as never },
      ),
    ).toEqual({
      hpCurrent: 6,
      resources: { a: { used: 1 }, b: { used: 2 } },
      attributes: { STR: 10, DEX: 12 },
    });
  });
});

describe('SaveBatcher', () => {
  it('manda um pedido por vez e junta num só o que chega enquanto um está no ar', async () => {
    const { send, calls } = controlledSend();
    const batcher = new SaveBatcher(send, vi.fn());

    const first = batcher.push({ hpCurrent: 7 });
    const second = batcher.push({ resources: { a: { used: 1 } } });
    const third = batcher.push({ resources: { b: { used: 1 } } });
    expect(send).toHaveBeenCalledTimes(1);

    calls[0].finish();
    await first;
    await tick();
    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].changes).toEqual({ resources: { a: { used: 1 }, b: { used: 1 } } });

    calls[1].finish();
    await Promise.all([second, third]);
  });

  it('flush manda o que espera na hora, sem esperar o pedido no ar', async () => {
    const { send, calls } = controlledSend();
    const batcher = new SaveBatcher(send, vi.fn());

    void batcher.push({ hpCurrent: 7 });
    void batcher.push({ hpCurrent: 6 });
    batcher.flush();

    expect(send).toHaveBeenCalledTimes(2);
    expect(calls[1].changes).toEqual({ hpCurrent: 6 });
    batcher.flush();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('erro avisa uma vez por pedido, rejeita quem estava nele, e o próximo segue', async () => {
    const { send, calls } = controlledSend();
    const onError = vi.fn();
    const batcher = new SaveBatcher(send, onError);

    const first = batcher.push({ hpCurrent: 7 });
    const second = batcher.push({ hpCurrent: 6 });
    const third = batcher.push({ ac: 15 });
    calls[0].fail(new Error('offline'));
    await expect(first).rejects.toThrow('offline');
    await tick();

    calls[1].fail(new Error('offline'));
    await expect(second).rejects.toThrow('offline');
    await expect(third).rejects.toThrow('offline');
    expect(onError).toHaveBeenCalledTimes(2);

    const fourth = batcher.push({ ac: 16 });
    await tick();
    calls[2].finish();
    await fourth;
  });

  it('settled espera a fila esvaziar, inclusive o que entrou depois', async () => {
    const { send, calls } = controlledSend();
    const batcher = new SaveBatcher(send, vi.fn());
    await batcher.settled();

    void batcher.push({ hpCurrent: 7 });
    void batcher.push({ hpCurrent: 6 });
    let settled = false;
    void batcher.settled().then(() => (settled = true));

    calls[0].finish();
    await tick();
    expect(settled).toBe(false);
    calls[1].finish();
    await tick();
    expect(settled).toBe(true);
  });
});
