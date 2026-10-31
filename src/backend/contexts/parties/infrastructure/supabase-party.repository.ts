import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Database } from '@database-types';

import { InvitePreview, MemberStatus, PartySummary } from '../domain/Party';
import { PartyError, PartyErrorCode, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

// The party functions and triggers raise these messages (see the party migrations)
const DATABASE_ERRORS: Record<string, PartyErrorCode> = {
  party_gm_limit: PartyErrorCodes.GM_LIMIT,
  party_not_found: PartyErrorCodes.NOT_FOUND,
  party_invite_not_found: PartyErrorCodes.INVITE_NOT_FOUND,
  party_user_not_found: PartyErrorCodes.USER_NOT_FOUND,
  party_gm_cannot_join: PartyErrorCodes.GM_CANNOT_JOIN,
};

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
}
