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
