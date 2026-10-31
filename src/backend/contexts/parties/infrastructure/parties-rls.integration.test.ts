import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

async function createParty(gm: Session, name = 'Mesa de Quinta') {
  const { data, error } = await gm.client
    .from('parties')
    .insert({ name, gm_id: gm.userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** States the app can't build yet (only through the functions of the next migration). */
async function addMember(partyId: string, userId: string, status: string) {
  const { error } = await admin()
    .from('party_members')
    .insert({ party_id: partyId, user_id: userId, status });
  if (error) throw error;
}

async function createCharacter(ownerId: string, fields: Record<string, unknown> = {}) {
  const id = crypto.randomUUID();
  const { error } = await admin()
    .from('characters')
    .insert({ id, owner_id: ownerId, name: 'Arani', ...fields });
  if (error) throw error;
  return id;
}

async function memberStatus(partyId: string, userId: string) {
  const { data } = await admin()
    .from('party_members')
    .select('status')
    .eq('party_id', partyId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.status ?? null;
}

describe('RLS das mesas (Integration)', () => {
  let gm: Session;
  let player: Session;
  let stranger: Session;
  let partyId: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    stranger = await createSignedInClient('stranger');
    partyId = await createParty(gm);
  });

  describe('parties', () => {
    it('o mestre cria até 5 mesas; a sexta falha com party_gm_limit', async () => {
      for (let i = 2; i <= 5; i++) await createParty(gm, `Mesa ${i}`);

      const { error } = await gm.client
        .from('parties')
        .insert({ name: 'Mesa 6', gm_id: gm.userId });

      expect(error?.message).toBe('party_gm_limit');
    });

    it('nome vazio ou com 61 caracteres é recusado', async () => {
      for (const name of ['   ', 'x'.repeat(61)]) {
        const { error } = await gm.client.from('parties').insert({ name, gm_id: gm.userId });
        expect(error, JSON.stringify(name)).not.toBeNull();
      }
    });

    it('ninguém cria mesa em nome de outra pessoa', async () => {
      const { error } = await stranger.client
        .from('parties')
        .insert({ name: 'Falsa', gm_id: gm.userId });
      expect(error).not.toBeNull();
    });

    it('só o mestre renomeia e apaga', async () => {
      const renamed = await stranger.client
        .from('parties')
        .update({ name: 'Sequestrada' })
        .eq('id', partyId)
        .select('id');
      expect(renamed.data ?? []).toEqual([]);

      const deleted = await stranger.client.from('parties').delete().eq('id', partyId).select('id');
      expect(deleted.data ?? []).toEqual([]);

      const { data } = await gm.client
        .from('parties')
        .update({ name: 'Nova' })
        .eq('id', partyId)
        .select('name')
        .single();
      expect(data?.name).toBe('Nova');
    });

    it('o mestre não troca o dono da mesa', async () => {
      const { error } = await gm.client
        .from('parties')
        .update({ gm_id: stranger.userId })
        .eq('id', partyId);
      expect(error).not.toBeNull();
    });
  });

  describe('party_members', () => {
    it('ninguém insere linha em party_members direto', async () => {
      const { error } = await player.client
        .from('party_members')
        .insert({ party_id: partyId, user_id: player.userId, status: 'active' });
      expect(error).not.toBeNull();
      expect(await memberStatus(partyId, player.userId)).toBeNull();
    });

    it('o mestre aprova um pedido (requested → active), mas não um convite que mandou', async () => {
      await addMember(partyId, player.userId, 'requested');
      await addMember(partyId, stranger.userId, 'invited');

      await gm.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', player.userId);
      await gm.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', stranger.userId);

      expect(await memberStatus(partyId, player.userId)).toBe('active');
      expect(await memberStatus(partyId, stranger.userId)).toBe('invited');
    });

    it('o convidado aceita o próprio convite, mas não aprova o próprio pedido', async () => {
      await addMember(partyId, player.userId, 'invited');
      await addMember(partyId, stranger.userId, 'requested');

      await player.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', player.userId);
      await stranger.client
        .from('party_members')
        .update({ status: 'active' })
        .eq('party_id', partyId)
        .eq('user_id', stranger.userId);

      expect(await memberStatus(partyId, player.userId)).toBe('active');
      expect(await memberStatus(partyId, stranger.userId)).toBe('requested');
    });

    it('o estranho não vê a mesa, os membros nem o código; o membro não vê o código', async () => {
      await addMember(partyId, player.userId, 'active');

      const strangerParty = await stranger.client.from('parties').select('id').eq('id', partyId);
      const strangerMembers = await stranger.client
        .from('party_members')
        .select('user_id')
        .eq('party_id', partyId);
      const strangerCode = await stranger.client
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId);
      expect(strangerParty.data).toEqual([]);
      expect(strangerMembers.data).toEqual([]);
      expect(strangerCode.data).toEqual([]);

      const memberParty = await player.client.from('parties').select('name').eq('id', partyId);
      const memberCode = await player.client
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId);
      expect(memberParty.data).toEqual([{ name: 'Mesa de Quinta' }]);
      expect(memberCode.data).toEqual([]);

      const gmCode = await gm.client
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId)
        .single();
      expect(gmCode.data?.code).toMatch(/^[a-f0-9]{32}$/);
    });

    it('o colega ativo vê os ativos, mas não os pedidos', async () => {
      await addMember(partyId, player.userId, 'active');
      await addMember(partyId, stranger.userId, 'requested');

      const { data } = await player.client
        .from('party_members')
        .select('user_id')
        .eq('party_id', partyId);

      expect(data).toEqual([{ user_id: player.userId }]);
    });

    it('o mestre tira alguém; a pessoa sai sozinha; o estranho não tira ninguém', async () => {
      await addMember(partyId, player.userId, 'active');

      await stranger.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', player.userId);
      expect(await memberStatus(partyId, player.userId)).toBe('active');

      await player.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', player.userId);
      expect(await memberStatus(partyId, player.userId)).toBeNull();

      await addMember(partyId, player.userId, 'active');
      await gm.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', player.userId);
      expect(await memberStatus(partyId, player.userId)).toBeNull();
    });
  });

  describe('party_invites', () => {
    it('trocar o código pelo mestre funciona; um código fora do formato é recusado', async () => {
      const next = crypto.randomUUID().replaceAll('-', '');
      const { error } = await gm.client
        .from('party_invites')
        .update({ code: next })
        .eq('party_id', partyId);
      expect(error).toBeNull();

      const bad = await gm.client
        .from('party_invites')
        .update({ code: 'abc' })
        .eq('party_id', partyId);
      expect(bad.error).not.toBeNull();

      const { data } = await admin()
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId)
        .single();
      expect(data?.code).toBe(next);
    });

    it('o membro não troca o código', async () => {
      await addMember(partyId, player.userId, 'active');
      const { data: before } = await admin()
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId)
        .single();

      await player.client
        .from('party_invites')
        .update({ code: crypto.randomUUID().replaceAll('-', '') })
        .eq('party_id', partyId);

      const { data: after } = await admin()
        .from('party_invites')
        .select('code')
        .eq('party_id', partyId)
        .single();
      expect(after?.code).toBe(before?.code);
    });
  });

  describe('party_characters', () => {
    const take = (session: Session, characterId: string) =>
      session.client
        .from('party_characters')
        .insert({ party_id: partyId, character_id: characterId });

    it('o membro ativo leva o próprio pc', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);

      const { error } = await take(player, characterId);

      expect(error).toBeNull();
    });

    it('não leva npc, personagem apagado, nem de outra pessoa', async () => {
      await addMember(partyId, player.userId, 'active');
      const npc = await createCharacter(player.userId, { kind: 'npc' });
      const deleted = await createCharacter(player.userId, {
        deleted_at: new Date().toISOString(),
      });
      const someoneElses = await createCharacter(stranger.userId);

      for (const characterId of [npc, deleted, someoneElses]) {
        const { error } = await take(player, characterId);
        expect(error, characterId).not.toBeNull();
      }
    });

    it('quem está só invited/requested não leva personagem', async () => {
      await addMember(partyId, player.userId, 'invited');
      await addMember(partyId, stranger.userId, 'requested');

      expect((await take(player, await createCharacter(player.userId))).error).not.toBeNull();
      expect((await take(stranger, await createCharacter(stranger.userId))).error).not.toBeNull();
    });

    it('o mestre não leva personagem para a própria mesa', async () => {
      expect((await take(gm, await createCharacter(gm.userId))).error).not.toBeNull();
    });

    it('sair da mesa apaga os personagens levados, não o personagem', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);
      await take(player, characterId);

      await player.client
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', player.userId);

      const links = await admin()
        .from('party_characters')
        .select('character_id')
        .eq('party_id', partyId);
      const character = await admin()
        .from('characters')
        .select('id, deleted_at')
        .eq('id', characterId)
        .single();
      expect(links.data).toEqual([]);
      expect(character.data).toEqual({ id: characterId, deleted_at: null });
    });

    it('apagar a mesa não apaga personagens', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);
      await take(player, characterId);

      await gm.client.from('parties').delete().eq('id', partyId);

      const character = await admin()
        .from('characters')
        .select('id, deleted_at')
        .eq('id', characterId)
        .single();
      expect(character.data).toEqual({ id: characterId, deleted_at: null });
    });

    it('o colega vê quais personagens estão na mesa; o estranho não', async () => {
      await addMember(partyId, player.userId, 'active');
      const characterId = await createCharacter(player.userId);
      await take(player, characterId);

      const asGm = await gm.client
        .from('party_characters')
        .select('character_id')
        .eq('party_id', partyId);
      const asStranger = await stranger.client
        .from('party_characters')
        .select('character_id')
        .eq('party_id', partyId);
      expect(asGm.data).toEqual([{ character_id: characterId }]);
      expect(asStranger.data).toEqual([]);
    });
  });
});
