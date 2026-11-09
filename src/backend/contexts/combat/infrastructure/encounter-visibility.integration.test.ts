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

  it('desfazer morto depois de 3 falhas volta aos testes com contadores zerados', async () => {
    await update(gm, goblin, { hp_current: 0, npc_fate: 'death_saves', death_failures: 3 });
    expect((await participant(goblin))?.npc_fate).toBe('dead');

    const undo = await update(gm, goblin, { npc_fate: 'death_saves' });
    expect(undo.error).toBeNull();
    expect(await participant(goblin)).toMatchObject({
      npc_fate: 'death_saves',
      death_successes: 0,
      death_failures: 0,
      death_revealed: false,
    });
  });

  it('limpar o destino zera os contadores', async () => {
    await update(gm, goblin, {
      hp_current: 0,
      npc_fate: 'death_saves',
      death_failures: 2,
      death_successes: 1,
    });

    const clear = await update(gm, goblin, { npc_fate: null });
    expect(clear.error).toBeNull();
    expect(await participant(goblin)).toMatchObject({
      npc_fate: null,
      death_successes: 0,
      death_failures: 0,
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
  describe('encounter_turns para o jogador', () => {
    const GOBLIN_AVATAR = 'https://example.com/goblin.png';

    const turns = async () => {
      const { data, error } = await player.client.rpc('encounter_turns', { p_party_id: partyId });
      if (error) throw error;
      return data;
    };

    const rowOf = async (id: string) => (await turns()).find((row) => row.participant_id === id);

    const goblinCharacter = async () => {
      const { data } = await admin()
        .from('encounter_participants')
        .select('character_id')
        .eq('id', goblin)
        .single();
      return data!.character_id;
    };

    beforeEach(async () => {
      const { error } = await admin()
        .from('characters')
        .update({ avatar_url: GOBLIN_AVATAR })
        .eq('id', await goblinCharacter());
      if (error) throw error;
    });

    it('oculto não aparece para o jogador', async () => {
      const rows = await turns();
      expect(rows.map((row) => row.participant_id)).toEqual([hero, friend]);
    });

    it('anônimo vem sem nome e sem imagem, com o lado', async () => {
      await update(gm, goblin, { visibility: 'anonymous' });
      expect(await rowOf(goblin)).toMatchObject({
        name: null,
        avatar_url: null,
        side: 'enemy',
        life: 'normal',
      });
    });

    it('visível vem com nome, imagem e lado', async () => {
      await update(gm, goblin, { visibility: 'visible' });
      expect(await rowOf(goblin)).toMatchObject({
        name: 'Goblin 1',
        avatar_url: GOBLIN_AVATAR,
        side: 'enemy',
        life: 'normal',
        is_current: false,
        is_mine: false,
        hidden_turn: false,
      });
      expect(await rowOf(hero)).toMatchObject({ name: 'Arani', side: 'player', is_mine: true });
    });

    it('turno de oculto: ninguém atual e hidden_turn', async () => {
      await setOrder([goblin, hero, friend]);
      await start();
      expect((await encounter())?.current_participant_id).toBe(goblin);

      const rows = await turns();
      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.is_current === false)).toBe(true);
      expect(rows.every((row) => row.hidden_turn === true)).toBe(true);
    });

    it('ocultar no meio do turno do NPC esconde o turno', async () => {
      await update(gm, goblin, { visibility: 'visible' });
      await setOrder([goblin, hero, friend]);
      await start();

      let rows = await turns();
      expect(rows.find((row) => row.participant_id === goblin)?.is_current).toBe(true);
      expect(rows.every((row) => row.hidden_turn === false)).toBe(true);

      await update(gm, goblin, { visibility: 'hidden' });
      rows = await turns();
      expect(rows.map((row) => row.participant_id)).toEqual([hero, friend]);
      expect(rows.every((row) => row.is_current === false)).toBe(true);
      expect(rows.every((row) => row.hidden_turn === true)).toBe(true);
    });

    it('morto não revelado vem como down; revelado como dead', async () => {
      await update(gm, goblin, { visibility: 'visible' });

      await update(gm, goblin, { hp_current: 0, npc_fate: 'death_saves' });
      expect((await rowOf(goblin))?.life).toBe('down');

      await update(gm, goblin, { npc_fate: 'dead' });
      expect((await rowOf(goblin))?.life).toBe('down');

      await update(gm, goblin, { death_revealed: true });
      expect((await rowOf(goblin))?.life).toBe('dead');

      // Anônimo também mostra a vida
      await update(gm, goblin, { visibility: 'anonymous' });
      expect((await rowOf(goblin))?.life).toBe('dead');
    });

    it('jogador com 0 PV na ficha continua normal', async () => {
      const { data } = await admin()
        .from('encounter_participants')
        .select('character_id')
        .eq('id', hero)
        .single();
      const { error } = await admin()
        .from('characters')
        .update({ hp_current: 0 })
        .eq('id', data!.character_id);
      if (error) throw error;

      expect((await rowOf(hero))?.life).toBe('normal');
    });

    it('a resposta nunca traz PV, testes nem destino', async () => {
      await update(gm, goblin, { visibility: 'visible', hp_current: 0, npc_fate: 'dead' });
      await start();

      const rows = await turns();
      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(Object.keys(row).sort()).toEqual(
          [
            'round',
            'participant_id',
            'side',
            'name',
            'avatar_url',
            'life',
            'is_current',
            'is_mine',
            'conditions',
            'hidden_turn',
            'initiative',
            'character_id',
            'owner_username',
          ].sort(),
        );
      }
    });

    it('sem ninguém visível: uma linha só com a rodada e hidden_turn', async () => {
      await gm.client.from('encounter_participants').delete().in('id', [hero, friend]);
      await start();

      expect(await turns()).toEqual([
        {
          round: 1,
          participant_id: null,
          side: null,
          name: null,
          avatar_url: null,
          life: null,
          is_current: null,
          is_mine: null,
          conditions: null,
          hidden_turn: true,
          initiative: null,
          character_id: null,
          owner_username: null,
        },
      ]);
    });
  });
});
