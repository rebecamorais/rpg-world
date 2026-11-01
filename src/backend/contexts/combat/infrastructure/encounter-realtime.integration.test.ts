import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  addMember,
  addParticipant,
  bring,
  createCharacter,
  createEncounter,
  createNpc,
  createParty,
} from '../../../../../test/helpers/parties';
import { listen, waitFor } from '../../../../../test/helpers/realtime';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

// Every change to a party's combat sends an empty "encounter" broadcast to `party:<id>`, which only
// the GM and active members may listen to. The app then fetches its own view through the API.
describe('Combate em tempo real (Integration)', () => {
  let gm: Session;
  let player: Session;
  let stranger: Session;
  let partyId: string;
  let heroId: string;
  let goblin: string;
  const sessions: Session[] = [];

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    player = await createSignedInClient('player');
    stranger = await createSignedInClient('stranger');
    sessions.push(gm, player, stranger);
    partyId = await createParty(gm);
    await addMember(partyId, player.userId, 'active');
    heroId = await createCharacter(player.userId, { name: 'Arani' });
    await bring(player, partyId, heroId);
    await createEncounter(gm, partyId);
    await addParticipant(gm, partyId, heroId, 'player');
    goblin = await addParticipant(gm, partyId, await createNpc(gm.userId), 'enemy');
  });

  afterEach(async () => {
    await Promise.all(sessions.splice(0).map((s) => s.client.removeAllChannels()));
  });

  it('o mestre e o jogador ativo assinam; o estranho e quem só pediu recebem CHANNEL_ERROR', async () => {
    const asking = await createSignedInClient('asking');
    sessions.push(asking);
    await addMember(partyId, asking.userId, 'requested');

    expect((await listen(gm.client, partyId)).status).toBe('SUBSCRIBED');
    expect((await listen(player.client, partyId)).status).toBe('SUBSCRIBED');
    expect((await listen(stranger.client, partyId)).status).toBe('CHANNEL_ERROR');
    expect((await listen(asking.client, partyId)).status).toBe('CHANNEL_ERROR');
  });

  it('mudar a iniciativa avisa o tópico da mesa, e o payload não tem nada além de id', async () => {
    const asGm = await listen(gm.client, partyId);
    const asPlayer = await listen(player.client, partyId);

    await gm.client.from('encounter_participants').update({ initiative: 12 }).eq('id', goblin);

    expect(await waitFor(asGm.messages, 1)).toBeGreaterThan(0);
    expect(await waitFor(asPlayer.messages, 1)).toBeGreaterThan(0);
    for (const { payload } of [...asGm.messages, ...asPlayer.messages]) {
      expect(Object.keys(payload).filter((key) => key !== 'id')).toEqual([]);
    }
  });

  it('o jogador salvar a ficha avisa as mesas em que ela está no combate', async () => {
    const asGm = await listen(gm.client, partyId);

    await player.client.from('characters').update({ hp_current: 3 }).eq('id', heroId);

    expect(await waitFor(asGm.messages, 1)).toBeGreaterThan(0);
  });

  it('um jogador enviando broadcast pelo cliente não chega ao mestre', async () => {
    const asGm = await listen(gm.client, partyId);
    const asPlayer = await listen(player.client, partyId);

    await asPlayer.channel.send({ type: 'broadcast', event: 'encounter', payload: { hp: 99 } });

    expect(await waitFor(asGm.messages, 1, 1500)).toBe(0);
  });

  it('quem sai da mesa não consegue assinar de novo', async () => {
    const first = await listen(player.client, partyId);
    expect(first.status).toBe('SUBSCRIBED');
    await player.client.removeChannel(first.channel);

    await player.client
      .from('party_members')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', player.userId);

    expect((await listen(player.client, partyId)).status).toBe('CHANNEL_ERROR');
  });
});
