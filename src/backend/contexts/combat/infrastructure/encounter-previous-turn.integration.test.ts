import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  addParticipant,
  bring,
  createCharacter,
  createEncounter,
  createNpc,
  createParty,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

describe('previous_turn (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let partyId: string;
  let hero: string;
  let goblin: string;
  let friend: string;

  const encounter = async () => {
    const { data } = await admin()
      .from('encounters')
      .select('round, current_participant_id')
      .eq('party_id', partyId)
      .single();
    return data;
  };

  const previousTurn = (session: Session) =>
    session.client.rpc('previous_turn', { p_party_id: partyId });

  const endTurn = async (participantId: string) => {
    const { error } = await gm.client.rpc('end_turn', {
      p_party_id: partyId,
      p_participant_id: participantId,
    });
    if (error) throw error;
  };

  const start = async () => {
    const { error } = await gm.client.rpc('start_encounter', { p_party_id: partyId });
    if (error) throw error;
  };

  const killAndReveal = async (id: string) => {
    const { error } = await gm.client
      .from('encounter_participants')
      .update({ hp_current: 0, npc_fate: 'dead', death_revealed: true })
      .eq('id', id);
    if (error) throw error;
  };

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    colleague = await createSignedInClient('colleague');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    await addMember(partyId, colleague.userId, 'active');
    const heroId = await createCharacter(player.userId, { name: 'Arani' });
    const friendId = await createCharacter(colleague.userId, { name: 'Brom' });
    await bring(player, partyId, heroId);
    await bring(colleague, partyId, friendId);
    const goblinId = await createNpc(gm.userId, 'Goblin', 7);
    await createEncounter(gm, partyId);
    // Ordem: herói, goblin, amigo
    hero = await addParticipant(gm, partyId, heroId, 'player');
    goblin = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
    friend = await addParticipant(gm, partyId, friendId, 'player');
  });

  it('só o mestre volta o turno', async () => {
    await start();
    await endTurn(hero);

    expect((await previousTurn(player)).error?.message).toBe('encounter_not_your_turn');
    expect(await encounter()).toEqual({ round: 1, current_participant_id: goblin });
  });

  it('volta para o anterior na mesma rodada', async () => {
    await start();
    await endTurn(hero);
    await endTurn(goblin);

    expect((await previousTurn(gm)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: goblin });
  });

  it('antes do primeiro vai para o último e a rodada diminui', async () => {
    await start();
    for (const id of [hero, goblin, friend]) await endTurn(id);
    expect(await encounter()).toEqual({ round: 2, current_participant_id: hero });

    expect((await previousTurn(gm)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: friend });
  });

  it('na rodada 1 com a vez no primeiro, recusa com encounter_at_start', async () => {
    await start();

    expect((await previousTurn(gm)).error?.message).toBe('encounter_at_start');
    expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });
  });

  it('primeiro é morto revelado: na rodada 1 a vez no segundo também recusa', async () => {
    const { error } = await gm.client.rpc('set_encounter_order', {
      p_party_id: partyId,
      p_participant_ids: [goblin, hero, friend],
    });
    if (error) throw error;
    await killAndReveal(goblin);
    await start();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });

    expect((await previousTurn(gm)).error?.message).toBe('encounter_at_start');
    expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });
  });

  it('pula o morto revelado ao voltar', async () => {
    await start();
    await endTurn(hero);
    await endTurn(goblin);
    await killAndReveal(goblin);

    expect((await previousTurn(gm)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });
  });

  it('sem combate começado, recusa com encounter_not_found', async () => {
    expect((await previousTurn(gm)).error?.message).toBe('encounter_not_found');
    expect(await encounter()).toEqual({ round: 0, current_participant_id: null });
  });
});
