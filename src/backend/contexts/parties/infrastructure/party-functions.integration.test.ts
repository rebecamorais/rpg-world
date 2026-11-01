import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  chooseUsername,
  createCharacter,
  createParty,
  inviteCode,
  memberStatus,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

const unique = (label: string) => `${label}_${crypto.randomUUID().slice(0, 8)}`;

describe('Funções das mesas (Integration)', () => {
  let gm: Session;
  let player: Session;
  let stranger: Session;
  let partyId: string;
  let code: string;
  let gmName: string;
  let playerName: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    stranger = await createSignedInClient('stranger');
    gmName = unique('mestra');
    playerName = unique('bia');
    await chooseUsername(gm.userId, gmName);
    await chooseUsername(player.userId, playerName);
    partyId = await createParty(gm);
    code = await inviteCode(partyId);
  });

  const rotateCode = async () => {
    const { error } = await gm.client
      .from('party_invites')
      .update({ code: crypto.randomUUID().replaceAll('-', '') })
      .eq('party_id', partyId);
    if (error) throw error;
  };

  describe('get_party_invite', () => {
    it('o preview do convite mostra nome e mestre; código trocado não acha nada', async () => {
      const { data } = await player.client.rpc('get_party_invite', { p_code: code });
      expect(data).toEqual([
        { party_id: partyId, name: 'Mesa de Quinta', gm_username: gmName, my_status: null },
      ]);

      await rotateCode();
      const after = await player.client.rpc('get_party_invite', { p_code: code });
      expect(after.data).toEqual([]);
    });

    it('mostra o status de quem já tem vínculo, e gm para o mestre', async () => {
      await addMember(partyId, player.userId, 'invited');

      const asPlayer = await player.client.rpc('get_party_invite', { p_code: code });
      const asGm = await gm.client.rpc('get_party_invite', { p_code: code });
      expect(asPlayer.data?.[0].my_status).toBe('invited');
      expect(asGm.data?.[0].my_status).toBe('gm');
    });
  });

  describe('request_party_join', () => {
    it('pedir para entrar cria requested; com código trocado dá party_invite_not_found', async () => {
      const { data } = await player.client.rpc('request_party_join', { p_code: code });
      expect(data).toBe('requested');
      expect(await memberStatus(partyId, player.userId)).toBe('requested');

      await rotateCode();
      const { error } = await stranger.client.rpc('request_party_join', { p_code: code });
      expect(error?.message).toBe('party_invite_not_found');
    });

    it('o mestre não pede para entrar na própria mesa', async () => {
      const { error } = await gm.client.rpc('request_party_join', { p_code: code });
      expect(error?.message).toBe('party_gm_cannot_join');
    });

    it('quem já é ativo continua ativo', async () => {
      await addMember(partyId, player.userId, 'active');
      const { data } = await player.client.rpc('request_party_join', { p_code: code });
      expect(data).toBe('active');
    });
  });

  describe('invite_to_party', () => {
    it('convidar por username ignora maiúsculas e cria invited', async () => {
      const { data } = await gm.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: playerName.toUpperCase(),
      });
      expect(data).toBe('invited');
      expect(await memberStatus(partyId, player.userId)).toBe('invited');
    });

    it('username gerado (não escolhido) não é achado: party_user_not_found', async () => {
      const { data: profile } = await admin()
        .from('profile')
        .select('username')
        .eq('id', stranger.userId)
        .single();

      const { error } = await gm.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: profile!.username,
      });
      expect(error?.message).toBe('party_user_not_found');
    });

    it('quem não é mestre não convida: party_not_found', async () => {
      const { error } = await stranger.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: playerName,
      });
      expect(error?.message).toBe('party_not_found');
    });

    it('o mestre não se convida', async () => {
      const { error } = await gm.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: gmName,
      });
      expect(error?.message).toBe('party_gm_cannot_join');
    });

    it('pedido e depois convite para a mesma pessoa vira active', async () => {
      await player.client.rpc('request_party_join', { p_code: code });
      const { data } = await gm.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: playerName,
      });
      expect(data).toBe('active');
    });

    it('convite e depois pedido da mesma pessoa vira active', async () => {
      await gm.client.rpc('invite_to_party', { p_party_id: partyId, p_username: playerName });
      const { data } = await player.client.rpc('request_party_join', { p_code: code });
      expect(data).toBe('active');
    });
  });

  describe('party_people', () => {
    it('o colega vê o mestre e os ativos, não os pedidos; username não escolhido vem null', async () => {
      const colleague = await createSignedInClient('colleague');
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, colleague.userId, 'active');
      await addMember(partyId, stranger.userId, 'requested');

      const { data } = await player.client.rpc('party_people', { p_party_id: partyId });

      const byUser = Object.fromEntries((data ?? []).map((p) => [p.user_id, p]));
      expect(Object.keys(byUser).sort()).toEqual(
        [gm.userId, player.userId, colleague.userId].sort(),
      );
      expect(byUser[gm.userId]).toMatchObject({ status: 'gm', username: gmName });
      expect(byUser[player.userId]).toMatchObject({ status: 'active', username: playerName });
      expect(byUser[colleague.userId].username).toBeNull();
    });

    it('o mestre vê todos, com o status de cada um', async () => {
      await addMember(partyId, player.userId, 'invited');
      await addMember(partyId, stranger.userId, 'requested');

      const { data } = await gm.client.rpc('party_people', { p_party_id: partyId });

      const statuses = Object.fromEntries((data ?? []).map((p) => [p.user_id, p.status]));
      expect(statuses).toEqual({
        [gm.userId]: 'gm',
        [player.userId]: 'invited',
        [stranger.userId]: 'requested',
      });
    });

    it('quem não é da mesa, ou só foi convidado, recebe zero linhas', async () => {
      await addMember(partyId, player.userId, 'invited');

      expect((await stranger.client.rpc('party_people', { p_party_id: partyId })).data).toEqual([]);
      expect((await player.client.rpc('party_people', { p_party_id: partyId })).data).toEqual([]);
    });
  });

  describe('party_roster', () => {
    const take = async (session: Session, characterId: string) => {
      const { error } = await session.client
        .from('party_characters')
        .insert({ party_id: partyId, character_id: characterId });
      if (error) throw error;
    };

    it('devolve só as colunas do básico, sem PV, atributos nem lore', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId, {
        name: 'Arani',
        level: 3,
        hp_current: 7,
        system_data: { race: 'Elfa', class: 'Maga', ac: 12 },
      });
      await take(player, characterId);

      const { data } = await player.client.rpc('party_roster', { p_party_id: partyId });

      expect(data).toHaveLength(1);
      expect(Object.keys(data![0]).sort()).toEqual(
        [
          'avatar_url',
          'character_id',
          'class',
          'level',
          'name',
          'owner_id',
          'race',
          'theme_color',
        ].sort(),
      );
      expect(data![0]).toMatchObject({
        character_id: characterId,
        owner_id: player.userId,
        name: 'Arani',
        race: 'Elfa',
        class: 'Maga',
        level: 3,
      });
    });

    it('o estranho e quem está só invited recebem zero linhas', async () => {
      await addMember(partyId, player.userId, 'active');
      await take(player, await createCharacter(player.userId));
      await addMember(partyId, stranger.userId, 'invited');

      expect((await stranger.client.rpc('party_roster', { p_party_id: partyId })).data).toEqual([]);
      expect((await gm.client.rpc('party_roster', { p_party_id: partyId })).data).toHaveLength(1);
    });

    it('ignora personagem apagado', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);
      await take(player, characterId);
      await admin()
        .from('characters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', characterId);

      expect((await gm.client.rpc('party_roster', { p_party_id: partyId })).data).toEqual([]);
    });
  });

  describe('my_parties', () => {
    it('separa mestre e jogador e conta os pedidos pendentes', async () => {
      const otherGm = await createSignedInClient('other-gm');
      const otherParty = await createParty(otherGm, 'Outra Mesa');
      await addMember(otherParty, gm.userId, 'invited');
      await addMember(partyId, player.userId, 'requested');
      await addMember(partyId, stranger.userId, 'requested');

      const { data } = await gm.client.rpc('my_parties');

      expect(data).toEqual([
        {
          party_id: partyId,
          name: 'Mesa de Quinta',
          system: 'dnd_5e',
          role: 'gm',
          status: 'gm',
          gm_username: gmName,
          pending_requests: 2,
        },
        {
          party_id: otherParty,
          name: 'Outra Mesa',
          system: 'dnd_5e',
          role: 'player',
          status: 'invited',
          gm_username: null,
          pending_requests: 0,
        },
      ]);
    });
  });

  it('anon não executa nenhuma das funções', async () => {
    const anon = SupabaseFactory.createAnon();
    const calls = [
      anon.rpc('get_party_invite', { p_code: code }),
      anon.rpc('request_party_join', { p_code: code }),
      anon.rpc('invite_to_party', { p_party_id: partyId, p_username: playerName }),
      anon.rpc('party_people', { p_party_id: partyId }),
      anon.rpc('party_roster', { p_party_id: partyId }),
      anon.rpc('my_parties'),
    ];

    for (const { error } of await Promise.all(calls)) {
      expect(error).not.toBeNull();
    }
  });
});
