import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import {
  CharacterSpellRelation,
  CharacterSpellRepo,
} from '../../domain/repository/character-spell.repo';

export class SupabaseCharacterSpellRepository implements CharacterSpellRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByCharacterId(
    characterId: string,
    locale: string = 'en',
  ): Promise<CharacterSpellRelation[]> {
    const { data, error } = await this.client
      .from('character_spells')
      .select(
        `
        spell_id,
        is_prepared,
        created_at,
        spells (
          level,
          school,
          spell_translations (
            name
          )
        )
      `,
      )
      .eq('character_id', characterId)
      .eq('spells.spell_translations.locale', locale);

    if (error) {
      console.error('Error fetching character spells:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      spellId: row.spell_id,
      isPrepared: row.is_prepared ?? false,
      createdAt: row.created_at,
      name: row.spells?.spell_translations?.[0]?.name || row.spell_id,
      level: row.spells?.level || 0,
      school: row.spells?.school || '',
    }));
  }

  async learn(characterId: string, spellId: string): Promise<void> {
    const { error } = await (this.client.from('character_spells').insert({
      character_id: characterId,
      spell_id: spellId,
    }) as PromiseLike<{ error: { message: string; code?: string } | null }>);

    if (error && error.code !== '23505') {
      // 23505 is unique violation, meaning already learned
      throw new Error(`Failed to learn spell: ${error.message}`);
    }
  }

  async forget(characterId: string, spellId: string): Promise<void> {
    const { error } = await this.client
      .from('character_spells')
      .delete()
      .eq('character_id', characterId)
      .eq('spell_id', spellId);

    if (error) {
      throw new Error(`Failed to forget spell: ${error.message}`);
    }
  }

  async togglePrepared(characterId: string, spellId: string, isPrepared: boolean): Promise<void> {
    const { error } = await (this.client
      .from('character_spells')
      .update({ is_prepared: isPrepared } as { [key: string]: boolean })
      .eq('character_id', characterId)
      .eq('spell_id', spellId) as PromiseLike<{ error: { message: string } | null }>);

    if (error) {
      throw new Error(`Failed to toggle spell preparation: ${error.message}`);
    }
  }
}
