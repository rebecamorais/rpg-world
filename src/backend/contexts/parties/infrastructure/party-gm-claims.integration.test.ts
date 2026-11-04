import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  bring,
  chooseUsername,
  createCharacter,
  createParty,
  memberStatus,
} from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { PartyErrorCodes } from '../domain/PartyError';
import { SupabasePartyRepository } from './supabase-party.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

const deleteAccount = async (session: Session) => {
  const { error } = await admin().auth.admin.deleteUser(session.userId);
  if (error) throw error;
};

const leave = async (session: Session, partyId: string) => {
  const { error } = await session.client
    .from('party_members')
    .delete()
    .eq('party_id', partyId)
    .eq('user_id', session.userId);
  if (error) throw error;
};

const gmOf = async (partyId: string) => {
  const { data, error } = await admin()
    .from('parties')
    .select('gm_id')
    .eq('id', partyId)
    .maybeSingle();
  if (error) throw error;
  return data?.gm_id;
};

const openClaim = async (partyId: string) => {
  const { data, error } = await admin()
    .from('party_gm_claims')
    .select('candidate_id')
    .eq('party_id', partyId)
    .maybeSingle();
  if (error) throw error;
  return data?.candidate_id ?? null;
};

const claim = (session: Session, partyId: string) =>
  session.client.rpc('claim_party_gm', { p_party_id: partyId });

const vote = (session: Session, partyId: string, accept = true) =>
  session.client.rpc('vote_party_gm_claim', { p_party_id: partyId, p_accept: accept });

const cancel = (session: Session, partyId: string) =>
  session.client.rpc('cancel_party_gm_claim', { p_party_id: partyId });

const readsSheet = async (session: Session, characterId: string) => {
  const { data } = await session.client.from('characters').select('id').eq('id', characterId);
  return data?.length === 1;
};

/** A party whose GM's seat is empty, with these sessions as its active players. */
const partyWithoutGm = async (...players: Session[]) => {
  const owner = await createSignedInClient('gm');
  const partyId = await createParty(owner);
  for (const player of players) await addMember(partyId, player.userId, 'active');
  await deleteAccount(owner);
  return partyId;
};

const gmOfFiveParties = async (session: Session) => {
  for (let i = 1; i <= 5; i++) await createParty(session, `Mesa ${i}`);
};

describe('Pedido para virar mestre (Integration)', () => {
  let ana: Session;
  let bia: Session;
  let caio: Session;

  beforeEach(async () => {
    ana = await createSignedInClient('ana');
    bia = await createSignedInClient('bia');
    caio = await createSignedInClient('caio');
  });

  describe('jogador único', () => {
    it('vira mestre na hora, sai dos membros e leva a ficha embora da mesa', async () => {
      const partyId = await partyWithoutGm(ana);
      const characterId = await createCharacter(ana.userId);
      await bring(ana, partyId, characterId);

      const { data, error } = await claim(ana, partyId);

      expect(error).toBeNull();
      expect(data).toBe('approved');
      expect(await gmOf(partyId)).toBe(ana.userId);
      expect(await memberStatus(partyId, ana.userId)).toBeNull();
      expect(await openClaim(partyId)).toBeNull();

      const roster = await admin()
        .from('party_characters')
        .select('character_id')
        .eq('party_id', partyId);
      const sheet = await admin().from('characters').select('id').eq('id', characterId);
      expect(roster.data).toEqual([]);
      expect(sheet.data).toEqual([{ id: characterId }]);
    });
  });

  describe('três jogadores', () => {
    it('com o acordo de todos, quem pediu vira mestre e passa a ler as fichas', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      const biaSheet = await createCharacter(bia.userId);
      const caioSheet = await createCharacter(caio.userId);
      await bring(bia, partyId, biaSheet);
      await bring(caio, partyId, caioSheet);

      expect((await claim(ana, partyId)).data).toBe('pending');
      expect(await readsSheet(ana, biaSheet)).toBe(false);

      expect((await vote(bia, partyId)).data).toBe('pending');
      expect(await gmOf(partyId)).toBeNull();
      expect(await readsSheet(ana, biaSheet)).toBe(false);

      expect((await vote(caio, partyId)).data).toBe('approved');
      expect(await gmOf(partyId)).toBe(ana.userId);
      expect(await memberStatus(partyId, ana.userId)).toBeNull();
      expect(await openClaim(partyId)).toBeNull();
      expect(await readsSheet(ana, biaSheet)).toBe(true);
      expect(await readsSheet(ana, caioSheet)).toBe(true);
    });

    it('um voto sem resposta (null) conta como recusa, não como aceitação', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { data, error } = await bia.client.rpc('vote_party_gm_claim', {
        p_party_id: partyId,
        p_accept: null as unknown as boolean,
      });

      expect(error).toBeNull();
      expect(data).toBe('cancelled');
      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();
    });

    it('uma recusa cancela o pedido, e qualquer um pode pedir de novo', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(caio, partyId);

      const refused = await vote(bia, partyId, false);

      expect(refused.data).toBe('cancelled');
      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();

      expect((await claim(bia, partyId)).data).toBe('pending');
      expect(await openClaim(partyId)).toBe(bia.userId);

      // O voto do pedido anterior não vale para o novo
      expect((await vote(ana, partyId)).data).toBe('pending');
    });
  });

  describe('quem pode pedir', () => {
    it('um segundo pedido falha com party_claim_exists', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { error } = await claim(bia, partyId);

      expect(error?.message).toBe('party_claim_exists');
      expect(await openClaim(partyId)).toBe(ana.userId);
    });

    it('em mesa com mestre falha com party_has_gm', async () => {
      const partyId = await createParty(bia);
      await addMember(partyId, ana.userId, 'active');

      const { error } = await claim(ana, partyId);

      expect(error?.message).toBe('party_has_gm');
    });

    it('quem não é ativo falha com party_not_active_member', async () => {
      const partyId = await partyWithoutGm(ana);
      await addMember(partyId, bia.userId, 'requested');
      await addMember(partyId, caio.userId, 'invited');
      const stranger = await createSignedInClient('stranger');

      for (const session of [bia, caio, stranger]) {
        const { error } = await claim(session, partyId);
        expect(error?.message).toBe('party_not_active_member');
      }
      expect(await openClaim(partyId)).toBeNull();
    });
  });

  describe('limite de 5 mesas', () => {
    it('com 5 mesas, pedir falha com party_gm_limit', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await gmOfFiveParties(ana);

      const { error } = await claim(ana, partyId);

      expect(error?.message).toBe('party_gm_limit');
      expect(await openClaim(partyId)).toBeNull();
    });

    it('jogador único com 5 mesas continua na mesa, sem assumir', async () => {
      const partyId = await partyWithoutGm(ana);
      await gmOfFiveParties(ana);

      const { error } = await claim(ana, partyId);

      expect(error?.message).toBe('party_gm_limit');
      expect(await gmOf(partyId)).toBeNull();
      expect(await memberStatus(partyId, ana.userId)).toBe('active');
    });

    it('quem chegou a 5 depois de pedir tem o pedido cancelado na última aceitação', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);
      await gmOfFiveParties(ana);

      const { data, error } = await vote(caio, partyId);

      expect(error).toBeNull();
      expect(data).toBe('cancelled');
      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();
      expect(await memberStatus(partyId, ana.userId)).toBe('active');
    });

    it('a 5ª mesa ainda pode ser assumida', async () => {
      const partyId = await partyWithoutGm(ana);
      for (let i = 1; i <= 4; i++) await createParty(ana, `Mesa ${i}`);

      expect((await claim(ana, partyId)).data).toBe('approved');
    });
  });

  describe('quem pode votar', () => {
    it('o candidato não vota', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { error } = await vote(ana, partyId);

      expect(error?.message).toBe('party_cannot_vote');
      expect(await gmOf(partyId)).toBeNull();
    });

    it('quem não é ativo não vota', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await addMember(partyId, caio.userId, 'requested');
      await claim(ana, partyId);

      const { error } = await vote(caio, partyId);

      expect(error?.message).toBe('party_cannot_vote');
      expect(await gmOf(partyId)).toBeNull();
    });

    it('votar duas vezes não conta duas', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      const again = await vote(bia, partyId);

      expect(again.error).toBeNull();
      expect(again.data).toBe('pending');
      expect(await gmOf(partyId)).toBeNull();
    });

    it('sem pedido aberto falha com party_claim_not_found', async () => {
      const partyId = await partyWithoutGm(ana, bia);

      const { error } = await vote(bia, partyId);

      expect(error?.message).toBe('party_claim_not_found');
    });
  });

  describe('cancelar', () => {
    it('quem pediu cancela', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { error } = await cancel(ana, partyId);

      expect(error).toBeNull();
      expect(await openClaim(partyId)).toBeNull();
    });

    it('os outros não cancelam', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { error } = await cancel(bia, partyId);

      expect(error?.message).toBe('party_claim_not_found');
      expect(await openClaim(partyId)).toBe(ana.userId);
    });

    it('sem pedido falha com party_claim_not_found', async () => {
      const partyId = await partyWithoutGm(ana, bia);

      const { error } = await cancel(ana, partyId);

      expect(error?.message).toBe('party_claim_not_found');
    });
  });

  describe('reavaliação', () => {
    it('a última pendência saindo da mesa aprova', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      await leave(caio, partyId);

      expect(await gmOf(partyId)).toBe(ana.userId);
      expect(await memberStatus(partyId, ana.userId)).toBeNull();
    });

    it('a última pendência excluindo a conta aprova', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      await deleteAccount(caio);

      expect(await gmOf(partyId)).toBe(ana.userId);
    });

    it('uma pendência saindo com outra ainda em aberto não aprova', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);

      await leave(caio, partyId);

      expect(await gmOf(partyId)).toBeNull();
      expect(await openClaim(partyId)).toBe(ana.userId);
    });

    it('quem já aceitou saindo não aprova: o voto vai junto', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      await leave(bia, partyId);

      expect(await gmOf(partyId)).toBeNull();
      expect(await openClaim(partyId)).toBe(ana.userId);
      expect((await vote(caio, partyId)).data).toBe('approved');
    });

    it('a última pendência saindo com o candidato em 5 mesas cancela', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);
      await gmOfFiveParties(ana);

      await leave(bia, partyId);

      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();
      expect(await memberStatus(partyId, ana.userId)).toBe('active');
    });

    it('o candidato saindo cancela, e a mesa continua', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      await leave(ana, partyId);

      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();
      expect(await memberStatus(partyId, bia.userId)).toBe('active');
    });

    it('o candidato excluindo a conta cancela, e a mesa continua', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      await deleteAccount(ana);

      expect(await openClaim(partyId)).toBeNull();
      expect(await gmOf(partyId)).toBeNull();
      expect(await memberStatus(partyId, bia.userId)).toBe('active');
    });

    it('quem foi convidado desistindo não mexe no pedido', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await addMember(partyId, caio.userId, 'invited');
      await claim(ana, partyId);

      await leave(caio, partyId);

      expect(await openClaim(partyId)).toBe(ana.userId);
      expect(await gmOf(partyId)).toBeNull();
    });
  });

  describe('votos simultâneos', () => {
    it('duas aceitações ao mesmo tempo sempre aprovam', async () => {
      const owner = await createSignedInClient('gm');

      for (let i = 0; i < 10; i++) {
        const candidate = await createSignedInClient('candidate');
        const partyId = await createParty(owner, `Mesa ${i}`);
        await addMember(partyId, candidate.userId, 'active');
        await addMember(partyId, bia.userId, 'active');
        await addMember(partyId, caio.userId, 'active');
        const orphaned = await admin().from('parties').update({ gm_id: null }).eq('id', partyId);
        expect(orphaned.error).toBeNull();
        await claim(candidate, partyId);

        const results = await Promise.all([vote(bia, partyId), vote(caio, partyId)]);

        expect(results.map((r) => r.error)).toEqual([null, null]);
        expect(results.map((r) => r.data).sort()).toEqual(['approved', 'pending']);
        expect(await gmOf(partyId)).toBe(candidate.userId);
      }
    });
  });

  describe('uma exclusão com vários papéis', () => {
    it('deixa a 1 sem mestre, cancela a 2 e aprova a 3', async () => {
      const first = await createParty(ana, 'Mesa 1');
      await addMember(first, bia.userId, 'active');

      const second = await partyWithoutGm(ana, bia);
      await claim(ana, second);

      const third = await partyWithoutGm(ana, caio);
      await claim(caio, third);

      await deleteAccount(ana);

      expect(await gmOf(first)).toBeNull();
      expect(await memberStatus(first, bia.userId)).toBe('active');

      expect(await openClaim(second)).toBeNull();
      expect(await gmOf(second)).toBeNull();
      expect(await memberStatus(second, bia.userId)).toBe('active');

      expect(await gmOf(third)).toBe(caio.userId);
      expect(await memberStatus(third, caio.userId)).toBeNull();
    });
  });

  describe('sem acesso direto', () => {
    it('authenticated não lê nem escreve nas tabelas', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const reads = await Promise.all([
        ana.client.from('party_gm_claims').select('party_id'),
        ana.client.from('party_gm_claim_votes').select('party_id'),
      ]);
      const writes = await Promise.all([
        bia.client.from('party_gm_claims').insert({ party_id: partyId, candidate_id: bia.userId }),
        bia.client.from('party_gm_claim_votes').insert({ party_id: partyId, user_id: bia.userId }),
        ana.client.from('party_gm_claims').delete().eq('party_id', partyId),
      ]);

      for (const { error } of [...reads, ...writes]) expect(error?.code).toBe('42501');
      expect(await openClaim(partyId)).toBe(ana.userId);
    });
  });

  describe('party_gm_claim', () => {
    it('mostra o candidato e quem falta responder, sem e-mail', async () => {
      const name = `ana_${crypto.randomUUID().slice(0, 8)}`;
      await chooseUsername(ana.userId, name);
      const partyId = await partyWithoutGm(ana, bia, caio);
      await addMember(partyId, (await createSignedInClient('asking')).userId, 'requested');
      await claim(ana, partyId);
      await vote(bia, partyId);

      const { data, error } = await bia.client.rpc('party_gm_claim', { p_party_id: partyId });

      expect(error).toBeNull();
      expect(data).toEqual([
        {
          candidate_id: ana.userId,
          candidate_username: name,
          created_at: expect.any(String),
          pending_user_ids: [caio.userId],
        },
      ]);
      expect(JSON.stringify(data)).not.toContain('@');
    });

    it('nome não escolhido não aparece', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const { data } = await bia.client.rpc('party_gm_claim', { p_party_id: partyId });

      expect(data?.[0].candidate_username).toBeNull();
    });

    it('sem pedido não traz linhas', async () => {
      const partyId = await partyWithoutGm(ana, bia);

      const { data, error } = await ana.client.rpc('party_gm_claim', { p_party_id: partyId });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('não responde a quem não é ativo', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await addMember(partyId, caio.userId, 'requested');
      await claim(ana, partyId);
      const stranger = await createSignedInClient('stranger');

      for (const session of [caio, stranger]) {
        const { data } = await session.client.rpc('party_gm_claim', { p_party_id: partyId });
        expect(data).toEqual([]);
      }
    });
  });

  describe('suporte', () => {
    const emailOf = async (session: Session) => {
      const { data, error } = await admin().auth.admin.getUserById(session.userId);
      if (error) throw error;
      return data.user.email;
    };

    const removeAsSupport = (partyId: string, session: Session) =>
      admin().rpc('support_remove_unresponsive_member', {
        p_party_id: partyId,
        p_user_id: session.userId,
      });

    it('authenticated não executa as funções de suporte', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);

      const read = await ana.client.rpc('support_party_gm_claim', { p_party_id: partyId });
      const removed = await ana.client.rpc('support_remove_unresponsive_member', {
        p_party_id: partyId,
        p_user_id: bia.userId,
      });

      expect(read.error?.code).toBe('42501');
      expect(removed.error?.code).toBe('42501');
      expect(await memberStatus(partyId, bia.userId)).toBe('active');
    });

    it('lista quem falta responder, com o e-mail', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);
      await vote(bia, partyId);

      const { data, error } = await admin().rpc('support_party_gm_claim', { p_party_id: partyId });

      expect(error).toBeNull();
      expect(data).toEqual([
        {
          candidate_id: ana.userId,
          created_at: expect.any(String),
          pending_user_id: caio.userId,
          pending_email: await emailOf(caio),
        },
      ]);
    });

    it('tirar a última pendência aprova e deixa a ficha dela fora da leitura', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      const biaSheet = await createCharacter(bia.userId);
      const caioSheet = await createCharacter(caio.userId);
      await bring(bia, partyId, biaSheet);
      await bring(caio, partyId, caioSheet);
      await claim(ana, partyId);
      await vote(bia, partyId);

      const { data, error } = await removeAsSupport(partyId, caio);

      expect(error).toBeNull();
      expect(data).toBe('approved');
      expect(await gmOf(partyId)).toBe(ana.userId);
      expect(await memberStatus(partyId, caio.userId)).toBeNull();
      expect(await readsSheet(ana, biaSheet)).toBe(true);
      expect(await readsSheet(ana, caioSheet)).toBe(false);
      expect((await admin().from('characters').select('id').eq('id', caioSheet)).data).toEqual([
        { id: caioSheet },
      ]);
    });

    it('tirar uma pendência com outra em aberto devolve pending', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      await claim(ana, partyId);

      const { data } = await removeAsSupport(partyId, caio);

      expect(data).toBe('pending');
      expect(await openClaim(partyId)).toBe(ana.userId);
    });

    it('tirar a última pendência com o candidato em 5 mesas devolve cancelled', async () => {
      const partyId = await partyWithoutGm(ana, bia);
      await claim(ana, partyId);
      await gmOfFiveParties(ana);

      const { data } = await removeAsSupport(partyId, bia);

      expect(data).toBe('cancelled');
      expect(await gmOf(partyId)).toBeNull();
    });

    it('tirar quem não está pendente falha com party_cannot_vote', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      const stranger = await createSignedInClient('stranger');
      await addMember(partyId, stranger.userId, 'requested');
      await claim(ana, partyId);
      await vote(bia, partyId);

      for (const session of [ana, bia, stranger]) {
        const { error } = await removeAsSupport(partyId, session);
        expect(error?.message).toBe('party_cannot_vote');
      }
      expect(await memberStatus(partyId, bia.userId)).toBe('active');
      expect(await memberStatus(partyId, stranger.userId)).toBe('requested');
    });

    it('sem pedido falha com party_claim_not_found', async () => {
      const partyId = await partyWithoutGm(ana, bia);

      const { error } = await removeAsSupport(partyId, bia);

      expect(error?.message).toBe('party_claim_not_found');
      expect(await memberStatus(partyId, bia.userId)).toBe('active');
    });
  });

  describe('pelo repositório', () => {
    it('lê o pedido (nome nulo de quem não escolheu) e traduz os erros do banco', async () => {
      const partyId = await partyWithoutGm(ana, bia, caio);
      const asAna = new SupabasePartyRepository(ana.client);
      const asBia = new SupabasePartyRepository(bia.client);

      expect((await asAna.findParty(partyId))?.gmId).toBeNull();
      expect(await asAna.gmClaim(partyId)).toBeNull();
      expect(await asAna.claimGm(partyId)).toBe('pending');

      const open = await asBia.gmClaim(partyId);
      expect(open).toMatchObject({ candidateId: ana.userId, candidateUsername: null });
      expect(open?.pendingUserIds.toSorted()).toEqual([bia.userId, caio.userId].toSorted());

      await expect(asBia.claimGm(partyId)).rejects.toMatchObject({
        message: PartyErrorCodes.CLAIM_EXISTS,
      });
      await expect(asAna.voteGmClaim(partyId, true)).rejects.toMatchObject({
        message: PartyErrorCodes.CANNOT_VOTE,
      });
      expect(await asBia.voteGmClaim(partyId, false)).toBe('cancelled');
      await expect(asAna.cancelGmClaim(partyId)).rejects.toMatchObject({
        message: PartyErrorCodes.CLAIM_NOT_FOUND,
      });
    });
  });
});
