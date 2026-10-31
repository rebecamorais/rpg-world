import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Database } from '@database-types';

import { InvitePreview, MemberStatus, PartySummary } from '../domain/Party';
import { PartyError, PartyErrorCode, PartyErrorCodes } from '../domain/PartyError';
import { PartyPerson, RosterCharacter } from '../domain/PartyView';
import { PartyRecord, PartyRepo } from '../domain/repository/party.repo';
import { RolePlayLore, RolePlaySheet } from '../domain/role-play-card';

// The party functions and triggers raise these messages (see the party migrations)
const DATABASE_ERRORS: Record<string, PartyErrorCode> = {
  party_gm_limit: PartyErrorCodes.GM_LIMIT,
  party_not_found: PartyErrorCodes.NOT_FOUND,
  party_invite_not_found: PartyErrorCodes.INVITE_NOT_FOUND,
  party_user_not_found: PartyErrorCodes.USER_NOT_FOUND,
  party_gm_cannot_join: PartyErrorCodes.GM_CANNOT_JOIN,
};

// RLS refusing an insert, or a character id that doesn't exist
const INSERT_REFUSED = new Set(['42501', '23503']);

function fail(action: string, error: PostgrestError): never {
  const code = DATABASE_ERRORS[error.message];
  if (code) throw new PartyError(code);
  throw new Error(`Failed to ${action}: ${error.message}`);
}

export class SupabasePartyRepository implements PartyRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listMine(): Promise<PartySummary[]> {
    const { data, error } = await this.client.rpc('my_parties');
    if (error) fail('list parties', error);

    return data.map((row) => ({
      id: row.party_id,
      name: row.name,
      system: row.system,
      role: row.role as PartySummary['role'],
      status: row.status as MemberStatus | 'gm',
      gmUsername: row.gm_username,
      pendingRequests: row.pending_requests,
    }));
  }

  async create(gmId: string, name: string): Promise<string> {
    const { data, error } = await this.client
      .from('parties')
      .insert({ gm_id: gmId, name })
      .select('id')
      .single();
    if (error) fail('create party', error);
    return data.id;
  }

  // RLS turns a forbidden update or delete into a no-op rather than an error: count the rows
  async rename(id: string, name: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('parties')
      .update({ name })
      .eq('id', id)
      .select('id');
    if (error) fail('rename party', error);
    return data.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await this.client.from('parties').delete().eq('id', id).select('id');
    if (error) fail('delete party', error);
    return data.length > 0;
  }

  async setInviteCode(id: string, code: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('party_invites')
      .update({ code })
      .eq('party_id', id)
      .select('party_id');
    if (error) fail('change invite code', error);
    return data.length > 0;
  }

  async getInvite(code: string): Promise<InvitePreview | null> {
    const { data, error } = await this.client.rpc('get_party_invite', { p_code: code });
    if (error) fail('read invite', error);

    const row = data[0];
    if (!row) return null;
    return {
      partyId: row.party_id,
      name: row.name,
      gmUsername: row.gm_username,
      myStatus: row.my_status as InvitePreview['myStatus'],
    };
  }

  async requestJoin(code: string): Promise<MemberStatus> {
    const { data, error } = await this.client.rpc('request_party_join', { p_code: code });
    if (error) fail('request to join', error);
    return data as MemberStatus;
  }

  async invite(partyId: string, username: string): Promise<MemberStatus> {
    const { data, error } = await this.client.rpc('invite_to_party', {
      p_party_id: partyId,
      p_username: username,
    });
    if (error) fail('invite to party', error);
    return data as MemberStatus;
  }

  async activateMember(partyId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('party_members')
      .update({ status: 'active' })
      .eq('party_id', partyId)
      .eq('user_id', userId)
      .neq('status', 'active')
      .select('user_id');
    if (error) fail('accept member', error);
    return data.length > 0;
  }

  async deleteMember(partyId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', userId)
      .select('user_id');
    if (error) fail('remove member', error);
    return data.length > 0;
  }

  async findParty(id: string): Promise<PartyRecord | null> {
    const { data, error } = await this.client
      .from('parties')
      .select('id, name, system, gm_id')
      .eq('id', id)
      .maybeSingle();
    if (error) fail('find party', error);
    return data && { id: data.id, name: data.name, system: data.system, gmId: data.gm_id };
  }

  async people(partyId: string): Promise<PartyPerson[]> {
    const { data, error } = await this.client.rpc('party_people', { p_party_id: partyId });
    if (error) fail('list party people', error);
    return data.map((row) => ({
      userId: row.user_id,
      username: row.username,
      avatarUrl: row.avatar_url,
      status: row.status as PartyPerson['status'],
    }));
  }

  async roster(partyId: string): Promise<RosterCharacter[]> {
    const { data, error } = await this.client.rpc('party_roster', { p_party_id: partyId });
    if (error) fail('list party characters', error);
    return data.map((row) => ({
      characterId: row.character_id,
      ownerId: row.owner_id,
      name: row.name,
      avatarUrl: row.avatar_url,
      race: row.race ?? '',
      class: row.class ?? '',
      level: row.level,
      accentColor: row.theme_color,
    }));
  }

  async inviteCode(partyId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('party_invites')
      .select('code')
      .eq('party_id', partyId)
      .maybeSingle();
    if (error) fail('read invite code', error);
    return data?.code ?? null;
  }

  async rolePlaySheets(characterIds: string[]) {
    if (characterIds.length === 0) return [];

    const [characters, lore] = await Promise.all([
      this.client
        .from('characters')
        .select('id, attributes, level, system_data')
        .in('id', characterIds)
        .is('deleted_at', null),
      this.client
        .from('character_lore')
        .select('character_id, personality_traits, ideals, bonds, flaws')
        .in('character_id', characterIds),
    ]);
    if (characters.error) fail('read party sheets', characters.error);
    if (lore.error) fail('read party lore', lore.error);

    const loreById = new Map(lore.data.map((row) => [row.character_id, row]));
    return characters.data.map((row) => {
      const data = (row.system_data as Record<string, unknown>) ?? {};
      const rowLore = loreById.get(row.id);
      const sheet: RolePlaySheet = {
        attributes: (row.attributes as Record<string, number>) ?? {},
        level: row.level,
        skills: (data.skills as RolePlaySheet['skills']) ?? {},
      };
      const characterLore: RolePlayLore | null = rowLore
        ? {
            personalityTraits: rowLore.personality_traits,
            ideals: rowLore.ideals,
            bonds: rowLore.bonds,
            flaws: rowLore.flaws,
          }
        : null;
      return { id: row.id, sheet, lore: characterLore };
    });
  }

  async addCharacters(partyId: string, characterIds: string[]): Promise<void> {
    const { error } = await this.client
      .from('party_characters')
      .insert(
        characterIds.map((characterId) => ({ party_id: partyId, character_id: characterId })),
      );
    if (error && INSERT_REFUSED.has(error.code)) {
      throw new PartyError(PartyErrorCodes.CHARACTER_NOT_ALLOWED);
    }
    if (error) fail('bring characters', error);
  }

  async removeCharacters(partyId: string, characterIds: string[]): Promise<void> {
    const { error } = await this.client
      .from('party_characters')
      .delete()
      .eq('party_id', partyId)
      .in('character_id', characterIds);
    if (error) fail('remove characters', error);
  }
}
