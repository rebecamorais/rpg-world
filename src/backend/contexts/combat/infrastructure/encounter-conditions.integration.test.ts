import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
import { listenAsMember, untilNotified, waitFor } from '../../../../../test/helpers/realtime';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;
type Condition = { key: string; level: number | null };

const admin = () => SupabaseFactory.createAdmin();

const PRONE: Condition[] = [{ key: 'dnd5e:srd-5.2:condition:prone', level: null }];

// Conditions are written only through set_participant_conditions: the GM on anyone, a player on
// their own character still in the party. Everyone in the party sees them through encounter_turns.
describe('Condições no combate e edição da mesa (Integration)', () => {
  let gm: Session;
  let player: Session;
  let colleague: Session;
  let stranger: Session;
  let partyId: string;
  let heroId: string;
  let hero: string;
  let friend: string;
  let goblin: string;
  let guard: string;
  const channels: Session[] = [];

  const setConditions = (session: Session, participantId: string, conditions: unknown) =>
    session.client.rpc('set_participant_conditions', {
      p_party_id: partyId,
      p_participant_id: participantId,
      p_conditions: conditions as Condition[],
    });

  const conditionsOf = async (participantId: string) => {
    const { data, error } = await admin()
      .from('encounter_participants')
      .select('conditions')
      .eq('id', participantId)
      .single();
    if (error) throw error;
    return data.conditions;
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
    const friendId = await createCharacter(colleague.userId, { name: 'Brom' });
    await bring(player, partyId, heroId);
    await bring(colleague, partyId, friendId);
    await createEncounter(gm, partyId);
    hero = await addParticipant(gm, partyId, heroId, 'player');
    friend = await addParticipant(gm, partyId, friendId, 'player');
    goblin = await addParticipant(gm, partyId, await createNpc(gm.userId), 'enemy', 'Goblin 1');
    guard = await addParticipant(
      gm,
      partyId,
      await createNpc(gm.userId, 'Guarda'),
      'ally',
      'Guarda',
    );
  });

  afterEach(async () => {
    await Promise.all(channels.splice(0).map((s) => s.client.removeAllChannels()));
  });

  describe('set_participant_conditions', () => {
    it('o participante começa sem condições', async () => {
      expect(await conditionsOf(hero)).toEqual([]);
    });

    it('o mestre põe num inimigo e num jogador; o jogador vê as duas em encounter_turns', async () => {
      expect((await setConditions(gm, goblin, PRONE)).data).toBe(true);
      expect((await setConditions(gm, hero, PRONE)).data).toBe(true);
      // NPC entra oculto; visível, o jogador vê as condições dele
      await gm.client
        .from('encounter_participants')
        .update({ visibility: 'visible' })
        .eq('id', goblin);

      const { data, error } = await player.client.rpc('encounter_turns', { p_party_id: partyId });
      if (error) throw error;
      const byId = new Map(data.map((row) => [row.participant_id, row.conditions]));
      expect(byId.get(goblin)).toEqual(PRONE);
      expect(byId.get(hero)).toEqual(PRONE);
      expect(byId.get(friend)).toEqual([]);
    });

    it('o jogador põe no próprio personagem, com nível na exaustão', async () => {
      const exhausted = [
        { key: 'dnd5e:srd-5.2:condition:exhaustion', level: 3 },
        { key: 'dnd5e:srd-5.1:condition:poisoned', level: null },
      ];
      expect((await setConditions(player, hero, exhausted)).data).toBe(true);
      expect(await conditionsOf(hero)).toEqual(exhausted);

      expect((await setConditions(player, hero, [])).data).toBe(true);
      expect(await conditionsOf(hero)).toEqual([]);
    });

    it('o jogador não mexe no personagem de outro jogador, num inimigo nem num aliado', async () => {
      for (const target of [friend, goblin, guard]) {
        const { data, error } = await setConditions(player, target, PRONE);
        expect(error).toBeNull();
        expect(data, target).toBe(false);
        expect(await conditionsOf(target)).toEqual([]);
      }
    });

    it('o jogador não mexe num personagem dele que já não está na mesa (Review Focus 3)', async () => {
      // Leaving party_characters drops the participant; put it back straight to reach the check.
      await admin()
        .from('party_characters')
        .delete()
        .eq('party_id', partyId)
        .eq('character_id', heroId);
      const { data: back, error } = await admin()
        .from('encounter_participants')
        .insert({ party_id: partyId, character_id: heroId, side: 'player' })
        .select('id')
        .single();
      if (error) throw error;

      expect((await setConditions(player, back.id, PRONE)).data).toBe(false);
      expect(await conditionsOf(back.id)).toEqual([]);
    });

    it('participante de outra mesa ou inexistente: false', async () => {
      const otherGm = await createSignedInClient('other-gm');
      const otherParty = await createParty(otherGm);
      await createEncounter(otherGm, otherParty);
      const orc = await addParticipant(
        otherGm,
        otherParty,
        await createNpc(otherGm.userId),
        'enemy',
      );

      expect((await setConditions(gm, orc, PRONE)).data).toBe(false);
      expect((await setConditions(gm, crypto.randomUUID(), PRONE)).data).toBe(false);
      expect(await conditionsOf(orc)).toEqual([]);
    });

    it('quem não é da mesa: false, e encounter_turns vazio', async () => {
      expect((await setConditions(stranger, hero, PRONE)).data).toBe(false);
      expect((await setConditions(stranger, goblin, PRONE)).data).toBe(false);
      expect(await conditionsOf(goblin)).toEqual([]);

      const { data } = await stranger.client.rpc('encounter_turns', { p_party_id: partyId });
      expect(data).toEqual([]);
    });

    it('formato inválido falha com CHECK (23514)', async () => {
      const prone = PRONE[0];
      const invalid = [
        [{ key: 'dnd5e:srd-5.2:spell:fireball', level: null }],
        [{ key: 'dnd5e:srd-5.3:condition:prone', level: null }],
        [{ key: 'dnd5e:srd-5.2:condition:Prone', level: null }],
        [{ key: 'dnd5e:srd-5.2:condition:exhaustion', level: 7 }],
        [{ key: 'dnd5e:srd-5.2:condition:exhaustion', level: 0 }],
        [{ key: 'dnd5e:srd-5.2:condition:exhaustion', level: 2.5 }],
        [{ key: 'dnd5e:srd-5.2:condition:exhaustion', level: '3' }],
        [prone, prone],
        [{ ...prone, extra: true }],
        ['dnd5e:srd-5.2:condition:prone'],
        prone,
        Array.from({ length: 21 }, (_, i) => ({
          key: `dnd5e:srd-5.2:condition:c${i}`,
          level: null,
        })),
      ];
      for (const conditions of invalid) {
        const { error } = await setConditions(gm, goblin, conditions);
        expect(error?.code, JSON.stringify(conditions)).toBe('23514');
      }
      expect(await conditionsOf(goblin)).toEqual([]);

      const twenty = Array.from({ length: 20 }, (_, i) => ({
        key: `dnd5e:srd-5.2:condition:c${i}`,
        level: null,
      }));
      expect((await setConditions(gm, goblin, twenty)).data).toBe(true);
    });

    it('nem o mestre escreve conditions direto na tabela', async () => {
      const { error } = await gm.client
        .from('encounter_participants')
        .update({ conditions: PRONE })
        .eq('id', goblin);
      expect(error?.code).toBe('42501');
      expect(await conditionsOf(goblin)).toEqual([]);
    });

    it('anon não executa', async () => {
      const { error } = await SupabaseFactory.createAnon().rpc('set_participant_conditions', {
        p_party_id: partyId,
        p_participant_id: goblin,
        p_conditions: PRONE,
      });
      expect(error).not.toBeNull();
      expect(await conditionsOf(goblin)).toEqual([]);
    });

    it('mudar as condições avisa o tópico da mesa', async () => {
      channels.push(gm, player);
      const asGm = await listenAsMember(gm.client, partyId);
      const asPlayer = await listenAsMember(player.client, partyId);
      expect([asGm.status, asPlayer.status]).toEqual(['SUBSCRIBED', 'SUBSCRIBED']);

      const change = async () => {
        const { error } = await setConditions(player, hero, PRONE);
        if (error) throw error;
      };

      expect(await untilNotified(asGm.messages, change)).toBeGreaterThan(0);
      expect(await waitFor(asPlayer.messages, 1)).toBeGreaterThan(0);
    });
  });

  describe('parties.edition', () => {
    const edition = async () => {
      const { data, error } = await admin()
        .from('parties')
        .select('edition')
        .eq('id', partyId)
        .single();
      if (error) throw error;
      return data.edition;
    };

    it("a mesa nasce em '2024'; o mestre troca para '2014'", async () => {
      expect(await edition()).toBe('2024');

      const { error } = await gm.client
        .from('parties')
        .update({ edition: '2014' })
        .eq('id', partyId);
      if (error) throw error;
      expect(await edition()).toBe('2014');
    });

    it('o membro não troca (zero linhas)', async () => {
      const { data, error } = await player.client
        .from('parties')
        .update({ edition: '2014' })
        .eq('id', partyId)
        .select('id');
      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(await edition()).toBe('2024');
    });

    it('uma edição fora da lista falha com CHECK (23514)', async () => {
      const { error } = await gm.client
        .from('parties')
        .update({ edition: '2030' })
        .eq('id', partyId);
      expect(error?.code).toBe('23514');
      expect(await edition()).toBe('2024');
    });
  });
});
