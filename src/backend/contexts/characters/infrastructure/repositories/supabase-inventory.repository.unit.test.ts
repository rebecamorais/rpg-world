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
});
