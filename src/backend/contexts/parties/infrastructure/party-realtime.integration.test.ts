import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import {
  addMember,
  bring,
  createCharacter,
  createParty,
  inviteCode,
} from '../../../../../test/helpers/parties';
import { untilNotified, waitFor } from '../../../../../test/helpers/realtime';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;
type Message = { event: string; payload: Record<string, unknown> };

const admin = () => SupabaseFactory.createAdmin();

/**
 * The party's private channel, as usePartyChannel subscribes to it, collecting the "party" and
 * "chest" notices apart. Retries while Realtime is still starting (CHANNEL_ERROR on the first try).
 */
async function listenTo(client: SupabaseClient, partyId: string, ms = 20000) {
  const deadline = Date.now() + ms;
  for (;;) {
    await client.realtime.setAuth();
    const party: Message[] = [];
    const chest: Message[] = [];
    const channel = client
      .channel(`party:${partyId}`, { config: { private: true } })
      .on('broadcast', { event: 'party' }, (m) => party.push(m as unknown as Message))
      .on('broadcast', { event: 'chest' }, (m) => chest.push(m as unknown as Message));
    const status = await new Promise<string>((resolve) => channel.subscribe((s) => resolve(s)));
    if (status === 'SUBSCRIBED' || Date.now() >= deadline) return { status, party, chest };
    await client.removeChannel(channel);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Waits until `messages` hears the party's rename, then empties it: a freshly started Realtime may
 * answer SUBSCRIBED before it reads the database's notices, and a rename can be repeated.
 */
async function warmedUp(gm: Session, partyId: string, messages: Message[]) {
  let n = 0;
  await untilNotified(messages, async () => {
    n += 1;
    const { error } = await gm.client
      .from('parties')
      .update({ name: `Mesa ${n}` })
      .eq('id', partyId);
    if (error) throw error;
  });
  // Late duplicates of the warm-up notice land before the test's own change
  await new Promise((resolve) => setTimeout(resolve, 300));
  messages.length = 0;
}

const onlyId = (messages: Message[]) =>
  messages.flatMap(({ payload }) => Object.keys(payload).filter((key) => key !== 'id'));

// The party tab and the chest: every change the GM and the players should see without reloading
// sends an empty notice to `party:<id>`, and the app fetches its own view again
describe('Mesa e baú em tempo real (Integration)', () => {
  let gm: Session;
  let player: Session;
  let partyId: string;
  const sessions: Session[] = [];

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    sessions.push(gm, player);
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
  });

  afterEach(async () => {
    await Promise.all(sessions.splice(0).map((s) => s.client.removeAllChannels()));
  });

  it('um pedido novo e a aprovação avisam o mestre, sem nada além de id no payload', async () => {
    const asking = await createSignedInClient('asking');
    sessions.push(asking);
    const code = await inviteCode(partyId);
    const asGm = await listenTo(gm.client, partyId);
    expect(asGm.status).toBe('SUBSCRIBED');
    await warmedUp(gm, partyId, asGm.party);

    const asked = await asking.client.rpc('request_party_join', { p_code: code });
    expect(asked.error).toBeNull();
    expect(await waitFor(asGm.party, 1)).toBeGreaterThan(0);

    asGm.party.length = 0;
    const { error } = await gm.client
      .from('party_members')
      .update({ status: 'active' })
      .eq('party_id', partyId)
      .eq('user_id', asking.userId);
    expect(error).toBeNull();
    expect(await waitFor(asGm.party, 1)).toBeGreaterThan(0);
    expect(onlyId(asGm.party)).toEqual([]);
  });

  it('o jogador levar um personagem e renomeá-lo avisa o mestre; mudar o PV não', async () => {
    const asGm = await listenTo(gm.client, partyId);
    const heroId = await createCharacter(player.userId, { name: 'Arani' });
    await warmedUp(gm, partyId, asGm.party);

    await bring(player, partyId, heroId);
    expect(await waitFor(asGm.party, 1)).toBeGreaterThan(0);

    // HP changes every turn; the party tab doesn't show it (the combat has its own notice)
    await new Promise((resolve) => setTimeout(resolve, 300));
    asGm.party.length = 0;
    const hp = await player.client.from('characters').update({ hp_current: 3 }).eq('id', heroId);
    expect(hp.error).toBeNull();
    expect(await waitFor(asGm.party, 1, 1500)).toBe(0);

    const renamed = await player.client
      .from('characters')
      .update({ name: 'Arani, a Sábia' })
      .eq('id', heroId);
    expect(renamed.error).toBeNull();
    expect(await waitFor(asGm.party, 1)).toBeGreaterThan(0);
  });

  it('a história do personagem não avisa a mesa; os ideais sim', async () => {
    const asGm = await listenTo(gm.client, partyId);
    const heroId = await createCharacter(player.userId, { name: 'Arani' });
    await bring(player, partyId, heroId);
    const created = await admin().from('character_lore').insert({ character_id: heroId });
    expect(created.error).toBeNull();
    await warmedUp(gm, partyId, asGm.party);

    // Saved while the player writes; the party tab doesn't show it
    const story = await player.client
      .from('character_lore')
      .update({ backstory: 'Nasceu numa vila à beira do rio.' })
      .eq('character_id', heroId);
    expect(story.error).toBeNull();
    expect(await waitFor(asGm.party, 1, 1500)).toBe(0);

    const ideals = await player.client
      .from('character_lore')
      .update({ ideals: 'Liberdade.' })
      .eq('character_id', heroId);
    expect(ideals.error).toBeNull();
    expect(await waitFor(asGm.party, 1)).toBeGreaterThan(0);
  });

  it('o mestre tirar o jogador avisa quem estava com a mesa aberta', async () => {
    const asPlayer = await listenTo(player.client, partyId);
    expect(asPlayer.status).toBe('SUBSCRIBED');

    await warmedUp(gm, partyId, asPlayer.party);

    // Heard on the subscription made while still a member
    const { error } = await gm.client
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', player.userId);
    expect(error).toBeNull();

    expect(await waitFor(asPlayer.party, 1)).toBeGreaterThan(0);
  });

  it('moedas e itens do baú avisam com "chest"', async () => {
    const asPlayer = await listenTo(player.client, partyId);
    const { data: chest, error } = await admin()
      .from('containers')
      .select('id')
      .eq('party_id', partyId)
      .eq('kind', 'party_chest')
      .single();
    expect(error).toBeNull();

    let gold = 0;
    expect(
      await untilNotified(asPlayer.chest, async () => {
        gold += 1;
        const { error: coinsError } = await gm.client
          .from('containers')
          .update({ coins: { cp: 0, sp: 0, ep: 0, gp: gold, pp: 0 } })
          .eq('id', chest!.id);
        if (coinsError) throw coinsError;
      }),
    ).toBeGreaterThan(0);

    asPlayer.chest.length = 0;
    const { error: itemError } = await admin()
      .from('inventory_items')
      .insert({ container_id: chest!.id, item_ref: 'dnd5e:srd-5.1:item:rope-hempen', quantity: 1 });
    expect(itemError).toBeNull();
    expect(await waitFor(asPlayer.chest, 1)).toBeGreaterThan(0);
    expect(onlyId(asPlayer.chest)).toEqual([]);
  });

  it('um item que sai do baú para a mochila de um personagem avisa a mesa', async () => {
    const asPlayer = await listenTo(player.client, partyId);
    const heroId = await createCharacter(player.userId);
    const { data: containers, error } = await admin()
      .from('containers')
      .select('id, kind')
      .or(`party_id.eq.${partyId},character_id.eq.${heroId}`);
    expect(error).toBeNull();
    const chestId = containers!.find((c) => c.kind === 'party_chest')!.id;
    const backpackId = containers!.find((c) => c.kind === 'backpack')!.id;
    const { data: item, error: itemError } = await admin()
      .from('inventory_items')
      .insert({ container_id: chestId, item_ref: 'dnd5e:srd-5.1:item:rope-hempen', quantity: 1 })
      .select('id')
      .single();
    expect(itemError).toBeNull();
    await warmedUp(gm, partyId, asPlayer.party);
    asPlayer.chest.length = 0;

    const moved = await admin()
      .from('inventory_items')
      .update({ container_id: backpackId })
      .eq('id', item!.id);
    expect(moved.error).toBeNull();
    expect(await waitFor(asPlayer.chest, 1)).toBeGreaterThan(0);
  });
});

// The person whose request the GM declined sees so on the invite page, instead of the same
// "Ask to join" as if nothing had happened
describe('Pedido recusado (Integration)', () => {
  let gm: Session;
  let asking: Session;
  let partyId: string;
  let code: string;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    asking = await createSignedInClient('asking');
    partyId = await createParty(gm);
    code = await inviteCode(partyId);
  });

  const myStatus = async () => {
    const { data, error } = await asking.client.rpc('get_party_invite', { p_code: code });
    if (error) throw error;
    return data[0]?.my_status ?? null;
  };
  const request = async () => {
    const { error } = await asking.client.rpc('request_party_join', { p_code: code });
    if (error) throw error;
  };
  const deleteRow = (by: Session) =>
    by.client.from('party_members').delete().eq('party_id', partyId).eq('user_id', asking.userId);

  it('o mestre recusar dá declined; pedir de novo volta a requested', async () => {
    await request();
    expect((await deleteRow(gm)).error).toBeNull();
    expect(await myStatus()).toBe('declined');

    await request();
    expect(await myStatus()).toBe('requested');
  });

  // Changing the link drops the pending requests (trg_party_invites_drop_requests); nobody declined
  it('o mestre trocar o link não conta como recusa', async () => {
    await request();
    const newCode = crypto.randomUUID().replaceAll('-', '');
    const { error } = await gm.client
      .from('party_invites')
      .update({ code: newCode })
      .eq('party_id', partyId);
    expect(error).toBeNull();
    code = newCode;
    expect(await myStatus()).toBeNull();
  });

  it('desistir do próprio pedido não conta como recusa', async () => {
    await request();
    expect((await deleteRow(asking)).error).toBeNull();
    expect(await myStatus()).toBeNull();
  });

  it('cancelar um convite não conta como recusa, e o convite apaga uma recusa antiga', async () => {
    await request();
    await deleteRow(gm);
    expect(await myStatus()).toBe('declined');

    await admin()
      .from('party_members')
      .insert({ party_id: partyId, user_id: asking.userId, status: 'invited' });
    expect(await myStatus()).toBe('invited');

    await deleteRow(gm);
    expect(await myStatus()).toBeNull();
  });

  it('o mestre apagar a mesa com um pedido pendente funciona', async () => {
    await request();
    const { error } = await gm.client.from('parties').delete().eq('id', partyId);
    expect(error).toBeNull();
    const { data } = await admin().from('parties').select('id').eq('id', partyId);
    expect(data).toEqual([]);
  });

  it('a recusa não aparece para outra pessoa nem é lida direto pela API', async () => {
    const other = await createSignedInClient('other');
    await request();
    await deleteRow(gm);

    const { data } = await other.client.rpc('get_party_invite', { p_code: code });
    expect(data?.[0].my_status).toBeNull();
    const direct = await (asking.client as unknown as SupabaseClient)
      .schema('private')
      .from('party_declined_requests')
      .select('*');
    expect(direct.data ?? []).toEqual([]);
  });
});
