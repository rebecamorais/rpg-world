import { Database, Json } from '@database-types';
import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Character } from '../../domain/entity/Character';
import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository/character.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

type DbCharacterRow = Database['public']['Tables']['characters']['Row'];
type DbCharacterInsert = Database['public']['Tables']['characters']['Insert'];

export class SupabaseCharacterRepository implements CharacterRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

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

    const hpData = hp as { current: number; max: number };

    const dbRow: DbCharacterInsert = {
      id: character.id,
      name: character.name,
      owner_id: character.ownerUsername,
      system: (
        system as string
      ).toLowerCase() as Database['public']['Enums']['rpg_system'],
      level: character.level,
      hp_current: hpData.current,
      hp_max: hpData.max,
      attributes: attributes as Json,
      system_data: rest as Json,
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

  private mapToDomain(row: DbCharacterRow): Character {
    const hp = new HealthPoints(row.hp_current, row.hp_max);
    const attributes = new Attributes(row.attributes as Record<string, number>);

    if (row.system === 'dnd_5e') {
      const dndData = (row.system_data as Record<string, unknown>) || {};
      return new DnD5eCharacter(
        row.id,
        row.name,
        row.owner_id,
        attributes,
        hp,
        row.level,
        (dndData.characterClass as string) || '',
        (dndData.race as string) || '',
        (dndData.ac as number) || 10,
        (dndData.speed as number) || 30,
        (dndData.initiative as number) || 0,
        (dndData.skills as Partial<Record<SkillKey, CharacterSkill>>) || {},
        (dndData.savingThrowProficiencies as Partial<
          Record<AttributeKey, boolean>
        >) || {},
        (dndData.passivePerception as number) || 10,
        dndData.subclass as string | undefined,
        dndData.background as string | undefined,
        dndData.alignment as string | undefined,
        dndData.xp as number | undefined,
        dndData.hitDice as { total: string; current: number } | undefined,
        dndData.deathSaves as
          | { successes: number; failures: number }
          | undefined,
        dndData.spellcastingSystem as 'slots' | 'points' | undefined,
        dndData.spellcastingAbility as AttributeKey | undefined,
        dndData.spellSaveDc as number | undefined,
        dndData.spellAttackBonus as number | undefined,
        dndData.spellSlots as
          | Record<string, { max: number; used: number }>
          | undefined,
        dndData.spellPoints as { max: number; current: number } | undefined,
        (dndData.spellsKnown as string[]) || [],
        dndData.coins as
          | { cp: number; sp: number; ep: number; gp: number; pp: number }
          | undefined,
      );
    }

    throw new Error(
      `System ${row.system} not implemented in repository mapping`,
    );
  }
}
