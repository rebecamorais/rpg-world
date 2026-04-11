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
          concentration,
          ritual,
          components,
          material_cost,
          is_scaling,
          casting_time,
          casting_value,
          duration_unit,
          duration_value,
          range_unit,
          range_value,
          damage_type,
          spell_category,
          bg_style_id,
          spell_translations (
            name,
            description,
            higher_level,
            material
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

    return data.map((row) => ({
      id: row.spell_id,
      isPrepared: row.is_prepared ?? false,
      createdAt: row.created_at || undefined,
      name: row.spells?.spell_translations?.[0]?.name || row.spell_id,
      level: row.spells?.level || 0,
      school: row.spells?.school || '',
      components: row.spells?.components || [],
      concentration: row.spells?.concentration ?? false,
      ritual: row.spells?.ritual ?? false,
      materialCost: row.spells?.material_cost ?? 0,
      isScaling: row.spells?.is_scaling ?? false,
      description: row.spells?.spell_translations?.[0]?.description || '',
      higherLevel: row.spells?.spell_translations?.[0]?.higher_level || null,
      material: row.spells?.spell_translations?.[0]?.material || null,
      castingTime: row.spells?.casting_time || null,
      castingValue: row.spells?.casting_value || null,
      durationUnit: row.spells?.duration_unit || null,
      durationValue: row.spells?.duration_value || null,
      rangeUnit: row.spells?.range_unit || null,
      rangeValue: row.spells?.range_value || null,
      damageType: row.spells?.damage_type || null,
      spellCategory: row.spells?.spell_category || undefined,
      bgStyleId: row.spells?.bg_style_id || 'void-dots',
    }));
  }

  async learn(characterId: string, id: string): Promise<void> {
    const { error } = await (this.client.from('character_spells').insert({
      character_id: characterId,
      spell_id: id,
    }) as PromiseLike<{ error: { message: string; code?: string } | null }>);

    if (error && error.code !== '23505') {
      // 23505 is unique violation, meaning already learned
      throw new Error(`Failed to learn spell: ${error.message}`);
    }
  }

  async forget(characterId: string, id: string): Promise<void> {
    const { error } = await this.client
      .from('character_spells')
      .delete()
      .eq('character_id', characterId)
      .eq('spell_id', id);

    if (error) {
      throw new Error(`Failed to forget spell: ${error.message}`);
    }
  }

  async togglePrepared(characterId: string, id: string, isPrepared: boolean): Promise<void> {
    const { error } = await (this.client
      .from('character_spells')
      .update({ is_prepared: isPrepared })
      .eq('character_id', characterId)
      .eq('spell_id', id) as PromiseLike<{ error: { message: string } | null }>);

    if (error) {
      throw new Error(`Failed to toggle spell preparation: ${error.message}`);
    }
  }
}
