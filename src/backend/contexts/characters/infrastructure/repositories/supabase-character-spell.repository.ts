import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import {
  CharacterSpellLink,
  CharacterSpellRepo,
} from '../../domain/repository/character-spell.repo';

export class SupabaseCharacterSpellRepository implements CharacterSpellRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByCharacterId(characterId: string): Promise<CharacterSpellLink[]> {
    const { data, error } = await this.client
      .from('character_spells')
      .select('spell_ref, is_prepared, created_at')
      .eq('character_id', characterId)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch character spells: ${error.message}`);
    }

    return data.map((row) => ({
      ref: row.spell_ref,
      isPrepared: row.is_prepared ?? false,
      createdAt: row.created_at || undefined,
    }));
  }

  async learn(characterId: string, ref: string): Promise<void> {
    const { error } = await (this.client.from('character_spells').insert({
      character_id: characterId,
      spell_ref: ref,
    }) as PromiseLike<{ error: { message: string; code?: string } | null }>);

    if (error && error.code !== '23505') {
      // 23505 is unique violation, meaning already learned
      throw new Error(`Failed to learn spell: ${error.message}`);
    }
  }

  async forget(characterId: string, ref: string): Promise<void> {
    const { error } = await this.client
      .from('character_spells')
      .delete()
      .eq('character_id', characterId)
      .eq('spell_ref', ref);

    if (error) {
      throw new Error(`Failed to forget spell: ${error.message}`);
    }
  }

  async togglePrepared(characterId: string, ref: string, isPrepared: boolean): Promise<void> {
    const { error } = await (this.client
      .from('character_spells')
      .update({ is_prepared: isPrepared })
      .eq('character_id', characterId)
      .eq('spell_ref', ref) as PromiseLike<{ error: { message: string } | null }>);

    if (error) {
      throw new Error(`Failed to toggle spell preparation: ${error.message}`);
    }
  }
}
