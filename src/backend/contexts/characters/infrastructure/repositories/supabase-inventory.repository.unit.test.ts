import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import type { Database } from '@database-types';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { SupabaseInventoryRepository } from './supabase-inventory.repository';

/** A client whose container lookup finds the container and whose rpc fails with `error`. */
function repoFailingWith(error: { code?: string; message: string }) {
  const lookup = {
    select: () => lookup,
    eq: () => lookup,
    neq: () => lookup,
    maybeSingle: async () => ({ data: { id: 'k1' }, error: null }),
  };
  const client = {
    from: () => lookup,
    rpc: async () => ({ data: null, error }),
  } as unknown as SupabaseClient<Database>;
  return new SupabaseInventoryRepository(client);
}

describe('SupabaseInventoryRepository.addItem', () => {
  it('limite de entradas do banco vira erro de validação traduzível', async () => {
    const repo = repoFailingWith({ code: 'P0001', message: 'item_limit' });

    await expect(repo.addItem('c1', 'k1', 'dnd5e:srd:item:rope', 1)).rejects.toMatchObject({
      message: CharacterErrorCodes.ITEM_LIMIT,
      kind: 'validation',
    });
  });

  it('limite de lugares do banco vira erro de validação traduzível', async () => {
    const repo = repoFailingWith({ code: 'P0001', message: 'container_limit' });

    await expect(repo.addItem('c1', 'k1', 'dnd5e:srd:item:rope', 1)).rejects.toMatchObject({
      message: CharacterErrorCodes.CONTAINER_LIMIT,
      kind: 'validation',
    });
  });

  it('outros erros do banco continuam como falha comum', async () => {
    const repo = repoFailingWith({ code: 'XX000', message: 'boom' });

    await expect(repo.addItem('c1', 'k1', 'dnd5e:srd:item:rope', 1)).rejects.toThrow(
      'Failed to add item: boom',
    );
  });

  it('não aceita a algibeira como lugar do item', async () => {
    // A tiny containers table, filtered by what the repository asks
    const rows = [
      { id: 'pouch1', character_id: 'c1', kind: 'coin_pouch' },
      { id: 'bag1', character_id: 'c1', kind: 'backpack' },
    ];
    let rpcCalls = 0;
    const client = {
      from: () => {
        const filters: ((row: (typeof rows)[number]) => boolean)[] = [];
        const lookup = {
          select: () => lookup,
          eq: (column: keyof (typeof rows)[number], value: string) => {
            filters.push((row) => row[column] === value);
            return lookup;
          },
          neq: (column: keyof (typeof rows)[number], value: string) => {
            filters.push((row) => row[column] !== value);
            return lookup;
          },
          maybeSingle: async () => ({
            data: rows.find((row) => filters.every((f) => f(row))) ?? null,
            error: null,
          }),
        };
        return lookup;
      },
      rpc: async () => {
        rpcCalls += 1;
        return {
          data: { id: 'e1', container_id: 'bag1', item_ref: 'r', quantity: 1 },
          error: null,
        };
      },
    } as unknown as SupabaseClient<Database>;
    const repo = new SupabaseInventoryRepository(client);

    expect(await repo.addItem('c1', 'pouch1', 'dnd5e:srd:item:rope', 1)).toBeNull();
    expect(rpcCalls).toBe(0);
    expect(await repo.addItem('c1', 'bag1', 'dnd5e:srd:item:rope', 1)).not.toBeNull();
    expect(rpcCalls).toBe(1);
  });
});

describe('SupabaseInventoryRepository: operações com chave', () => {
  /** A client that records the rpc it got and answers `data`. */
  function repoAnswering(data: unknown, owner: 'character_id' | 'party_id' = 'party_id') {
    const calls: [string, unknown][] = [];
    const lookup = {
      select: () => lookup,
      eq: () => lookup,
      neq: () => lookup,
      maybeSingle: async () => ({ data: { id: 'k1' }, error: null }),
    };
    const client = {
      from: () => lookup,
      rpc: async (fn: string, args: unknown) => {
        calls.push([fn, args]);
        return { data, error: null };
      },
    } as unknown as SupabaseClient<Database>;
    return { repo: new SupabaseInventoryRepository(client, owner), calls };
  }

  it('changeCoins manda a diferença, o dono e a chave', async () => {
    const coins = { cp: 0, sp: 0, ep: 0, gp: 252, pp: 0 };
    const { repo, calls } = repoAnswering(coins);

    expect(await repo.changeCoins('p1', 'k1', { gp: 1 }, 'key-1')).toEqual(coins);
    expect(calls).toEqual([
      [
        'change_container_coins',
        { p_owner_id: 'p1', p_container_id: 'k1', p_delta: { gp: 1 }, p_key: 'key-1' },
      ],
    ]);
  });

  it('changeQuantity manda a diferença e devolve a quantidade nova', async () => {
    const { repo, calls } = repoAnswering(4);

    expect(await repo.changeQuantity('c1', 'i1', -1, 'key-1')).toBe(4);
    expect(calls[0]).toEqual([
      'change_inventory_item_quantity',
      { p_owner_id: 'c1', p_item_id: 'i1', p_delta: -1, p_key: 'key-1' },
    ]);
  });

  it('addItem com chave usa add_inventory_item_once', async () => {
    const row = { id: 'i1', container_id: 'k1', item_ref: 'r', quantity: 1, created_at: '' };
    const { repo, calls } = repoAnswering(row, 'character_id');

    await repo.addItem('c1', 'k1', 'r', 1, 'key-1');
    expect(calls[0]).toEqual([
      'add_inventory_item_once',
      { p_container_id: 'k1', p_item_ref: 'r', p_quantity: 1, p_key: 'key-1' },
    ]);
  });

  it.each([
    ['not_enough_coins', CharacterErrorCodes.NOT_ENOUGH_COINS],
    ['item_quantity_conflict', CharacterErrorCodes.ITEM_QUANTITY_CONFLICT],
  ])('%s do banco vira conflito traduzível', async (message, code) => {
    const repo = repoFailingWith({ code: 'P0001', message });

    await expect(repo.changeCoins('c1', 'k1', { gp: -1 }, 'key')).rejects.toMatchObject({
      message: code,
      kind: 'conflict',
    });
    await expect(repo.changeQuantity('c1', 'i1', -1, 'key')).rejects.toMatchObject({
      message: code,
      kind: 'conflict',
    });
  });
});
