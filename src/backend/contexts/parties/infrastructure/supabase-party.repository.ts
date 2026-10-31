import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Database } from '@database-types';

import { MemberStatus, PartySummary } from '../domain/Party';
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
}
