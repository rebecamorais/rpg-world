import { beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { addMember, createParty } from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

const admin = () => SupabaseFactory.createAdmin();

const DOC = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab';
const OTHER_DOC = '1ZyXwVuTsRqPoNmLkJiHgFeDcBa_9876543210-zy';

describe('RLS do diário da mesa (Integration)', () => {
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

  const setJournal = (session: Session, docId = DOC) =>
    session.client
      .from('party_journals')
      .insert({ party_id: partyId, doc_id: docId })
      .select('doc_id');

  const readJournal = (session: Session) =>
    session.client.from('party_journals').select('doc_id').eq('party_id', partyId);

  it('o mestre grava, troca e apaga o diário', async () => {
    const created = await setJournal(gm);
    expect(created.error).toBeNull();
    expect(created.data).toEqual([{ doc_id: DOC }]);

    const updated = await gm.client
      .from('party_journals')
      .update({ doc_id: OTHER_DOC })
      .eq('party_id', partyId)
      .select('doc_id');
    expect(updated.data).toEqual([{ doc_id: OTHER_DOC }]);

    const deleted = await gm.client
      .from('party_journals')
      .delete()
      .eq('party_id', partyId)
      .select('party_id');
    expect(deleted.data).toHaveLength(1);
  });

  it('jogador ativo lê, mas não grava', async () => {
    await setJournal(gm);
    await addMember(partyId, player.userId, 'active');

    const { data } = await readJournal(player);
    expect(data).toEqual([{ doc_id: DOC }]);

    // Limpa a linha para o insert abaixo não falhar só por chave duplicada
    await admin().from('party_journals').delete().eq('party_id', partyId);
    const insert = await player.client
      .from('party_journals')
      .insert({ party_id: partyId, doc_id: OTHER_DOC })
      .select('doc_id');
    expect(insert.error !== null || (insert.data ?? []).length === 0).toBe(true);

    await setJournal(gm);
    const update = await player.client
      .from('party_journals')
      .update({ doc_id: OTHER_DOC })
      .eq('party_id', partyId)
      .select('doc_id');
    expect(update.error !== null || (update.data ?? []).length === 0).toBe(true);

    const { data: after } = await admin()
      .from('party_journals')
      .select('doc_id')
      .eq('party_id', partyId);
    expect(after).toEqual([{ doc_id: DOC }]);
  });

  it('jogador ativo não apaga o diário', async () => {
    await setJournal(gm);
    await addMember(partyId, player.userId, 'active');

    const del = await player.client
      .from('party_journals')
      .delete()
      .eq('party_id', partyId)
      .select('party_id');
    expect(del.error !== null || (del.data ?? []).length === 0).toBe(true);

    const { data } = await admin().from('party_journals').select('doc_id').eq('party_id', partyId);
    expect(data).toEqual([{ doc_id: DOC }]);
  });

  it('convidado, quem pediu e estranho não leem', async () => {
    await setJournal(gm);
    await addMember(partyId, player.userId, 'invited');
    expect((await readJournal(player)).data).toEqual([]);

    await admin().from('party_members').delete().eq('party_id', partyId);
    await addMember(partyId, player.userId, 'requested');
    expect((await readJournal(player)).data).toEqual([]);

    expect((await readJournal(stranger)).data).toEqual([]);
  });

  it('quem sai da mesa deixa de ler', async () => {
    await setJournal(gm);
    await addMember(partyId, player.userId, 'active');
    expect((await readJournal(player)).data).toEqual([{ doc_id: DOC }]);

    await admin()
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', player.userId);
    expect((await readJournal(player)).data).toEqual([]);
  });

  it('doc_id fora do formato é recusado', async () => {
    for (const docId of ['curto', 'tem espaço aaaaaaaaaaaaaaaaaaaa']) {
      const { error } = await setJournal(gm, docId);
      expect(error, docId).not.toBeNull();
    }
  });

  it('apagar a mesa apaga o diário', async () => {
    await setJournal(gm);
    await gm.client.from('parties').delete().eq('id', partyId);

    const { data } = await admin()
      .from('party_journals')
      .select('party_id')
      .eq('party_id', partyId);
    expect(data).toEqual([]);
  });
});
