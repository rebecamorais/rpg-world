import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Character } from '../../domain/entity/Character';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository/character.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

export class SupabaseCharacterRepository implements CharacterRepo {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Character | null> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  async findByOwner(ownerUsername: string): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('owner_id', ownerUsername)
      .is('deleted_at', null);

    if (error || !data) return [];

    return data.map((row) => this.mapToDomain(row));
  }

  async save(character: Character): Promise<void> {
    const json = character.toJSON();
    const { hp, attributes, system, ...rest } = json;

    const dbRow = {
      id: character.id,
      name: character.name,
      owner_id: character.ownerUsername,
      system: (system as string).toLowerCase() as any,
      level: character.level,
      hp_current: (hp as any).current,
      hp_max: (hp as any).max,
      attributes: attributes,
      system_data: rest,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client.from('characters').upsert(dbRow);

    if (error) {
      throw new Error(`Failed to save character: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  private mapToDomain(row: any): Character {
    const hp = new HealthPoints(row.hp_current, row.hp_max);
    const attributes = new Attributes(row.attributes);

    if (row.system === 'dnd_5e') {
      const dndData = row.system_data || {};
      return new DnD5eCharacter(
        row.id,
        row.name,
        row.owner_id,
        attributes,
        hp,
        row.level,
        dndData.characterClass,
        dndData.race,
        dndData.ac,
        dndData.speed,
        dndData.initiative,
        dndData.skills,
        dndData.savingThrowProficiencies,
        dndData.passivePerception,
        dndData.subclass,
        dndData.background,
        dndData.alignment,
        dndData.xp,
        dndData.hitDice,
        dndData.deathSaves,
        dndData.spellcastingSystem,
        dndData.spellcastingAbility,
        dndData.spellSaveDc,
        dndData.spellAttackBonus,
        dndData.spellSlots,
        dndData.spellPoints,
        dndData.spellsKnown,
        dndData.coins,
      );
    }

    throw new Error(
      `System ${row.system} not implemented in repository mapping`,
    );
  }
}
