import { SupabaseFactory } from '@lib/supabase';

import type { Database } from '@database-types';

import type { createSignedInClient } from './signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

type AdminWithHold = {
  schema(name: 'test_helpers'): {
    rpc(
      fn: 'run_and_hold',
      args: { p_sql: string; p_seconds: number },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
};

/**
 * Runs `sql` in a transaction that stays open while `during` runs, then commits, the way a slower
 * request would overlap with `during`. Reports whether the transaction was still open when `during`
 * finished, which is how a test sees that something waited (or did not wait) for its locks.
 */
export async function whileTransactionOpen<T>(sql: string, during: () => PromiseLike<T>) {
  const holder = (admin() as unknown as AdminWithHold)
    .schema('test_helpers')
    .rpc('run_and_hold', { p_sql: sql, p_seconds: 2 });
  let committed = false;
  const held = Promise.resolve(holder).then(({ error }) => {
    if (error) throw new Error(error.message);
    committed = true;
  });

  // Time for the request to reach the database and take its locks
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = await during();
  const finishedBeforeCommit = !committed;
  await held;
  return { result, finishedBeforeCommit };
}

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

/** The GM's enemy sheet: a character with kind npc. */
export function createNpc(ownerId: string, name = 'Goblin', hpMax = 7) {
  return createCharacter(ownerId, { name, kind: 'npc', hp_max: hpMax, hp_current: hpMax });
}

/** The party's combat, prepared by the GM through their own client (RLS applies). */
export async function createEncounter(gm: Session, partyId: string) {
  const { error } = await gm.client.from('encounters').insert({ party_id: partyId });
  if (error) throw error;
}

/** A participant added by the GM through their own client; returns its id. */
export async function addParticipant(
  gm: Session,
  partyId: string,
  characterId: string,
  side: 'player' | 'ally' | 'neutral' | 'enemy',
  label: string | null = side === 'player' ? null : 'Goblin',
) {
  const { data, error } = await gm.client
    .from('encounter_participants')
    .insert({ party_id: partyId, character_id: characterId, side, label })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** A player's character brought to the party (the member must be active). */
export async function bring(player: Session, partyId: string, characterId: string) {
  const { error } = await player.client
    .from('party_characters')
    .insert({ party_id: partyId, character_id: characterId });
  if (error) throw error;
}
