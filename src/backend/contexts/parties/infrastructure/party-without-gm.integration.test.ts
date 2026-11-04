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
  inviteCode,
  memberStatus,
  whileTransactionOpen,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

const unique = (label: string) => `${label}_${crypto.randomUUID().slice(0, 8)}`;

const DOC = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab';
const ROPE = 'dnd5e:srd-5.2:item:rope';

const deleteAccount = async (session: Session) => {
  const { error } = await admin().auth.admin.deleteUser(session.userId);
  if (error) throw error;
};

const partyRow = async (partyId: string) => {
  const { data } = await admin()
    .from('parties')
    .select('id, name, gm_id, image_url')
    .eq('id', partyId)
    .maybeSingle();
  return data;
};

const chestId = async (partyId: string) => {
  const { data, error } = await admin()
    .from('containers')
    .select('id')
    .eq('party_id', partyId)
    .eq('kind', 'party_chest')
    .single();
  if (error) throw error;
  return data.id;
};

const leave = async (session: Session, partyId: string) => {
  const { error } = await session.client
    .from('party_members')
    .delete()
    .eq('party_id', partyId)
    .eq('user_id', session.userId);
  if (error) throw error;
};

describe('Mesa sem mestre (Integration)', () => {
  let gm: Session;
  let player: Session;
  let otherPlayer: Session;
  let partyId: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    otherPlayer = await createSignedInClient('other');
    partyId = await createParty(gm);
  });

  describe('quando a conta do mestre é excluída', () => {
    it('com jogador ativo, a mesa continua, sem mestre, imagem nem combate', async () => {
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'requested');
      const characterId = await createCharacter(player.userId);
      await bring(player, partyId, characterId);
      const chest = await chestId(partyId);
      await admin()
        .from('inventory_items')
        .insert({ container_id: chest, item_ref: ROPE, quantity: 2 });
      await admin().from('party_journals').insert({ party_id: partyId, doc_id: DOC });
      const image = `https://images.test/avatars/${gm.userId}/parties/${partyId}-abc123.webp`;
      const setImage = await admin().from('parties').update({ image_url: image }).eq('id', partyId);
      expect(setImage.error).toBeNull();
      await createEncounter(gm, partyId);
      await addParticipant(gm, partyId, characterId, 'player');
      await addParticipant(gm, partyId, await createNpc(gm.userId), 'enemy');

      await deleteAccount(gm);

      expect(await partyRow(partyId)).toEqual({
        id: partyId,
        name: 'Mesa de Quinta',
        gm_id: null,
        image_url: null,
      });

      const encounters = await admin()
        .from('encounters')
        .select('party_id')
        .eq('party_id', partyId);
      const participants = await admin()
        .from('encounter_participants')
        .select('id')
        .eq('party_id', partyId);
      expect(encounters.data).toEqual([]);
      expect(participants.data).toEqual([]);

      const items = await admin()
        .from('inventory_items')
        .select('item_ref, quantity')
        .eq('container_id', chest);
      expect(items.data).toEqual([{ item_ref: ROPE, quantity: 2 }]);
      const journal = await admin().from('party_journals').select('doc_id').eq('party_id', partyId);
      expect(journal.data).toEqual([{ doc_id: DOC }]);

      // Pedidos e convites ficam guardados para o próximo mestre
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('requested');
      const roster = await admin()
        .from('party_characters')
        .select('character_id')
        .eq('party_id', partyId);
      expect(roster.data).toEqual([{ character_id: characterId }]);
    });

    it('com combate em andamento, na vez do NPC do mestre, a mesa continua sem o combate', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);
      await bring(player, partyId, characterId);
      await createEncounter(gm, partyId);
      const npcTurn = await addParticipant(gm, partyId, await createNpc(gm.userId), 'enemy');
      await addParticipant(gm, partyId, characterId, 'player');
      const started = await gm.client.rpc('start_encounter', { p_party_id: partyId });
      expect(started.error).toBeNull();
      const running = await admin()
        .from('encounters')
        .select('round, current_participant_id')
        .eq('party_id', partyId)
        .single();
      expect(running.data).toEqual({ round: 1, current_participant_id: npcTurn });

      await deleteAccount(gm);

      expect((await partyRow(partyId))?.gm_id).toBeNull();
      const encounters = await admin()
        .from('encounters')
        .select('party_id')
        .eq('party_id', partyId);
      const participants = await admin()
        .from('encounter_participants')
        .select('id')
        .eq('party_id', partyId);
      expect(encounters.data).toEqual([]);
      expect(participants.data).toEqual([]);
      expect(await memberStatus(partyId, player.userId)).toBe('active');
    });

    it('só com pedido e convite pendentes, a mesa some', async () => {
      await addMember(partyId, player.userId, 'requested');
      await addMember(partyId, otherPlayer.userId, 'invited');
      const chest = await chestId(partyId);

      await deleteAccount(gm);

      expect(await partyRow(partyId)).toBeNull();
      const containers = await admin().from('containers').select('id').eq('id', chest);
      const members = await admin().from('party_members').select('user_id').eq('party_id', partyId);
      expect(containers.data).toEqual([]);
      expect(members.data).toEqual([]);
    });

    it('sem ninguém, a mesa some', async () => {
      await deleteAccount(gm);
      expect(await partyRow(partyId)).toBeNull();
    });

    it('as mesas do mestre seguem cada uma o seu caminho', async () => {
      const emptyParty = await createParty(gm, 'Vazia');
      await addMember(partyId, player.userId, 'active');

      await deleteAccount(gm);

      expect((await partyRow(partyId))?.gm_id).toBeNull();
      expect(await partyRow(emptyParty)).toBeNull();
    });
  });

  describe('quando um jogador sai de uma mesa sem mestre', () => {
    beforeEach(async () => {
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'active');
      await deleteAccount(gm);
    });

    it('a mesa continua enquanto houver outro jogador ativo', async () => {
      await leave(player, partyId);

      expect(await partyRow(partyId)).not.toBeNull();
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('active');
    });

    it('o último jogador ativo saindo apaga a mesa, mesmo com pedido pendente', async () => {
      const stranger = await createSignedInClient('stranger');
      await addMember(partyId, stranger.userId, 'requested');

      await leave(player, partyId);
      await leave(otherPlayer, partyId);

      expect(await partyRow(partyId)).toBeNull();
      const members = await admin().from('party_members').select('user_id').eq('party_id', partyId);
      expect(members.data).toEqual([]);
    });

    it('o último jogador ativo excluindo a conta apaga a mesa', async () => {
      await deleteAccount(player);
      expect(await partyRow(partyId)).not.toBeNull();

      await deleteAccount(otherPlayer);
      expect(await partyRow(partyId)).toBeNull();
    });

    it('os dois últimos jogadores saindo ao mesmo tempo apagam a mesa', async () => {
      await Promise.all([leave(player, partyId), leave(otherPlayer, partyId)]);

      expect(await partyRow(partyId)).toBeNull();
    });

    it('quem pediu para entrar desistir não apaga a mesa', async () => {
      const stranger = await createSignedInClient('stranger');
      await addMember(partyId, stranger.userId, 'requested');

      await leave(stranger, partyId);

      expect(await partyRow(partyId)).not.toBeNull();
    });

    it('quem não é ativo sai sem esperar o bloqueio da mesa', async () => {
      const stranger = await createSignedInClient('stranger');
      await addMember(partyId, stranger.userId, 'requested');

      const { finishedBeforeCommit } = await whileTransactionOpen(
        `SELECT 1 FROM public.parties WHERE id = '${partyId}' FOR NO KEY UPDATE`,
        () => leave(stranger, partyId),
      );

      expect(finishedBeforeCommit).toBe(true);
      expect(await memberStatus(partyId, stranger.userId)).toBeNull();
    });
  });

  describe('com mestre, a saída do último jogador não apaga a mesa', () => {
    it('a mesa continua', async () => {
      await addMember(partyId, player.userId, 'active');

      await leave(player, partyId);

      expect((await partyRow(partyId))?.gm_id).toBe(gm.userId);
    });
  });

  describe('o que os jogadores ainda leem', () => {
    let playerName: string;
    let otherName: string;

    beforeEach(async () => {
      playerName = unique('bia');
      otherName = unique('caio');
      await chooseUsername(player.userId, playerName);
      await chooseUsername(otherPlayer.userId, otherName);
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'active');
      await admin().from('party_journals').insert({ party_id: partyId, doc_id: DOC });
      await admin()
        .from('inventory_items')
        .insert({ container_id: await chestId(partyId), item_ref: ROPE, quantity: 2 });
      await deleteAccount(gm);
    });

    it('a mesa, o baú e o diário', async () => {
      const party = await player.client.from('parties').select('id, gm_id').eq('id', partyId);
      const chest = await player.client.from('containers').select('kind').eq('party_id', partyId);
      const journal = await player.client
        .from('party_journals')
        .select('doc_id')
        .eq('party_id', partyId);

      expect(party.data).toEqual([{ id: partyId, gm_id: null }]);
      expect(chest.data).toEqual([{ kind: 'party_chest' }]);
      expect(journal.data).toEqual([{ doc_id: DOC }]);
    });

    it('os itens do baú', async () => {
      const items = await player.client
        .from('inventory_items')
        .select('item_ref, quantity')
        .eq('container_id', await chestId(partyId));

      expect(items.error).toBeNull();
      expect(items.data).toEqual([{ item_ref: ROPE, quantity: 2 }]);
    });

    it('my_parties traz a mesa com gm_username nulo', async () => {
      const { data, error } = await player.client.rpc('my_parties');

      expect(error).toBeNull();
      expect(data).toEqual([
        {
          party_id: partyId,
          name: 'Mesa de Quinta',
          system: 'dnd_5e',
          role: 'player',
          status: 'active',
          gm_username: null,
          pending_requests: 0,
          active_players: 2,
          has_gm: false,
        },
      ]);
    });

    it('party_people traz os membros, sem linha de mestre', async () => {
      const { data, error } = await player.client.rpc('party_people', { p_party_id: partyId });

      expect(error).toBeNull();
      expect(data?.map((p) => [p.username, p.status]).sort()).toEqual(
        [
          [playerName, 'active'],
          [otherName, 'active'],
        ].sort(),
      );
    });

    it('party_roster traz o básico dos personagens', async () => {
      const characterId = await createCharacter(otherPlayer.userId, { name: 'Tork' });
      await bring(otherPlayer, partyId, characterId);

      const { data } = await player.client.rpc('party_roster', { p_party_id: partyId });

      expect(data?.map((r) => r.character_id)).toEqual([characterId]);
    });
  });

  describe('ninguém ganha acesso', () => {
    beforeEach(async () => {
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'active');
      await deleteAccount(gm);
    });

    it('um jogador não lê a ficha completa de outro', async () => {
      const characterId = await createCharacter(otherPlayer.userId);
      await bring(otherPlayer, partyId, characterId);

      const { data } = await player.client.from('characters').select('id').eq('id', characterId);

      expect(data).toEqual([]);
    });

    it('um jogador não atualiza a mesa', async () => {
      const { data } = await player.client
        .from('parties')
        .update({ name: 'Tomada' })
        .eq('id', partyId)
        .select('id');

      expect(data).toEqual([]);
      expect((await partyRow(partyId))?.name).toBe('Mesa de Quinta');
    });

    it('um jogador não se declara mestre', async () => {
      const { error } = await player.client
        .from('parties')
        .update({ gm_id: player.userId })
        .eq('id', partyId);

      expect(error).not.toBeNull();
      expect((await partyRow(partyId))?.gm_id).toBeNull();
    });

    it('um jogador não apaga a mesa', async () => {
      const { data } = await player.client.from('parties').delete().eq('id', partyId).select('id');

      expect(data).toEqual([]);
      expect(await partyRow(partyId)).not.toBeNull();
    });

    it('um jogador não tira outro membro', async () => {
      const { data } = await player.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', otherPlayer.userId)
        .select('user_id');

      expect(data).toEqual([]);
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('active');
    });

    it('um jogador não aprova pedido', async () => {
      const stranger = await createSignedInClient('stranger');
      await addMember(partyId, stranger.userId, 'requested');

      const { data } = await player.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', stranger.userId)
        .select('user_id');

      expect(data).toEqual([]);
      expect(await memberStatus(partyId, stranger.userId)).toBe('requested');
    });

    it('um jogador não lê o link de convite nem convida', async () => {
      const stranger = await createSignedInClient('stranger');
      const username = unique('dora');
      await chooseUsername(stranger.userId, username);

      const invite = await player.client
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId);
      const invited = await player.client.rpc('invite_to_party', {
        p_party_id: partyId,
        p_username: username,
      });

      expect(invite.data).toEqual([]);
      expect(invited.error?.message).toBe('party_not_found');
    });

    it('um jogador não abre combate nem troca o diário', async () => {
      const encounter = await player.client.from('encounters').insert({ party_id: partyId });
      const journal = await player.client
        .from('party_journals')
        .insert({ party_id: partyId, doc_id: DOC });

      expect(encounter.error).not.toBeNull();
      expect(journal.error).not.toBeNull();
    });

    it('ninguém cria uma mesa sem mestre', async () => {
      const { error } = await player.client.from('parties').insert({ name: 'Órfã', gm_id: null });

      expect(error).not.toBeNull();
    });
  });

  describe('entrar numa mesa sem mestre', () => {
    let code: string;
    let stranger: Session;

    beforeEach(async () => {
      stranger = await createSignedInClient('stranger');
      code = await inviteCode(partyId);
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'invited');
      await deleteAccount(gm);
    });

    it('request_party_join falha com party_without_gm', async () => {
      const { error } = await stranger.client.rpc('request_party_join', { p_code: code });

      expect(error?.message).toBe('party_without_gm');
      expect(await memberStatus(partyId, stranger.userId)).toBeNull();
    });

    it('request_party_join falha mesmo para quem foi convidado', async () => {
      const { error } = await otherPlayer.client.rpc('request_party_join', { p_code: code });

      expect(error?.message).toBe('party_without_gm');
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('invited');
    });

    it('request_party_join devolve o status de quem já é ativo ou já pediu', async () => {
      const requested = await createSignedInClient('requested');
      await addMember(partyId, requested.userId, 'requested');

      const asActive = await player.client.rpc('request_party_join', { p_code: code });
      const asRequested = await requested.client.rpc('request_party_join', { p_code: code });

      expect(asActive.error).toBeNull();
      expect(asActive.data).toBe('active');
      expect(asRequested.error).toBeNull();
      expect(asRequested.data).toBe('requested');
    });

    it('aceitar o convite falha com party_without_gm', async () => {
      const { error } = await otherPlayer.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', otherPlayer.userId);

      expect(error?.message).toBe('party_without_gm');
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('invited');
    });

    it('o convidado ainda pode recusar', async () => {
      await leave(otherPlayer, partyId);

      expect(await memberStatus(partyId, otherPlayer.userId)).toBeNull();
      expect(await partyRow(partyId)).not.toBeNull();
    });

    it('get_party_invite devolve a mesa com gm_username nulo e has_gm falso', async () => {
      const asStranger = await stranger.client.rpc('get_party_invite', { p_code: code });
      const asInvited = await otherPlayer.client.rpc('get_party_invite', { p_code: code });

      expect(asStranger.data).toEqual([
        {
          party_id: partyId,
          name: 'Mesa de Quinta',
          gm_username: null,
          my_status: null,
          has_gm: false,
        },
      ]);
      expect(asInvited.data?.[0].my_status).toBe('invited');
    });
  });

  describe('aceitar um convite enquanto a exclusão do mestre não terminou', () => {
    it('espera a exclusão e falha com party_without_gm', async () => {
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, otherPlayer.userId, 'invited');

      const { result, finishedBeforeCommit } = await whileTransactionOpen(
        `UPDATE public.parties SET gm_id = NULL WHERE id = '${partyId}'`,
        () =>
          otherPlayer.client
            .from('party_members')
            .update({ status: 'active' })
            .eq('party_id', partyId)
            .eq('user_id', otherPlayer.userId),
      );

      expect(finishedBeforeCommit).toBe(false);
      expect(result.error?.message).toBe('party_without_gm');
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('invited');
    });
  });

  describe('mesa com mestre continua igual', () => {
    it('o mestre cria e renomeia; o nome dele aparece', async () => {
      const gmName = unique('mestra');
      await chooseUsername(gm.userId, gmName);

      const renamed = await gm.client
        .from('parties')
        .update({ name: 'Mesa de Sexta' })
        .eq('id', partyId)
        .select('name');
      const mine = await gm.client.rpc('my_parties');

      expect(renamed.data).toEqual([{ name: 'Mesa de Sexta' }]);
      expect(mine.data?.map((p) => [p.name, p.role, p.gm_username])).toEqual([
        ['Mesa de Sexta', 'gm', gmName],
      ]);
    });

    it('o limite de 5 mesas continua', async () => {
      for (let i = 2; i <= 5; i++) await createParty(gm, `Mesa ${i}`);

      const { error } = await gm.client.from('parties').insert({ name: 'Sexta', gm_id: gm.userId });

      expect(error?.message).toBe('party_gm_limit');
    });

    it('aceitar convite e aprovar pedido continuam', async () => {
      const code = await inviteCode(partyId);
      await addMember(partyId, player.userId, 'invited');
      await addMember(partyId, otherPlayer.userId, 'requested');

      const joined = await player.client.rpc('request_party_join', { p_code: code });
      const approved = await gm.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', otherPlayer.userId);

      expect(joined.data).toBe('active');
      expect(approved.error).toBeNull();
      expect(await memberStatus(partyId, otherPlayer.userId)).toBe('active');
    });
  });
});
