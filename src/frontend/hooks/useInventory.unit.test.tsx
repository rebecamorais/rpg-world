import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { useInventory } from './useInventory';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
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

/** A request that fails only when the test says so, to look at the screen in between. */
function failLater() {
  let fail!: () => void;
  const promise = new Promise<never>((_, reject) => {
    fail = () => reject(new Error('boom'));
  });
  return { promise, fail };
}

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acha a algibeira e a mochila', async () => {
    const { result } = await renderInventory();

    expect(result.current.pouch?.id).toBe('pouch1');
    expect(result.current.backpack?.id).toBe('bag1');
  });

  it('setQuantity grava o valor absoluto e mostra na hora; falha desfaz e avisa', async () => {
    const request = failLater();
    api.patch.mockReturnValueOnce(request.promise);
    const { result } = await renderInventory();

    act(() => result.current.setQuantity('i1', 7));
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(7));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/api/characters/c1/inventory/items/i1', {
        quantity: 7,
      }),
    );

    act(() => request.fail());
    await waitFor(() => expect(result.current.inventory?.items[0].quantity).toBe(2));
    expect(toast.error).toHaveBeenCalled();
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
      }),
    );
    await waitFor(() => expect(result.current.inventory?.items).toHaveLength(2));
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
      }),
    );
  });

  it('setCoins troca as moedas da algibeira na hora e manda o PUT', async () => {
    const { result } = await renderInventory();
    const coins = { ...ZERO, gp: 1 };
    api.get.mockResolvedValue({
      ...inventory(),
      containers: [{ ...inventory().containers[0], coins }, inventory().containers[1]],
    });

    act(() => result.current.setCoins(coins));

    await waitFor(() => expect(result.current.pouch?.coins).toEqual(coins));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith('/api/characters/c1/inventory/coins', {
        containerId: 'pouch1',
        coins,
      }),
    );
  });

  it('duas moedas seguidas, a primeira falha: o valor da segunda não some e no fim vale o do servidor', async () => {
    const first = failLater();
    const second = failLater();
    api.put.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise as never);
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
    // Still one write in flight: no refetch yet, and the newer value stands
    expect(api.get.mock.calls.length).toBe(refetches);

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
      quantity: 3,
    });

    act(() => resolveFirst());
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
    expect(api.patch).toHaveBeenLastCalledWith('/api/characters/c1/inventory/items/i1', {
      quantity: 4,
    });
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
});
