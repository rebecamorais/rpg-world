import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import { Lore } from '../../domain/Lore';
import { LoreRepository } from '../../domain/repository/lore.repo';

export class SupabaseLoreRepository implements LoreRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByCharacterId(characterId: string): Promise<Lore | null> {
    const { data, error } = await this.client
      .from('character_lore')
      .select('*')
      .eq('character_id', characterId)
      .single();

    if (error || !data) return null;

    return Lore.fromJSON(data);
  }

  async save(id: string, lore: Lore): Promise<void> {
    const json = lore.toJSON();
    const dbRow = {
      character_id: id,
      age: json.age,
      height: json.height,
      weight: json.weight,
      eyes: json.eyes,
      skin: json.skin,
      hair: json.hair,
      backstory: json.backstory,
      personality_traits: json.personalityTraits,
      ideals: json.ideals,
      bonds: json.bonds,
      flaws: json.flaws,
      allies_and_enemies: json.alliesAndEnemies,
      organizations: json.organizations,
      treasure: json.treasure,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client.from('character_lore').upsert(dbRow);

    if (error) {
      throw new Error(`Failed to save lore: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    await this.client.from('character_lore').delete().eq('character_id', id);
  }
}
