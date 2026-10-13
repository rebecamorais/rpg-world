import { describe, expect, it } from 'vitest';

import { SupabaseCharacterSpellRepository } from '@backend/contexts/characters/infrastructure/repositories/supabase-character-spell.repository';
import { SupabaseCharacterRepository } from '@backend/contexts/characters/infrastructure/repositories/supabase-character.repository';
import { SupabaseLoreRepository } from '@backend/contexts/lore/infrastructure/repositories/supabase-lore.repository';
import { SupabaseProfileRepository } from '@backend/contexts/users/infrastructure/repositories/supabase-profile-repository';

import { SupabaseFactory } from '@lib/supabase';

// A database failure must surface (and become a 500), not be reported as "no data".
// A malformed UUID is an easy way to make Postgres reject the query.
describe('repositórios propagam erros do banco (Integration)', () => {
  const client = SupabaseFactory.createAdmin();
  const MALFORMED_ID = 'not-a-uuid';
  const MISSING_ID = '00000000-0000-0000-0000-000000000000';

  it('characters: erro propaga, ausência continua null/[]', async () => {
    const repo = new SupabaseCharacterRepository(client);
    await expect(repo.findById(MALFORMED_ID)).rejects.toThrow();
    await expect(repo.findByOwner(MALFORMED_ID)).rejects.toThrow();
    expect(await repo.findById(MISSING_ID)).toBeNull();
    expect(await repo.findByOwner(MISSING_ID)).toEqual([]);
  });

  it('character_spells: erro propaga', async () => {
    const repo = new SupabaseCharacterSpellRepository(client);
    await expect(repo.findByCharacterId(MALFORMED_ID)).rejects.toThrow();
    expect(await repo.findByCharacterId(MISSING_ID)).toEqual([]);
  });

  it('character_lore: erro propaga, ausência continua null', async () => {
    const repo = new SupabaseLoreRepository(client);
    await expect(repo.findByCharacterId(MALFORMED_ID)).rejects.toThrow();
    await expect(repo.delete(MALFORMED_ID)).rejects.toThrow();
    expect(await repo.findByCharacterId(MISSING_ID)).toBeNull();
  });

  it('profile: erro propaga, ausência continua null', async () => {
    const repo = new SupabaseProfileRepository(client);
    await expect(repo.getById(MALFORMED_ID)).rejects.toThrow();
    expect(await repo.getById(MISSING_ID)).toBeNull();
  });
});
