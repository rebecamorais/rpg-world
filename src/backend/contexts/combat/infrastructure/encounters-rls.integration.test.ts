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

// Only the GM reads and writes the combat tables; players see it through encounter_turns.
describe('RLS do combate (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let stranger: Session;
  let partyId: string;
  let heroId: string;
  let goblinId: string;

  const participants = async () => {
    const { data, error } = await admin()
      .from('encounter_participants')
      .select('id, character_id, side, label, position, hp_current, hp_temp')
      .eq('party_id', partyId)
      .order('position');
    if (error) throw error;
    return data;
  };

  const encounter = async () => {
    const { data } = await admin()
      .from('encounters')
      .select('round, current_participant_id')
      .eq('party_id', partyId)
      .maybeSingle();
    return data;
  };

  const setTurn = async (round: number, current: string) => {
    const { error } = await admin()
      .from('encounters')
      .update({ round, current_participant_id: current })
      .eq('party_id', partyId);
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
    heroId = await createCharacter(player.userId, { name: 'Arani' });
    await bring(player, partyId, heroId);
    goblinId = await createNpc(gm.userId, 'Goblin', 7);
    await createEncounter(gm, partyId);
  });

  it('o mestre prepara o combate; um segundo na mesma mesa é recusado (23505)', async () => {
    expect(await encounter()).toEqual({ round: 0, current_participant_id: null });

    const { error } = await gm.client.from('encounters').insert({ party_id: partyId });
    expect(error?.code).toBe('23505');
  });

  it('o mestre põe personagens da mesa e fichas npc dele; o position cresce e o inimigo nasce com o PV máximo da ficha', async () => {
    const hero = await addParticipant(gm, partyId, heroId, 'player');
    const g1 = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
    const g2 = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 2');

    expect(await participants()).toEqual([
      expect.objectContaining({ id: hero, side: 'player', position: 1, hp_current: null }),
      expect.objectContaining({ id: g1, position: 2, hp_current: 7, hp_temp: 0 }),
      expect.objectContaining({ id: g2, position: 3, hp_current: 7, hp_temp: 0 }),
    ]);
  });

  it('NPC aliado: uma ficha npc do mestre do lado dos jogadores, com rótulo e PV próprios', async () => {
    const guardId = await createNpc(gm.userId, 'Guarda', 11);
    const guard = await addParticipant(gm, partyId, guardId, 'ally', 'Guarda');

    expect(await participants()).toEqual([
      expect.objectContaining({
        id: guard,
        side: 'ally',
        label: 'Guarda',
        hp_current: 11,
        hp_temp: 0,
      }),
    ]);

    // Como o inimigo: precisa de rótulo e só vale para npc do próprio mestre
    const gmPc = await createCharacter(gm.userId, { name: 'DMPC' });
    for (const attempt of [
      { character_id: guardId, side: 'ally', label: null },
      { character_id: gmPc, side: 'ally', label: 'DMPC' },
      { character_id: heroId, side: 'ally', label: 'Arani' },
    ]) {
      const { error } = await gm.client
        .from('encounter_participants')
        .insert({ party_id: partyId, ...attempt });
      expect(error, JSON.stringify(attempt)).not.toBeNull();
    }
  });

  it('recusa: personagem de outra mesa, npc de outra pessoa, pc do mestre como inimigo, inimigo sem rótulo, PV em jogador', async () => {
    const otherGm = await createSignedInClient('other-gm');
    const otherParty = await createParty(otherGm);
    await addMember(otherParty, stranger.userId, 'active');
    const elsewhere = await createCharacter(stranger.userId, { name: 'Outra mesa' });
    await bring(stranger, otherParty, elsewhere);
    const foreignNpc = await createNpc(otherGm.userId, 'Orc');
    const gmPc = await createCharacter(gm.userId, { name: 'DMPC' });

    const attempts = [
      { character_id: elsewhere, side: 'player', label: null },
      { character_id: foreignNpc, side: 'enemy', label: 'Orc' },
      { character_id: gmPc, side: 'enemy', label: 'DMPC' },
      { character_id: goblinId, side: 'enemy', label: null },
      { character_id: goblinId, side: 'enemy', label: '   ' },
      { character_id: heroId, side: 'player', label: null, hp_current: 3 },
      { character_id: heroId, side: 'enemy', label: 'Arani' },
    ];
    for (const attempt of attempts) {
      const { error } = await gm.client
        .from('encounter_participants')
        .insert({ party_id: partyId, ...attempt });
      expect(error, JSON.stringify(attempt)).not.toBeNull();
    }
    expect(await participants()).toEqual([]);
  });

  it('o mesmo personagem de jogador entra uma vez só', async () => {
    await addParticipant(gm, partyId, heroId, 'player');
    await expect(addParticipant(gm, partyId, heroId, 'player')).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('o 51º participante falha com encounter_full', async () => {
    const { error } = await gm.client.from('encounter_participants').insert(
      Array.from({ length: 50 }, (_, i) => ({
        party_id: partyId,
        character_id: goblinId,
        side: 'enemy',
        label: `Goblin ${i + 1}`,
      })),
    );
    if (error) throw error;

    await expect(addParticipant(gm, partyId, heroId, 'player')).rejects.toMatchObject({
      message: 'encounter_full',
    });
    expect((await participants()).map((p) => p.position)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1),
    );
  });

  it('jogador, colega e estranho não leem nem escrevem encounters e encounter_participants', async () => {
    const id = await addParticipant(gm, partyId, goblinId, 'enemy');

    for (const session of [player, colleague, stranger]) {
      const encounters = await session.client.from('encounters').select('*');
      const rows = await session.client.from('encounter_participants').select('*');
      expect(encounters.data ?? []).toEqual([]);
      expect(rows.data ?? []).toEqual([]);

      await session.client
        .from('encounter_participants')
        .update({ hp_current: 0, initiative: 99 })
        .eq('id', id);
      await session.client.from('encounter_participants').delete().eq('id', id);
      await session.client.from('encounters').delete().eq('party_id', partyId);
      const inserted = await session.client
        .from('encounter_participants')
        .insert({ party_id: partyId, character_id: heroId, side: 'player' });
      expect(inserted.error).not.toBeNull();
    }

    expect(await participants()).toEqual([expect.objectContaining({ id, hp_current: 7 })]);
    expect(await encounter()).not.toBeNull();
  });

  it('o mestre muda iniciativa, rótulo e PV do inimigo; não muda position nem a rodada direto', async () => {
    const id = await addParticipant(gm, partyId, goblinId, 'enemy');

    const { error } = await gm.client
      .from('encounter_participants')
      .update({ initiative: 14, label: 'Chefe', hp_current: 3, hp_temp: 2 })
      .eq('id', id);
    if (error) throw error;

    const position = await gm.client
      .from('encounter_participants')
      .update({ position: 9 })
      .eq('id', id);
    const round = await gm.client.from('encounters').update({ round: 5 }).eq('party_id', partyId);
    expect(position.error).not.toBeNull();
    expect(round.error).not.toBeNull();

    expect(await participants()).toEqual([
      expect.objectContaining({ label: 'Chefe', position: 1, hp_current: 3, hp_temp: 2 }),
    ]);
    expect(await encounter()).toEqual({ round: 0, current_participant_id: null });
  });

  it('o jogador sai da mesa no meio do combate: o participante sai e, se era a vez dele, passa ao próximo', async () => {
    const hero = await addParticipant(gm, partyId, heroId, 'player');
    const goblin = await addParticipant(gm, partyId, goblinId, 'enemy');
    await setTurn(2, hero);

    await player.client
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', player.userId);

    expect((await participants()).map((p) => p.id)).toEqual([goblin]);
    expect(await encounter()).toEqual({ round: 2, current_participant_id: goblin });
  });

  it('apagar o último da ordem quando é a vez dele volta ao primeiro e soma a rodada', async () => {
    const hero = await addParticipant(gm, partyId, heroId, 'player');
    const goblin = await addParticipant(gm, partyId, goblinId, 'enemy');
    await setTurn(3, goblin);

    await gm.client.from('encounter_participants').delete().eq('id', goblin);

    expect(await encounter()).toEqual({ round: 4, current_participant_id: hero });
  });

  it('apagar quem não é a vez não mexe no turno; apagar o único deixa sem turno', async () => {
    const hero = await addParticipant(gm, partyId, heroId, 'player');
    const goblin = await addParticipant(gm, partyId, goblinId, 'enemy');
    await setTurn(1, hero);

    await gm.client.from('encounter_participants').delete().eq('id', goblin);
    expect(await encounter()).toEqual({ round: 1, current_participant_id: hero });

    await gm.client.from('encounter_participants').delete().eq('id', hero);
    expect(await encounter()).toEqual({ round: 1, current_participant_id: null });
  });

  it('apagar (soft delete) a ficha do inimigo tira os participantes dela', async () => {
    await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
    await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 2');
    const hero = await addParticipant(gm, partyId, heroId, 'player');

    await gm.client
      .from('characters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', goblinId);

    expect((await participants()).map((p) => p.id)).toEqual([hero]);
  });

  it('apagar a mesa apaga o combate', async () => {
    await addParticipant(gm, partyId, goblinId, 'enemy');

    await gm.client.from('parties').delete().eq('id', partyId);

    expect(await encounter()).toBeNull();
    expect(await participants()).toEqual([]);
  });
});
