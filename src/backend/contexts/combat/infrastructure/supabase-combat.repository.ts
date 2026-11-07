import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Database, Json } from '@database-types';

import { CombatError, CombatErrorCode, CombatErrorCodes } from '../domain/CombatError';
import { ActiveCondition, Life, NpcFate, Side, Visibility } from '../domain/Encounter';
import {
  CombatRepo,
  CombatSheet,
  EncounterRecord,
  NewParticipant,
  ParticipantPatch,
} from '../domain/repository/combat.repo';

// The combat functions and triggers raise these messages (see the encounter migrations)
const DATABASE_ERRORS: Record<string, CombatErrorCode> = {
  encounter_not_found: CombatErrorCodes.NOT_FOUND,
  encounter_empty: CombatErrorCodes.EMPTY,
  encounter_not_your_turn: CombatErrorCodes.NOT_YOUR_TURN,
  encounter_full: CombatErrorCodes.FULL,
  encounter_invalid_change: CombatErrorCodes.INVALID_CHANGE,
};

// RLS refusing an insert
const INSERT_REFUSED = '42501';
const DUPLICATE = '23505';
const MISSING_PARENT = '23503';

function fail(action: string, error: PostgrestError): never {
  const code = DATABASE_ERRORS[error.message];
  if (code) throw new CombatError(code);
  throw new Error(`Failed to ${action}: ${error.message}`);
}

// The jsonb column is validated by the database (key and level); default to none
function toConditions(value: unknown): ActiveCondition[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({ key: String(item.key), level: item.level ?? null }));
}

type SheetData = {
  race?: string;
  class?: string;
  ac?: number;
  speed?: number;
  hpTemp?: number;
  skills?: CombatSheet['skills'];
  deathSaves?: CombatSheet['deathSaves'];
};

export class SupabaseCombatRepository implements CombatRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findPartyGm(partyId: string): Promise<{ gmId: string | null } | null> {
    const { data, error } = await this.client
      .from('parties')
      .select('gm_id')
      .eq('id', partyId)
      .maybeSingle();
    if (error) fail('find party', error);
    return data && { gmId: data.gm_id };
  }

  async findEncounter(partyId: string): Promise<EncounterRecord | null> {
    const [encounter, participants] = await Promise.all([
      this.client
        .from('encounters')
        .select('round, current_participant_id')
        .eq('party_id', partyId)
        .maybeSingle(),
      this.client
        .from('encounter_participants')
        .select(
          'id, character_id, side, label, initiative, position, hp_current, hp_temp, conditions, visibility, npc_fate, death_successes, death_failures, death_revealed',
        )
        .eq('party_id', partyId)
        .order('position')
        .order('created_at'),
    ]);
    if (encounter.error) fail('read combat', encounter.error);
    if (participants.error) fail('read combat participants', participants.error);
    if (!encounter.data) return null;

    return {
      round: encounter.data.round,
      currentParticipantId: encounter.data.current_participant_id,
      participants: participants.data.map((row) => ({
        id: row.id,
        characterId: row.character_id,
        side: row.side as Side,
        label: row.label,
        initiative: row.initiative,
        position: row.position,
        hpCurrent: row.hp_current,
        hpTemp: row.hp_temp,
        conditions: toConditions(row.conditions),
        visibility: row.visibility as Visibility,
        fate: row.npc_fate as NpcFate | null,
        deathSaves: { successes: row.death_successes, failures: row.death_failures },
        deathRevealed: row.death_revealed,
      })),
    };
  }

  async sheets(characterIds: string[]): Promise<CombatSheet[]> {
    if (characterIds.length === 0) return [];

    // The GM reads players' sheets through the party read policy, and their own npc sheets as owner
    const { data, error } = await this.client
      .from('characters')
      .select(
        'id, name, hp_current, hp_max, level, attributes, system_data, avatar_url, theme_color',
      )
      .in('id', characterIds)
      .is('deleted_at', null);
    if (error) fail('read combat sheets', error);

    return data.map((row) => {
      const sheet = (row.system_data as SheetData) ?? {};
      return {
        id: row.id,
        name: row.name,
        hpCurrent: row.hp_current,
        hpMax: row.hp_max,
        hpTemp: sheet.hpTemp ?? 0,
        avatarUrl: row.avatar_url,
        accentColor: row.theme_color,
        race: sheet.race ?? '',
        class: sheet.class ?? '',
        ac: sheet.ac ?? 10,
        // The sheet's own default
        speed: sheet.speed || 30,
        level: row.level,
        attributes: (row.attributes as Record<string, number>) ?? {},
        skills: sheet.skills ?? {},
        deathSaves: sheet.deathSaves ?? null,
      };
    });
  }

  async turns(partyId: string) {
    const { data, error } = await this.client.rpc('encounter_turns', { p_party_id: partyId });
    if (error) fail('read turns', error);
    if (data.length === 0) return null;

    // Preparing with nobody yet: one row with only the round
    return {
      round: data[0].round,
      hiddenTurn: data[0].hidden_turn,
      turns: data
        .filter((row) => row.participant_id !== null)
        .map((row) => ({
          participantId: row.participant_id,
          // The generated types say non-null, but anonymous rows carry no name or avatar
          side: row.side as Side,
          name: row.name as string | null,
          avatarUrl: row.avatar_url as string | null,
          life: row.life as Life,
          isCurrent: row.is_current,
          isMine: row.is_mine,
          conditions: toConditions(row.conditions),
        })),
    };
  }

  async partyCharacterIds(partyId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('party_characters')
      .select('character_id')
      .eq('party_id', partyId);
    if (error) fail('read party characters', error);
    return data.map((row) => row.character_id);
  }

  async enemySheet(characterId: string) {
    // An npc sheet is only visible to its owner (the GM read policy covers pc only)
    const { data, error } = await this.client
      .from('characters')
      .select('name')
      .eq('id', characterId)
      .eq('kind', 'npc')
      .is('deleted_at', null)
      .maybeSingle();
    if (error) fail('read enemy sheet', error);
    return data && { name: data.name };
  }

  async create(partyId: string): Promise<void> {
    const { error } = await this.client.from('encounters').insert({ party_id: partyId });
    if (error?.code === DUPLICATE) throw new CombatError(CombatErrorCodes.EXISTS);
    if (error?.code === INSERT_REFUSED || error?.code === MISSING_PARENT) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
    if (error) fail('create combat', error);
  }

  async addParticipants(partyId: string, participants: NewParticipant[]): Promise<void> {
    const { error } = await this.client.from('encounter_participants').insert(
      participants.map((p) => ({
        party_id: partyId,
        character_id: p.characterId,
        side: p.side,
        label: p.label,
      })),
    );
    // Not the GM's npc, not brought to the party, or a player already in the combat
    if (error?.code === INSERT_REFUSED || error?.code === DUPLICATE) {
      throw new CombatError(CombatErrorCodes.CHARACTER_NOT_ALLOWED);
    }
    if (error?.code === MISSING_PARENT) throw new CombatError(CombatErrorCodes.NOT_FOUND);
    if (error) fail('add to combat', error);
  }

  // RLS turns a forbidden update or delete into a no-op rather than an error: count the rows
  async updateParticipant(partyId: string, id: string, patch: ParticipantPatch) {
    const { data, error } = await this.client
      .from('encounter_participants')
      .update({
        label: patch.label,
        initiative: patch.initiative,
        hp_current: patch.hpCurrent,
        hp_temp: patch.hpTemp,
        side: patch.side,
        visibility: patch.visibility,
        npc_fate: patch.fate,
        death_successes: patch.deathSaves?.successes,
        death_failures: patch.deathSaves?.failures,
        death_revealed: patch.deathRevealed,
      })
      .eq('party_id', partyId)
      .eq('id', id)
      .select('id');
    if (error) fail('change participant', error);
    return data.length > 0;
  }

  async removeParticipant(partyId: string, id: string) {
    const { data, error } = await this.client
      .from('encounter_participants')
      .delete()
      .eq('party_id', partyId)
      .eq('id', id)
      .select('id');
    if (error) fail('remove participant', error);
    return data.length > 0;
  }

  async setOrder(partyId: string, participantIds: string[]): Promise<void> {
    const { error } = await this.client.rpc('set_encounter_order', {
      p_party_id: partyId,
      p_participant_ids: participantIds,
    });
    if (error) fail('change order', error);
  }

  async start(partyId: string): Promise<void> {
    const { error } = await this.client.rpc('start_encounter', { p_party_id: partyId });
    if (error) fail('start combat', error);
  }

  async endTurn(partyId: string, participantId: string): Promise<void> {
    const { error } = await this.client.rpc('end_turn', {
      p_party_id: partyId,
      p_participant_id: participantId,
    });
    if (error) fail('end turn', error);
  }

  async setConditions(partyId: string, participantId: string, conditions: ActiveCondition[]) {
    const { data, error } = await this.client.rpc('set_participant_conditions', {
      p_party_id: partyId,
      p_participant_id: participantId,
      p_conditions: conditions as unknown as Json,
    });
    if (error) fail('change conditions', error);
    return data;
  }

  async finish(partyId: string) {
    const { data, error } = await this.client
      .from('encounters')
      .delete()
      .eq('party_id', partyId)
      .select('party_id');
    if (error) fail('end combat', error);
    return data.length > 0;
  }
}
