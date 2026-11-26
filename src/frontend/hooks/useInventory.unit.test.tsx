import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { coinsDelta, useInventory, usePartyChest } from './useInventory';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));
vi.mock('@client', () => ({
  rpgWorldApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const api = vi.mocked(rpgWorldApi);
const ZERO = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
const rope = { id: 'i1', containerId: 'bag1', ref: 'dnd5e:srd:item:rope', quantity: 2, item: null };

const inventory = () => ({
  containers: [
    { id: 'pouch1', kind: 'coin_pouch', name: null, position: 0, coins: { ...ZERO, gp: 5 } },
    { id: 'bag1', kind: 'backpack', name: null, position: 1, coins: ZERO },
  ],
  items: [rope],
});

async function renderInventory() {
  api.get.mockResolvedValue(inventory());
  const hook = renderHookWithProviders(() => useInventory('c1'));
  await waitFor(() => expect(hook.result.current.inventory).toBeDefined());
  return hook;
}

/** An answer from the server with this status and body, as the API client throws it. */
const answered = (status: number, error: string, data: object = {}) =>
  Object.assign(new Error(error), { status, data: { error, ...data } });

/** A request that fails only when the test says so, to look at the screen in between. */
function failLater(err: Error = new Error('boom')) {
  let fail!: () => void;
  const promise = new Promise<never>((_, reject) => {
    fail = () => reject(err);
  });
  return { promise, fail };
}

/** The "Try again" of the last error toast, if it has one. */
const retryAction = () => {
  const options = vi.mocked(toast.error).mock.lastCall?.[1] as
    { action?: { label: string; onClick: () => void } } | undefined;
  return options?.action;
};

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acha a algibeira e a mochila', async () => {
    const { result } = await renderInventory();

    expect(result.current.pouch?.id).toBe('pouch1');
    expect(result.current.backpack?.id).toBe('bag1');
  });

  it('setQuantity mostra na hora e manda a diferença com uma chave; falha desfaz e avisa', async () => {
    const request = failLater();
    api.patch.mockReturnValueOnce(request.promise);
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 7));
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(7));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/items/i1', {
        delta: 5,
        key: expect.any(String),
      }),
    );

    act(() => request.fail());
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(2));
    expect(toast.error).toHaveBeenCalled();
  });

  it('na demo, a escrita recusada desfaz sem toast: o convite da demo já respondeu', async () => {
    const request = failLater(answered(403, 'demo_read_only'));
    api.patch.mockReturnValueOnce(request.promise);
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 7));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    act(() => request.fail());

    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(2));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('removeItem tira da lista na hora; falha devolve', async () => {
    const request = failLater();
    api.delete.mockReturnValueOnce(request.promise);
    const { result } = await renderInventory();

    act(() => result.current.removeItem('i1'));
    await waitFor(() => expect(result.current.inventory?.items).toHaveLength(0));
    act(() => request.fail());

    await waitFor(() => expect(result.current.inventory?.items).toHaveLength(1));
    expect(toast.error).toHaveBeenCalled();
  });

  it('addItem manda para a mochila e põe na lista o que o servidor devolveu', async () => {
    const torch = { ...rope, id: 'i2', ref: 'dnd5e:srd:item:torch', quantity: 1 };
    api.post.mockResolvedValue(torch);
    const { result } = await renderInventory();
    api.get.mockResolvedValue({ ...inventory(), items: [rope, torch] });

    act(() => result.current.addItem('dnd5e:srd:item:torch'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: 'dnd5e:srd:item:torch',
        containerId: 'bag1',
        quantity: 1,
        key: expect.any(String),
      }),
    );
    await waitFor(() => expect(result.current.inventory?.items).toHaveLength(2));
  });

  // The dialog closes at once: without a toast, a slow network looks like nothing happened
  it('addItem avisa o que entrou e quantos há agora', async () => {
    const torch = {
      ...rope,
      id: 'i2',
      ref: 'dnd5e:srd:item:torch',
      quantity: 3,
      item: { name: 'Torch' },
    };
    api.post.mockResolvedValue(torch);
    const { result } = await renderInventory();

    act(() => result.current.addItem('dnd5e:srd:item:torch'));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        'Torch added (3 now)',
        expect.objectContaining({ id: expect.any(String) }),
      ),
    );
  });

  it('addItem de item que já está soma: a resposta troca a linha, não duplica', async () => {
    api.post.mockResolvedValue({ ...rope, quantity: 3 });
    const { result } = await renderInventory();
    api.get.mockResolvedValue({ ...inventory(), items: [{ ...rope, quantity: 3 }] });

    act(() => result.current.addItem(rope.ref));

    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(3));
    expect(result.current.inventory?.items).toHaveLength(1);
  });

  it('restoreItem manda de volta a mesma ref, quantidade e lugar', async () => {
    api.post.mockResolvedValue(rope);
    const { result } = await renderInventory();

    act(() => result.current.restoreItem(rope));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/api/characters/c1/inventory/items?locale=en', {
        ref: rope.ref,
        containerId: 'bag1',
        quantity: 2,
        key: expect.any(String),
      }),
    );
  });

  it('setCoins troca as moedas da algibeira na hora e manda só a diferença, com chave', async () => {
    const { result } = await renderInventory();
    const coins = { ...ZERO, gp: 1 };
    api.get.mockResolvedValue({
      ...inventory(),
      containers: [{ ...inventory().containers[0], coins }, inventory().containers[1]],
    });

    act(() => result.current.setCoins(coins));

    await waitFor(() => expect(result.current.pouch?.coins).toEqual(coins));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
        containerId: 'pouch1',
        delta: { gp: -4 },
        key: expect.any(String),
      }),
    );
  });

  it('duas moedas seguidas, a primeira falha: o valor da segunda não some e no fim vale o do servidor', async () => {
    const first = failLater();
    const second = failLater();
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise as never);
    const { result } = await renderInventory();
    const one = { ...ZERO, gp: 1 };
    const two = { ...ZERO, gp: 2 };

    act(() => result.current.setCoins(one));
    await waitFor(() => expect(result.current.pouch?.coins).toEqual(one));
    act(() => result.current.setCoins(two));
    await waitFor(() => expect(result.current.pouch?.coins).toEqual(two));
    const refetches = api.get.mock.calls.length;

    act(() => first.fail());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    // Still one write in flight: no refetch yet. Only the failed one (-4, from 5 to 1) is undone:
    // the 5 on the server plus the +1 still on its way
    expect(api.get.mock.calls.length).toBe(refetches);
    expect(result.current.pouch?.coins.gp).toBe(6);

    api.get.mockResolvedValue({
      ...inventory(),
      containers: [
        { ...inventory().containers[0], coins: { ...ZERO, gp: 9 } },
        inventory().containers[1],
      ],
    });
    act(() => second.fail());
    await waitFor(() => expect(result.current.pouch?.coins.gp).toBe(9));
    expect(api.get.mock.calls.length).toBeGreaterThan(refetches);
  });

  it('duas quantidades seguidas, a primeira mais lenta: a segunda chega ao servidor por último', async () => {
    let resolveFirst!: () => void;
    api.patch
      .mockReturnValueOnce(
        new Promise<never>((resolve) => (resolveFirst = () => resolve(undefined as never))),
      )
      .mockResolvedValueOnce(undefined as never);
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 3));
    act(() => result.current.setQuantity('i1', 4));
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(4));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenLastCalledWith('/api/characters/c1/inventory/items/i1', {
      delta: 1,
      key: expect.any(String),
    });

    act(() => resolveFirst());
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    expect(api.patch).toHaveBeenLastCalledWith('/api/characters/c1/inventory/items/i1', {
      delta: 1,
      key: expect.any(String),
    });
    // Each operation has its own key: a repeat of one is not the other
    const keys = api.patch.mock.calls.map(([, body]) => (body as { key: string }).key);
    expect(new Set(keys).size).toBe(2);
  });

  it('remover e desfazer: o POST só sai depois do DELETE, e o item fica', async () => {
    let resolveDelete!: () => void;
    api.delete.mockReturnValueOnce(
      new Promise<never>((resolve) => (resolveDelete = () => resolve(undefined as never))),
    );
    api.post.mockResolvedValue(rope);
    const { result } = await renderInventory();

    act(() => result.current.removeItem('i1'));
    act(() => result.current.restoreItem(rope));
    await waitFor(() => expect(api.delete).toHaveBeenCalledTimes(1));
    expect(api.post).not.toHaveBeenCalled();

    act(() => resolveDelete());
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.inventory?.items).toEqual([rope]));
  });

  it('duas quantidades seguidas, a primeira falha: só ela é desfeita', async () => {
    const first = failLater();
    const second = failLater();
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise as never);
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 3));
    act(() => result.current.setQuantity('i1', 5));
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(5));

    act(() => first.fail());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    // 2 on the server, +2 still on its way
    expect(result.current.inventory?.items[0].quantity).toBe(4);
  });

  it('remover falha com outra escrita no meio: volta só a entrada removida, no lugar dela', async () => {
    const torch = { ...rope, id: 'i2', ref: 'dnd5e:srd:item:torch', quantity: 1 };
    api.get.mockResolvedValue({ ...inventory(), items: [rope, torch] });
    const request = failLater();
    api.delete.mockReturnValueOnce(request.promise);
    let resolvePatch!: () => void;
    api.patch.mockReturnValueOnce(
      new Promise<never>((resolve) => (resolvePatch = () => resolve(undefined as never))),
    );
    const { result } = renderHookWithProviders(() => useInventory('c1'));
    await waitFor(() => expect(result.current.inventory?.items).toHaveLength(2));

    act(() => result.current.removeItem('i1'));
    act(() => result.current.setQuantity('i2', 4));
    await waitFor(() =>
      expect(result.current.inventory?.items).toEqual([{ ...torch, quantity: 4 }]),
    );

    act(() => request.fail());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    // The torch keeps its +3 still on its way; a whole-list snapshot would have put back 1
    expect(result.current.inventory?.items).toEqual([rope, { ...torch, quantity: 4 }]);
    act(() => resolvePatch());
  });

  it('"Tentar de novo" reenvia a mesma operação com a mesma chave', async () => {
    const request = failLater(answered(503, 'common_error_unexpected'));
    api.patch.mockReturnValueOnce(request.promise).mockResolvedValueOnce(undefined as never);
    const { result } = await renderInventory();

    act(() => result.current.setCoins({ ...ZERO, gp: 7 }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    act(() => request.fail());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(result.current.pouch?.coins.gp).toBe(5);

    const action = retryAction();
    expect(action?.label).toBe('Try again');
    act(() => action?.onClick());

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    const [first, again] = api.patch.mock.calls.map(([, body]) => body);
    expect(again).toEqual(first);
    expect(again).toEqual({ containerId: 'pouch1', delta: { gp: 2 }, key: expect.any(String) });
  });

  it('sem conexão também oferece "Tentar de novo"', async () => {
    api.patch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 3));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(retryAction()?.label).toBe('Try again');
  });

  // Sending the same thing again would fail the same way: the toast says what changed instead
  it('conflito (409) não oferece "Tentar de novo"', async () => {
    api.patch.mockRejectedValueOnce(answered(409, 'character_error_not_enough_coins'));
    const { result } = await renderInventory();

    act(() => result.current.setCoins({ ...ZERO, gp: 1 }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.lastCall?.[0]).toMatch(/^The coins changed somewhere else/);
    expect(retryAction()).toBeUndefined();
  });

  it('item que outra pessoa já tirou (404): diz isso, sem "Tentar de novo"', async () => {
    api.delete.mockRejectedValueOnce(answered(404, 'character_error_item_not_found'));
    const { result } = await renderInventory();

    act(() => result.current.removeItem('i1'));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.lastCall?.[0]).toBe(
      'This item was already taken out somewhere else. The list was updated.',
    );
    expect(retryAction()).toBeUndefined();
  });

  describe('moeda digitada à mão (valor final)', () => {
    it('manda o valor final e o que a tela mostrava, e mostra na hora', async () => {
      let resolve!: () => void;
      api.patch.mockReturnValueOnce(new Promise((r) => (resolve = () => r(undefined as never))));
      const { result } = await renderInventory();

      act(() => result.current.setCoinTo('gp', 70, 5));

      await waitFor(() => expect(result.current.pouch?.coins.gp).toBe(70));
      expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
        containerId: 'pouch1',
        coins: { gp: 70 },
        expected: { gp: 5 },
        key: expect.any(String),
      });
      act(() => resolve());
    });

    it('o mesmo valor que a tela mostrava não manda nada', async () => {
      const { result } = await renderInventory();

      act(() => result.current.setCoinTo('gp', 5, 5));

      expect(api.patch).not.toHaveBeenCalled();
    });

    it('mudou em outro lugar (409): volta, diz quanto há agora e não oferece "Tentar de novo"', async () => {
      const request = failLater(
        answered(409, 'character_error_coins_changed', { coins: { ...ZERO, gp: 55 } }),
      );
      api.patch.mockReturnValueOnce(request.promise);
      const { result } = await renderInventory();

      act(() => result.current.setCoinTo('gp', 70, 5));
      await waitFor(() => expect(result.current.pouch?.coins.gp).toBe(70));
      api.get.mockResolvedValue({
        ...inventory(),
        containers: [
          { ...inventory().containers[0], coins: { ...ZERO, gp: 55 } },
          inventory().containers[1],
        ],
      });
      act(() => request.fail());

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(vi.mocked(toast.error).mock.lastCall?.[0]).toBe(
        "Changed somewhere else: it's now 55 GP. What you typed was not saved.",
      );
      expect(retryAction()).toBeUndefined();
      // The refetch brings what the server has, not what was typed
      await waitFor(() => expect(result.current.pouch?.coins.gp).toBe(55));
    });

    it('mudou em outro lugar com 1 moeda: a frase concorda com o número', async () => {
      const request = failLater(
        answered(409, 'character_error_coins_changed', { coins: { ...ZERO, gp: 1 } }),
      );
      api.patch.mockReturnValueOnce(request.promise);
      const { result } = await renderInventory();

      act(() => result.current.setCoinTo('gp', 70, 5));
      await waitFor(() => expect(result.current.pouch?.coins.gp).toBe(70));
      act(() => request.fail());

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(vi.mocked(toast.error).mock.lastCall?.[0]).toBe(
        "Changed somewhere else: it's now 1 GP. What you typed was not saved.",
      );
    });

    it.each([
      ['pt', pt, 1, 'Mudou em outro lugar: agora é 1 PO. O valor digitado não foi salvo.'],
      ['pt', pt, 55, 'Mudou em outro lugar: agora são 55 PO. O valor digitado não foi salvo.'],
      ['pt', pt, 1200, 'Mudou em outro lugar: agora são 1.200 PO. O valor digitado não foi salvo.'],
      ['en', en, 1, "Changed somewhere else: it's now 1 GP. What you typed was not saved."],
      ['en', en, 1200, "Changed somewhere else: it's now 1,200 GP. What you typed was not saved."],
    ])('o aviso em %s com %i concorda no plural', (locale, messages, count, text) => {
      const t = createTranslator({ locale, messages, namespace: 'characters.coins' });
      expect(t('changedElsewhere', { count, coin: t('gp.short') })).toBe(text);
    });

    it('erro do servidor (5xx): volta ao que era e oferece "Tentar de novo" com a mesma chave', async () => {
      const request = failLater(answered(500, 'common_error_unexpected'));
      api.patch.mockReturnValueOnce(request.promise).mockResolvedValueOnce(undefined as never);
      const { result } = await renderInventory();

      act(() => result.current.setCoinTo('gp', 70, 5));
      await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
      act(() => request.fail());
      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(result.current.pouch?.coins.gp).toBe(5);

      act(() => retryAction()?.onClick());
      await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
      const [first, again] = api.patch.mock.calls.map(([, body]) => body);
      expect(again).toEqual(first);
    });

    it('no baú da mesa, vai para a rota do baú', async () => {
      api.get.mockResolvedValue({
        containers: [{ id: 'chest1', kind: 'party_chest', name: null, position: 0, coins: ZERO }],
        items: [],
      });
      const { result } = renderHookWithProviders(() => usePartyChest('p1'));
      await waitFor(() => expect(result.current.pouch?.id).toBe('chest1'));

      act(() => result.current.setCoinTo('gp', 70, 0));

      await waitFor(() =>
        expect(api.patch).toHaveBeenCalledWith('/api/parties/p1/chest/coins', {
          containerId: 'chest1',
          coins: { gp: 70 },
          expected: { gp: 0 },
          key: expect.any(String),
        }),
      );
    });
  });

  it('a mesma quantidade ou as mesmas moedas não mandam nada', async () => {
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 2));
    act(() => result.current.setCoins({ ...ZERO, gp: 5 }));

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('o baú da mesa manda as moedas como diferença na rota da mesa', async () => {
    api.get.mockResolvedValue({
      containers: [{ id: 'chest1', kind: 'party_chest', name: null, position: 0, coins: ZERO }],
      items: [],
    });
    const { result } = renderHookWithProviders(() => usePartyChest('p1'));
    await waitFor(() => expect(result.current.pouch?.id).toBe('chest1'));

    act(() => result.current.setCoins({ ...ZERO, gp: 1 }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/parties/p1/chest/coins', {
        containerId: 'chest1',
        delta: { gp: 1 },
        key: expect.any(String),
      }),
    );
  });
});

describe('coinsDelta', () => {
  it('só as moedas que mudam, com sinal', () => {
    expect(coinsDelta({ ...ZERO, gp: 5, sp: 2 }, { ...ZERO, gp: 4, cp: 10, sp: 2 })).toEqual({
      gp: -1,
      cp: 10,
    });
  });
});
