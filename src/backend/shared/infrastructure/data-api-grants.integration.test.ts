import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../test/helpers/signed-in-client';

const PERMISSION_DENIED = '42501';
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

// Grants are the layer before RLS: a role without the grant is refused before any policy runs.
describe('Grants da Data API (Integration)', () => {
  it('a chave pública só lê o catálogo de magias', async () => {
    const anon = SupabaseFactory.createAnon();

    for (const table of ['spells', 'spell_translations'] as const) {
      const { error } = await anon.from(table).select('id').limit(1);
      expect(error).toBeNull();
    }

    for (const table of [
      'profile',
      'characters',
      'character_lore',
      'character_spells',
      'feedback',
    ] as const) {
      const { error } = await anon.from(table).select('*').limit(1);
      expect(error?.code, table).toBe(PERMISSION_DENIED);
    }

    const { error: writeError } = await anon.from('spells').delete().eq('id', NIL_UUID);
    expect(writeError?.code).toBe(PERMISSION_DENIED);
  });

  it('o usuário logado não alcança feedback nem escreve no catálogo', async () => {
    const { client } = await createSignedInClient('grants');

    const { error: feedbackError } = await client.from('feedback').select('*');
    const { error: spellsError } = await client.from('spells').delete().eq('id', NIL_UUID);

    expect(feedbackError?.code).toBe(PERMISSION_DENIED);
    expect(spellsError?.code).toBe(PERMISSION_DENIED);
  });

  it('as funções de trigger não podem ser chamadas pela API', async () => {
    const { client } = await createSignedInClient('grants-rpc');

    const { error } = await client.rpc('handle_new_user' as never);

    expect(error).not.toBeNull();
  });
});
