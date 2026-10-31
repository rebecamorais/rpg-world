import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../test/helpers/signed-in-client';

const PERMISSION_DENIED = '42501';

// Grants are the layer before RLS: a role without the grant is refused before any policy runs.
describe('Grants da Data API (Integration)', () => {
  it('a chave pública não lê nenhuma tabela', async () => {
    const anon = SupabaseFactory.createAnon();

    for (const table of [
      'profile',
      'characters',
      'character_lore',
      'character_spells',
      'feedback',
      'parties',
      'party_invites',
      'party_members',
      'party_characters',
    ] as const) {
      const { error } = await anon.from(table).select('*').limit(1);
      expect(error?.code, table).toBe(PERMISSION_DENIED);
    }
  });

  // The official spells live in content files now (content/dnd5e)
  it('as tabelas antigas de magias não existem mais', async () => {
    const anon = SupabaseFactory.createAnon();

    for (const table of ['spells', 'spell_translations']) {
      const { error } = await anon
        .from(table as never)
        .select('*')
        .limit(1);
      expect(error?.code, table).toBe('PGRST205');
    }
  });

  it('o usuário logado não alcança feedback', async () => {
    const { client } = await createSignedInClient('grants');

    const { error: feedbackError } = await client.from('feedback').select('*');

    expect(feedbackError?.code).toBe(PERMISSION_DENIED);
  });

  it('as funções de trigger não podem ser chamadas pela API', async () => {
    const { client } = await createSignedInClient('grants-rpc');

    const { error } = await client.rpc('handle_new_user' as never);

    expect(error).not.toBeNull();
  });
});
