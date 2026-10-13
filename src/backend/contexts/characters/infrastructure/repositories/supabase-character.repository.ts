import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Lore } from '@backend/contexts/lore/domain/Lore';

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
      .maybeSingle();

    if (error) throw new Error(`Failed to find character: ${error.message}`);
    if (!data) return null;

    return this.mapToDomain(data as unknown as DbCharacterRow);
  }

  async findByOwner(ownerUsername: string): Promise<Character[]> {
    const { data, error } = await this.client
      .from('characters')
      .select('*')
      .eq('owner_id', ownerUsername)
      .is('deleted_at', null);

    if (error) throw new Error(`Failed to list characters: ${error.message}`);

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
      accentColor: _accentColor,
      avatarUrl: _avatarUrl,
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
      attributes: attributes as NonNullable<Json>,
      avatar_url: character.avatarUrl ?? null,
      theme_color: character.accentColor ?? '#6d28d9',
      system_data: { ...rest, hpTemp: hpTemp ?? 0 } as unknown as NonNullable<Json>,
      updated_at: new Date().toISOString(),
    };

    const { error: charError } = await this.client.from('characters').upsert(dbRow);

    if (charError) {
      throw new Error(`Failed to save character: ${charError.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    // RLS turns a forbidden update into a no-op rather than an error, so count affected rows.
    const { data, error } = await this.client
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id');

    if (error) throw new Error(`Failed to delete character: ${error.message}`);
    return data.length > 0;
  }

  private mapToDomain(row: DbCharacterRow): Character {
    const hp = new HealthPoints(row.hp_current, row.hp_max);
    const attributes = new Attributes(row.attributes as Record<string, number>);

    const lore = Lore.empty();

    if (row.system === 'dnd_5e') {
      const dndData = (row.system_data as Record<string, unknown>) || {};
      return new DnD5eCharacter({
        id: row.id,
        name: row.name,
        ownerUsername: row.owner_id,
        attributes,
        hp,
        level: row.level,
        classStr: (dndData.class as string) || '',
        race: (dndData.race as string) || '',
        ac: (dndData.ac as number) || 10,
        speed: (dndData.speed as number) || 30,
        initiative: (dndData.initiative as number) || 0,
        skills: (dndData.skills as Partial<Record<SkillKey, CharacterSkill>>) || {},
        savingThrowProficiencies:
          (dndData.savingThrowProficiencies as Partial<Record<AttributeKey, boolean>>) || {},
        passivePerception: (dndData.passivePerception as number) || 10,
        subclass: dndData.subclass as string | undefined,
        background: dndData.background as string | undefined,
        alignment: dndData.alignment as string | undefined,
        xp: dndData.xp as number | undefined,
        hitDice: dndData.hitDice as { total: string; current: number } | undefined,
        deathSaves: dndData.deathSaves as { successes: number; failures: number } | undefined,
        spellcastingSystem: dndData.spellcastingSystem as 'slots' | 'points' | undefined,
        spellcastingAbility: dndData.spellcastingAbility as AttributeKey | undefined,
        spellSaveDc: dndData.spellSaveDc as number | undefined,
        spellAttackBonus: dndData.spellAttackBonus as number | undefined,
        spellSlots: dndData.spellSlots as Record<string, { max: number; used: number }> | undefined,
        spellPoints: dndData.spellPoints as { max: number; current: number } | undefined,
        coins: dndData.coins as
          { cp: number; sp: number; ep: number; gp: number; pp: number } | undefined,
        hpTemp: (dndData.hpTemp as number) || 0,
        lore,
        accentColor: (row.theme_color as string) ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
      });
    }

    throw new Error(`System ${row.system} not implemented in repository mapping`);
  }
}
