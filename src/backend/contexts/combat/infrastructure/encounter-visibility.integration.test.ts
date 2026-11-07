import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';
import type { Database } from '@lib/types/database';

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
type ParticipantUpdate = Database['public']['Tables']['encounter_participants']['Update'];

const admin = () => SupabaseFactory.createAdmin();

describe('Visibilidade, lado neutro e destino do NPC (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
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

  const participant = async (id: string) => {
    const { data } = await admin()
      .from('encounter_participants')
      .select('side, visibility, npc_fate, death_successes, death_failures, death_revealed')
      .eq('id', id)
      .single();
    return data;
  };

  const update = (session: Session, id: string, values: ParticipantUpdate) =>
    session.client.from('encounter_participants').update(values).eq('id', id).select('id');

  const endTurn = (session: Session, participantId: string) =>
    session.client.rpc('end_turn', { p_party_id: partyId, p_participant_id: participantId });

  const start = async () => {
    const { error } = await gm.client.rpc('start_encounter', { p_party_id: partyId });
    if (error) throw error;
  };

  const setOrder = async (ids: string[]) => {
    const { error } = await gm.client.rpc('set_encounter_order', {
      p_party_id: partyId,
      p_participant_ids: ids,
    });
    if (error) throw error;
  };

  const killAndReveal = async (id: string) => {
    const { error } = await update(gm, id, { hp_current: 0, npc_fate: 'dead' });
    if (error) throw error;
    const revealed = await update(gm, id, { death_revealed: true });
    if (revealed.error) throw revealed.error;
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
    hero = await addParticipant(gm, partyId, heroId, 'player');
    friend = await addParticipant(gm, partyId, friendId, 'player');
    goblin = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
  });

  it('NPC novo entra oculto; jogador entra visível', async () => {
    expect((await participant(goblin))?.visibility).toBe('hidden');
    expect((await participant(hero))?.visibility).toBe('visible');

    // Mesmo pedindo outra coisa, o jogador entra visível
    const otherId = await createCharacter(player.userId, { name: 'Ceres' });
    await bring(player, partyId, otherId);
    const { data, error } = await gm.client
      .from('encounter_participants')
      .insert({ party_id: partyId, character_id: otherId, side: 'player', visibility: 'hidden' })
      .select('visibility')
      .single();
    expect(error).toBeNull();
    expect(data?.visibility).toBe('visible');
  });

  it('aceita aliado, neutro e inimigo; recusa jogador ↔ NPC', async () => {
    const neutralId = await createNpc(gm.userId, 'Mercador', 4);
    const neutral = await addParticipant(gm, partyId, neutralId, 'neutral', 'Mercador');
    expect((await participant(neutral))?.side).toBe('neutral');

    for (const side of ['ally', 'neutral', 'enemy']) {
      const { error } = await update(gm, goblin, { side });
      expect(error).toBeNull();
      expect((await participant(goblin))?.side).toBe(side);
    }

    const toPlayer = await update(gm, goblin, { side: 'player', label: null });
    expect(toPlayer.error?.message).toBe('encounter_invalid_change');
    expect(toPlayer.error?.code).toBe('P0001');

    const toNpc = await update(gm, hero, { side: 'enemy', label: 'Arani' });
    expect(toNpc.error?.message).toBe('encounter_invalid_change');
  });

  it('jogador não pode ter visibilidade, destino nem testes', async () => {
    const hidden = await update(gm, hero, { visibility: 'hidden' });
    expect(hidden.error?.code).toBe('23514');

    const successes = await update(gm, hero, { death_successes: 1 });
    expect(successes.error?.code).toBe('23514');

    const failures = await update(gm, hero, { death_failures: 1 });
    expect(failures.error?.code).toBe('23514');

    const fate = await update(gm, hero, { npc_fate: 'dead' });
    expect(fate.error?.code).toBe('23514');
  });

  it('só o mestre muda visibilidade e destino', async () => {
    const asPlayer = await update(player, goblin, { visibility: 'visible' });
    expect(asPlayer.error).toBeNull();
    expect(asPlayer.data).toEqual([]);

    const fateAsPlayer = await update(player, goblin, { hp_current: 0, npc_fate: 'dead' });
    expect(fateAsPlayer.error).toBeNull();
    expect(fateAsPlayer.data).toEqual([]);
    expect(await participant(goblin)).toMatchObject({ visibility: 'hidden', npc_fate: null });

    const asGm = await update(gm, goblin, { visibility: 'anonymous' });
    expect(asGm.error).toBeNull();
    expect(asGm.data).toHaveLength(1);
    expect((await participant(goblin))?.visibility).toBe('anonymous');
  });

  it('destino só com 0 PV; 3 falhas viram morto', async () => {
    // Ao mudar, NPC com PV não fica com destino (o gatilho limpa); ao entrar, a CHECK recusa
    const alive = await update(gm, goblin, { npc_fate: 'death_saves' });
    expect(alive.error).toBeNull();
    expect((await participant(goblin))?.npc_fate).toBeNull();

    const orcId = await createNpc(gm.userId, 'Orc', 15);
    const born = await gm.client.from('encounter_participants').insert({
      party_id: partyId,
      character_id: orcId,
      side: 'enemy',
      label: 'Orc 1',
      npc_fate: 'dead',
    });
    expect(born.error?.code).toBe('23514');

    const down = await update(gm, goblin, { hp_current: 0, npc_fate: 'death_saves' });
    expect(down.error).toBeNull();

    const tooMany = await update(gm, goblin, { death_successes: 4 });
    expect(tooMany.error?.code).toBe('23514');

    const two = await update(gm, goblin, { death_failures: 2, death_successes: 1 });
    expect(two.error).toBeNull();
    expect((await participant(goblin))?.npc_fate).toBe('death_saves');

    const three = await update(gm, goblin, { death_failures: 3 });
    expect(three.error).toBeNull();
    expect(await participant(goblin)).toMatchObject({
      npc_fate: 'dead',
      death_failures: 3,
      death_successes: 1,
    });
  });

  it('desmarcar morto tira a revelação; curar zera tudo', async () => {
    const notDead = await update(gm, goblin, {
      hp_current: 0,
      npc_fate: 'death_saves',
      death_revealed: true,
    });
    expect(notDead.error).toBeNull();
    expect((await participant(goblin))?.death_revealed).toBe(false);

    await killAndReveal(goblin);
    expect(await participant(goblin)).toMatchObject({ npc_fate: 'dead', death_revealed: true });

    const unmark = await update(gm, goblin, { npc_fate: 'death_saves', death_failures: 2 });
    expect(unmark.error).toBeNull();
    expect(await participant(goblin)).toMatchObject({
      npc_fate: 'death_saves',
      death_revealed: false,
    });

    await killAndReveal(goblin);
    const heal = await update(gm, goblin, { hp_current: 5 });
    expect(heal.error).toBeNull();
    expect(await participant(goblin)).toMatchObject({
      npc_fate: null,
      death_successes: 0,
      death_failures: 0,
      death_revealed: false,
    });
  });

  it('pula o morto revelado no turno; não pula o não revelado', async () => {
    await setOrder([hero, goblin, friend]);
    await start();

    // Morto, mas o mestre ainda não contou: a vez passa por ele
    const { error } = await update(gm, goblin, { hp_current: 0, npc_fate: 'dead' });
    expect(error).toBeNull();
    expect((await endTurn(player, hero)).error).toBeNull();
    expect((await encounter())?.current_participant_id).toBe(goblin);
    expect((await endTurn(gm, goblin)).error).toBeNull();
    expect((await endTurn(colleague, friend)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 2, current_participant_id: hero });

    // Revelado: pula
    const revealed = await update(gm, goblin, { death_revealed: true });
    expect(revealed.error).toBeNull();
    expect((await endTurn(player, hero)).error).toBeNull();
    expect((await encounter())?.current_participant_id).toBe(friend);

    // Também na virada da rodada, quando o revelado é o primeiro
    await setOrder([goblin, hero, friend]);
    expect((await endTurn(colleague, friend)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 3, current_participant_id: hero });
  });

  it('com todos mortos e revelados, o turno ainda anda', async () => {
    // Só NPCs: jogador nunca fica "morto revelado"
    await gm.client.from('encounter_participants').delete().in('id', [hero, friend]);
    const otherId = await createNpc(gm.userId, 'Orc', 15);
    const orc = await addParticipant(gm, partyId, otherId, 'enemy', 'Orc 1');
    await killAndReveal(goblin);
    await killAndReveal(orc);

    await start();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: goblin });

    expect((await endTurn(gm, goblin)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 1, current_participant_id: orc });

    expect((await endTurn(gm, orc)).error).toBeNull();
    expect(await encounter()).toEqual({ round: 2, current_participant_id: goblin });

    // Quem sai na própria vez também passa a vez
    await gm.client.from('encounter_participants').delete().eq('id', goblin);
    expect(await encounter()).toEqual({ round: 2, current_participant_id: orc });
  });
});
