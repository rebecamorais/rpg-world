import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  addParticipant,
  bring,
  chooseUsername,
  createCharacter,
  createEncounter,
  createNpc,
  createParty,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();
const unique = (label: string) => `${label}_${crypto.randomUUID().slice(0, 8)}`;

describe('Iniciativa do jogador e @ na lista de turnos (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let partyId: string;
  let heroCharacter: string;
  let friendCharacter: string;
  let hero: string;
  let friend: string;
  let goblin: string;

  const initiativeOf = async (id: string) => {
    const { data } = await admin()
      .from('encounter_participants')
      .select('initiative')
      .eq('id', id)
      .single();
    return data?.initiative;
  };

  const setInitiative = (session: Session, participantId: string, initiative: number | null) =>
    session.client.rpc('set_my_initiative', {
      p_party_id: partyId,
      p_participant_id: participantId,
      // The generated type marks the argument as number; the function accepts null
      p_initiative: initiative as number,
    });

  const turns = async (session: Session) => {
    const { data, error } = await session.client.rpc('encounter_turns', { p_party_id: partyId });
    if (error) throw error;
    return data;
  };

  const rowOf = async (session: Session, id: string) =>
    (await turns(session)).find((row) => row.participant_id === id);

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    colleague = await createSignedInClient('colleague');
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    await addMember(partyId, colleague.userId, 'active');
    heroCharacter = await createCharacter(player.userId, { name: 'Arani' });
    friendCharacter = await createCharacter(colleague.userId, { name: 'Brom' });
    await bring(player, partyId, heroCharacter);
    await bring(colleague, partyId, friendCharacter);
    const goblinId = await createNpc(gm.userId, 'Goblin', 7);
    await createEncounter(gm, partyId);
    hero = await addParticipant(gm, partyId, heroCharacter, 'player');
    friend = await addParticipant(gm, partyId, friendCharacter, 'player');
    goblin = await addParticipant(gm, partyId, goblinId, 'enemy', 'Goblin 1');
    const { error } = await gm.client
      .from('encounter_participants')
      .update({ visibility: 'visible', initiative: 12 })
      .eq('id', goblin);
    if (error) throw error;
  });

  describe('set_my_initiative', () => {
    it('jogador muda a própria iniciativa e pode limpar', async () => {
      const set = await setInitiative(player, hero, 14);
      expect(set.error).toBeNull();
      expect(set.data).toBe(true);
      expect(await initiativeOf(hero)).toBe(14);

      const cleared = await setInitiative(player, hero, null);
      expect(cleared.error).toBeNull();
      expect(cleared.data).toBe(true);
      expect(await initiativeOf(hero)).toBeNull();
    });

    it('vale com o combate em andamento, na própria vez e com 0 PV', async () => {
      const { error } = await gm.client.rpc('start_encounter', { p_party_id: partyId });
      if (error) throw error;
      const down = await admin()
        .from('characters')
        .update({ hp_current: 0 })
        .eq('id', heroCharacter);
      if (down.error) throw down.error;

      const set = await setInitiative(player, hero, -3);
      expect(set.data).toBe(true);
      expect(await initiativeOf(hero)).toBe(-3);
    });

    it('jogador não muda a iniciativa de outro jogador nem de NPC', async () => {
      await setInitiative(colleague, friend, 9);

      const onFriend = await setInitiative(player, friend, 20);
      expect(onFriend.error).toBeNull();
      expect(onFriend.data).toBe(false);
      expect(await initiativeOf(friend)).toBe(9);

      const onGoblin = await setInitiative(player, goblin, 20);
      expect(onGoblin.error).toBeNull();
      expect(onGoblin.data).toBe(false);
      expect(await initiativeOf(goblin)).toBe(12);
    });

    it('quem não é da mesa, o mestre e a mesa errada recebem false', async () => {
      const stranger = await createSignedInClient('stranger');
      expect((await setInitiative(stranger, hero, 5)).data).toBe(false);

      // Sem atalho do mestre: ele segue pela coluna
      expect((await setInitiative(gm, goblin, 5)).data).toBe(false);
      expect((await setInitiative(gm, hero, 5)).data).toBe(false);

      const otherParty = await createParty(gm, 'Outra mesa');
      const wrongParty = await player.client.rpc('set_my_initiative', {
        p_party_id: otherParty,
        p_participant_id: hero,
        p_initiative: 5,
      });
      expect(wrongParty.data).toBe(false);

      expect((await setInitiative(player, crypto.randomUUID(), 5)).data).toBe(false);
      expect(await initiativeOf(hero)).toBeNull();
      expect(await initiativeOf(goblin)).toBe(12);
    });

    it('membro que saiu ou personagem fora da mesa recebe false', async () => {
      await admin()
        .from('party_characters')
        .delete()
        .eq('party_id', partyId)
        .eq('character_id', heroCharacter);
      // Tirar o personagem da mesa pode já tirar do combate; de todo jeito, nada muda
      expect((await setInitiative(player, hero, 5)).data).toBe(false);

      await admin()
        .from('party_members')
        .update({ status: 'invited' })
        .eq('party_id', partyId)
        .eq('user_id', colleague.userId);
      expect((await setInitiative(colleague, friend, 5)).data).toBe(false);
      expect(await initiativeOf(friend)).toBeNull();
    });

    it('fora de -10..99 recusa', async () => {
      const high = await setInitiative(player, hero, 100);
      expect(high.error?.code).toBe('23514');
      const low = await setInitiative(player, hero, -11);
      expect(low.error?.code).toBe('23514');
      expect(await initiativeOf(hero)).toBeNull();
    });

    it('anon não executa', async () => {
      const { error } = await SupabaseFactory.createAnon().rpc('set_my_initiative', {
        p_party_id: partyId,
        p_participant_id: hero,
        p_initiative: 5,
      });
      expect(error?.code).toBe('42501');
    });
  });

  describe('encounter_turns', () => {
    it('encounter_turns traz a própria iniciativa e o id do personagem, só na própria linha', async () => {
      await setInitiative(player, hero, 14);
      await setInitiative(colleague, friend, 9);

      const mine = await rowOf(player, hero);
      expect(mine?.initiative).toBe(14);
      expect(mine?.character_id).toBe(heroCharacter);

      const theirs = await rowOf(player, friend);
      expect(theirs?.initiative).toBeNull();
      expect(theirs?.character_id).toBeNull();

      const npc = await rowOf(player, goblin);
      expect(npc?.initiative).toBeNull();
      expect(npc?.character_id).toBeNull();

      // O colega vê a dele e não a do jogador
      expect((await rowOf(colleague, friend))?.initiative).toBe(9);
      expect((await rowOf(colleague, hero))?.initiative).toBeNull();

      // O mestre não tem linha própria: nada vem por aqui
      for (const row of await turns(gm)) {
        expect(row.initiative).toBeNull();
        expect(row.character_id).toBeNull();
      }
    });

    it('encounter_turns traz o @ só de quem escolheu o username', async () => {
      const username = unique('arani');
      await chooseUsername(player.userId, username);

      expect((await rowOf(colleague, hero))?.owner_username).toBe(username);
      expect((await rowOf(player, hero))?.owner_username).toBe(username);
      // O colega não escolheu: o @ aleatório não sai
      expect((await rowOf(player, friend))?.owner_username).toBeNull();
    });

    it('NPC nunca tem owner_username', async () => {
      await chooseUsername(gm.userId, unique('mestre'));
      expect((await rowOf(player, goblin))?.owner_username).toBeNull();
      expect((await rowOf(gm, goblin))?.owner_username).toBeNull();
    });

    it('a lista de colunas é exatamente a esperada', async () => {
      const rows = await turns(player);
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
  });
});
