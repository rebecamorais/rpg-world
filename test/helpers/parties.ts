import { SupabaseFactory } from '@lib/supabase';

import type { Database } from '@database-types';

import type { createSignedInClient } from './signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

/** A party created by `gm` through their own client (RLS applies). */
export async function createParty(gm: Session, name = 'Mesa de Quinta') {
  const { data, error } = await gm.client
    .from('parties')
    .insert({ name, gm_id: gm.userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Membership rows straight through the service role: setup for states under test. */
export async function addMember(
  partyId: string,
  userId: string,
  status: 'requested' | 'invited' | 'active',
) {
  const { error } = await admin()
    .from('party_members')
    .insert({ party_id: partyId, user_id: userId, status });
  if (error) throw error;
}

export async function createCharacter(
  ownerId: string,
  fields: Partial<Database['public']['Tables']['characters']['Insert']> = {},
) {
  const id = crypto.randomUUID();
  const { error } = await admin()
    .from('characters')
    .insert({ id, owner_id: ownerId, name: 'Arani', ...fields });
  if (error) throw error;
  return id;
}

export async function memberStatus(partyId: string, userId: string) {
  const { data } = await admin()
    .from('party_members')
    .select('status')
    .eq('party_id', partyId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.status ?? null;
}

export async function inviteCode(partyId: string) {
  const { data, error } = await admin()
    .from('party_invites')
    .select('code')
    .eq('party_id', partyId)
    .single();
  if (error) throw error;
  return data.code;
}

/** Marks the username as picked by the person (only those are shown and searchable). */
export async function chooseUsername(userId: string, username: string) {
  const { error } = await admin()
    .from('profile')
    .update({ username, username_chosen: true })
    .eq('id', userId);
  if (error) throw error;
}
