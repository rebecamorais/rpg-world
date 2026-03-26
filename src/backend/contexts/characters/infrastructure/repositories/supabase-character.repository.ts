import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Lore } from '@backend/contexts/lore';

import { Database, Json } from '@database-types';

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

type DbCharacterRow = Database['public']['Tables']['characters']['Row'] & {
  character_lore?: unknown;
};
type DbCharacterInsert = Database['public']['Tables']['characters']['Insert'];

export class SupabaseCharacterRepository implements CharacterRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Character | null> {
    const { data, error } = await this.client
      .from('characters')
      .select('*, character_lore(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    return this.mapToDomain(data as unknown as DbCharacterRow);
  }

  async findByOwner(ownerUsername: string): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*, character_lore(*)')
      .eq('owner_id', ownerUsername)
      .is('deleted_at', null);

    if (error || !data) return [];

    return data.map((row) => this.mapToDomain(row as unknown as DbCharacterRow));
  }

  async save(character: Character): Promise<void> {
    const json = character.toJSON();
    const {
      hpCurrent,
      hpMax,
      hpTemp,
      attributes,
      system,
      id: _id,
      name: _name,
      ownerUsername: _ownerUsername,
      level: _level,
      // Lore fields
      age,
      height,
      weight,
      eyes,
      skin,
      hair,
      backstory,
      personalityTraits,
      ideals,
      bonds,
      flaws,
      alliesAndEnemies,
      organizations,
      treasure,
      accentColor,
      ...rest
    } = json;

    const dbRow: DbCharacterInsert = {
      id: character.id,
      name: character.name,
      owner_id: character.ownerUsername,
      system: (system as string).toLowerCase() as Database['public']['Enums']['rpg_system'],
      level: character.level,
      hp_current: hpCurrent as number,
      hp_max: hpMax as number,
      attributes: attributes as Json,
      system_data: { ...rest, hpTemp: hpTemp ?? 0, accentColor } as unknown as Json,
      updated_at: new Date().toISOString(),
    };

    const { error: charError } = await this.client.from('characters').upsert(dbRow);

    if (charError) {
      throw new Error(`Failed to save character: ${charError.message}`);
    }

    // Save Lore in separate table
    const loreRow = {
      character_id: character.id,
      age: age as string,
      height: height as string,
      weight: weight as string,
      eyes: eyes as string,
      skin: skin as string,
      hair: hair as string,
      backstory: backstory as string,
      personality_traits: personalityTraits as string,
      ideals: ideals as string,
      bonds: bonds as string,
      flaws: flaws as string,
      allies_and_enemies: alliesAndEnemies as string,
      organizations: organizations as string,
      treasure: treasure as string,
      updated_at: new Date().toISOString(),
    };

    const { error: loreError } = await this.client.from('character_lore').upsert(loreRow);
    if (loreError) {
      throw new Error(`Failed to save character lore: ${loreError.message}`);
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

    // Handle lore from joined data
    const loreData = (
      Array.isArray(row.character_lore) ? row.character_lore[0] : row.character_lore
    ) as Record<string, unknown> | null;
    const lore = loreData ? Lore.fromJSON(loreData) : Lore.empty();

    if (row.system === 'dnd_5e') {
      const dndData = (row.system_data as Record<string, unknown>) || {};
      return new DnD5eCharacter(
        row.id,
        row.name,
        row.owner_id,
        attributes,
        hp,
        row.level,
        (dndData.class as string) || '',
        (dndData.race as string) || '',
        (dndData.ac as number) || 10,
        (dndData.speed as number) || 30,
        (dndData.initiative as number) || 0,
        (dndData.skills as Partial<Record<SkillKey, CharacterSkill>>) || {},
        (dndData.savingThrowProficiencies as Partial<Record<AttributeKey, boolean>>) || {},
        (dndData.passivePerception as number) || 10,
        dndData.subclass as string | undefined,
        dndData.background as string | undefined,
        dndData.alignment as string | undefined,
        dndData.xp as number | undefined,
        dndData.hitDice as { total: string; current: number } | undefined,
        dndData.deathSaves as { successes: number; failures: number } | undefined,
        dndData.spellcastingSystem as 'slots' | 'points' | undefined,
        dndData.spellcastingAbility as AttributeKey | undefined,
        dndData.spellSaveDc as number | undefined,
        dndData.spellAttackBonus as number | undefined,
        dndData.spellSlots as Record<string, { max: number; used: number }> | undefined,
        dndData.spellPoints as { max: number; current: number } | undefined,
        (dndData.spellsKnown as string[]) || [],
        dndData.coins as { cp: number; sp: number; ep: number; gp: number; pp: number } | undefined,
        (dndData.hpTemp as number) || 0,
        lore,
        dndData.accentColor as string | undefined,
      );
    }

    throw new Error(`System ${row.system} not implemented in repository mapping`);
  }
}
