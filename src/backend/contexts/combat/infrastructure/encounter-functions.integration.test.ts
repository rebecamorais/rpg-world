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

describe('Funções do combate (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let stranger: Session;
  let partyId: string;
  let hero: string;
  let friend: string;
  let goblin: string;

  const encounter = async () => {
    const { data } = await admin()
      .from('encounters')
      .select('round, current_participant_id')
      .eq('party_id', partyId)
      .single();
    return data;
  };

  const endTurn = (session: Session, participantId: string) =>
    session.client.rpc('end_turn', { p_party_id: partyId, p_participant_id: participantId });

  const start = async () => {
    const { error } = await gm.client.rpc('start_encounter', { p_party_id: partyId });
    if (error) throw error;
  };

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    colleague = await createSignedInClient('colleague');
    stranger = await createSignedInClient('stranger');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    await addMember(partyId, colleague.userId, 'active');
    const heroId = await createCharacter(player.userId, { name: 'Arani' });
    const friendId = await createCharacter(colleague.userId, { name: 'Brom' });
    await bring(player, partyId, heroId);
    await bring(colleague, partyId, friendId);
    const goblinId = await createNpc(gm.userId, 'Goblin', 7);
    await createEncounter(gm, partyId);
    hero = await addParticipant(gm, partyId, heroId, 'player');
    friend = await addParticipant(gm, partyId, friendId, 'player');
    goblin = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
  });

  describe('start_encounter', () => {
    it('só o mestre; vazio falha com encounter_empty; abre a rodada 1 no primeiro', async () => {
      const asPlayer = await player.client.rpc('start_encounter', { p_party_id: partyId });
      expect(asPlayer.error?.message).toBe('encounter_not_found');

      await start();
      expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });

      const again = await gm.client.rpc('start_encounter', { p_party_id: partyId });
      expect(again.error?.message).toBe('encounter_not_found');

      await gm.client.from('encounters').delete().eq('party_id', partyId);
      await createEncounter(gm, partyId);
      const empty = await gm.client.rpc('start_encounter', { p_party_id: partyId });
      expect(empty.error?.message).toBe('encounter_empty');
    });
  });

  describe('end_turn', () => {
    beforeEach(start);

    it('o jogador encerra o próprio turno; não encerra o de um colega nem o de um inimigo', async () => {
      expect((await endTurn(colleague, hero)).error?.message).toBe('encounter_not_your_turn');
      expect((await endTurn(stranger, hero)).error?.message).toBe('encounter_not_your_turn');

      expect((await endTurn(player, hero)).error).toBeNull();
      expect(await encounter()).toEqual({ round: 1, current_participant_id: friend });

      expect((await endTurn(player, friend)).error?.message).toBe('encounter_not_your_turn');
      expect((await endTurn(colleague, friend)).error).toBeNull();

      expect((await endTurn(player, goblin)).error?.message).toBe('encounter_not_your_turn');
      expect(await encounter()).toEqual({ round: 1, current_participant_id: goblin });
    });

    it('o mestre encerra o turno de qualquer um; do último volta ao primeiro e a rodada sobe', async () => {
      for (const id of [hero, friend]) expect((await endTurn(gm, id)).error).toBeNull();
      expect(await encounter()).toEqual({ round: 1, current_participant_id: goblin });

      expect((await endTurn(gm, goblin)).error).toBeNull();
      expect(await encounter()).toEqual({ round: 2, current_participant_id: hero });
    });

    it('end_turn com um participante que já não é o atual falha e não anda de novo', async () => {
      expect((await endTurn(player, hero)).error).toBeNull();
      expect((await endTurn(gm, hero)).error?.message).toBe('encounter_not_your_turn');

      expect(await encounter()).toEqual({ round: 1, current_participant_id: friend });
    });

    it('dois end_turn em paralelo andam uma vez só', async () => {
      const results = await Promise.all([endTurn(gm, hero), endTurn(player, hero)]);

      expect(results.filter((r) => r.error === null)).toHaveLength(1);
      expect(await encounter()).toEqual({ round: 1, current_participant_id: friend });
    });

    it('a lista esvazia no meio do combate: quem entra depois fica com a vez e o turno volta a andar', async () => {
      for (const id of [hero, friend, goblin]) {
        await gm.client.from('encounter_participants').delete().eq('id', id);
      }
      expect(await encounter()).toEqual({ round: 1, current_participant_id: null });

      const goblinId = await createNpc(gm.userId, 'Orc');
      const orc = await addParticipant(gm, partyId, goblinId, 'enemy', 'Orc 1');
      const orc2 = await addParticipant(gm, partyId, goblinId, 'enemy', 'Orc 2');
      expect(await encounter()).toEqual({ round: 1, current_participant_id: orc });

      expect((await endTurn(gm, orc)).error).toBeNull();
      expect(await encounter()).toEqual({ round: 1, current_participant_id: orc2 });
    });

    it('antes de começar ninguém encerra turno', async () => {
      await gm.client.from('encounters').delete().eq('party_id', partyId);
      await createEncounter(gm, partyId);
      const goblinId = await createNpc(gm.userId);
      const id = await addParticipant(gm, partyId, goblinId, 'enemy');

      expect((await endTurn(gm, id)).error?.message).toBe('encounter_not_your_turn');
    });
  });

  describe('set_encounter_order', () => {
    it('só o mestre; lista incompleta ou com id de fora é recusada', async () => {
      const order = (session: Session, ids: string[]) =>
        session.client.rpc('set_encounter_order', {
          p_party_id: partyId,
          p_participant_ids: ids,
        });

      expect((await order(player, [goblin, friend, hero])).error?.message).toBe(
        'encounter_not_found',
      );
      expect((await order(gm, [goblin, hero])).error?.message).toBe('encounter_not_found');
      expect((await order(gm, [goblin, hero, crypto.randomUUID()])).error?.message).toBe(
        'encounter_not_found',
      );
      expect((await order(gm, [goblin, hero, hero])).error?.message).toBe('encounter_not_found');

      expect((await order(gm, [goblin, friend, hero])).error).toBeNull();
      const { data } = await admin()
        .from('encounter_participants')
        .select('id')
        .eq('party_id', partyId)
        .order('position');
      expect(data?.map((p) => p.id)).toEqual([goblin, friend, hero]);
    });
  });

  describe('encounter_turns', () => {
    it('devolve exatamente as colunas round, participant_id, name, is_current, is_mine', async () => {
      await start();

      const { data, error } = await player.client.rpc('encounter_turns', { p_party_id: partyId });
      if (error) throw error;

      expect(data.map((row) => Object.keys(row).sort())).toEqual(
        Array(3).fill(['is_current', 'is_mine', 'name', 'participant_id', 'round']),
      );
      expect(data).toEqual([
        { round: 1, participant_id: hero, name: 'Arani', is_current: true, is_mine: true },
        { round: 1, participant_id: friend, name: 'Brom', is_current: false, is_mine: false },
        { round: 1, participant_id: goblin, name: 'Goblin 1', is_current: false, is_mine: false },
      ]);
    });

    it('preparando sem participantes: uma linha só com a rodada; sem combate: vazio', async () => {
      await gm.client.from('encounters').delete().eq('party_id', partyId);
      expect((await player.client.rpc('encounter_turns', { p_party_id: partyId })).data).toEqual(
        [],
      );

      await createEncounter(gm, partyId);
      expect((await player.client.rpc('encounter_turns', { p_party_id: partyId })).data).toEqual([
        { round: 0, participant_id: null, name: null, is_current: null, is_mine: null },
      ]);
    });

    it('para o estranho, o ex-membro e o anon: vazio ou sem acesso', async () => {
      await colleague.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', colleague.userId);

      for (const session of [stranger, colleague]) {
        const { data } = await session.client.rpc('encounter_turns', { p_party_id: partyId });
        expect(data).toEqual([]);
      }

      const anon = SupabaseFactory.createAnon();
      const { error } = await anon.rpc('encounter_turns', { p_party_id: partyId });
      expect(error).not.toBeNull();
    });
  });

  it('anon não executa as funções do combate', async () => {
    const anon = SupabaseFactory.createAnon();
    const calls = [
      anon.rpc('start_encounter', { p_party_id: partyId }),
      anon.rpc('end_turn', { p_party_id: partyId, p_participant_id: hero }),
      anon.rpc('set_encounter_order', { p_party_id: partyId, p_participant_ids: [hero] }),
    ];
    for (const { error } of await Promise.all(calls)) expect(error).not.toBeNull();
  });
});
