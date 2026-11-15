import type { Page } from '@playwright/test';

import {
  bring,
  createCharacter,
  createParty,
  expect,
  hydrated,
  joinParty,
  partyUrl,
  person,
  test,
} from './support/fixtures';
import { adminClient } from './support/supabase';

// Causa 1 da fase 2 (mesa-sem-tempo-real): the party tab and the chest keep up with what the
// others do, on two browsers and without reloading. The invite page, whose person isn't a member
// yet and can't listen to the party's channel, asks again every 20 s.
const INVITE_POLL = { timeout: 30_000 };

/**
 * Resolves once `page` has joined the party's channel (Realtime's ok reply to the join). Set up
 * before opening the page. Only a member may join: a change that removes them must come after.
 */
function channelJoined(page: Page, partyId: string) {
  return new Promise<void>((resolve) => {
    page.on('websocket', (ws) =>
      ws.on('framereceived', ({ payload }) => {
        const frame = String(payload);
        if (
          frame.includes(`realtime:party:${partyId}`) &&
          frame.includes('phx_reply') &&
          frame.includes('"ok"')
        ) {
          resolve();
        }
      }),
    );
  });
}

test.describe('mesa em tempo real', () => {
  test('o pedido chega ao mestre e a aprovação leva a jogadora à mesa, sem recarregar', async ({
    page,
    browser,
    user: _,
  }) => {
    test.setTimeout(90_000);
    const { id: partyId, code } = await createParty(page, 'Mesa ao Vivo');
    await page.goto(partyUrl(partyId));
    await hydrated(page.getByRole('main').getByRole('link', { name: 'Manage' }));

    const player = await person(browser, 'live-asker');
    await player.page.goto(`/parties/join/${code}`);
    await (await hydrated(player.page.getByRole('button', { name: 'Ask to join' }))).click();
    await expect(player.page.getByRole('status').filter({ hasText: 'Request sent' })).toBeVisible();

    // The GM's page, open since before the request
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);

    await expect(player.page.getByText('Your request was approved.')).toBeVisible(INVITE_POLL);
    await expect.poll(() => new URL(player.page.url()).pathname).toBe(partyUrl(partyId));

    await player.context.close();
  });

  test('o mestre recusa: a jogadora vê que foi recusado, também ao voltar ao convite', async ({
    page,
    browser,
    user: _,
  }) => {
    test.setTimeout(90_000);
    const { id: partyId, code } = await createParty(page, 'Mesa Fechada');
    const player = await person(browser, 'declined-asker');
    await player.page.goto(`/parties/join/${code}`);
    await (await hydrated(player.page.getByRole('button', { name: 'Ask to join' }))).click();
    await expect(player.page.getByRole('status').filter({ hasText: 'Request sent' })).toBeVisible();

    const declined = await page.request.delete(`/api/parties/${partyId}/members/${player.user.id}`);
    expect(declined.status()).toBe(204);

    const notice = player.page.getByText('Your request to join was declined.');
    await expect(notice).toBeVisible(INVITE_POLL);
    await player.page.reload();
    await expect(notice).toBeVisible();
    await expect(player.page.getByRole('button', { name: 'Ask again' })).toBeVisible();

    await player.context.close();
  });

  test('o personagem que a jogadora leva aparece para o mestre, sem recarregar', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa do Roster');
    const player = await person(browser, 'live-roster');
    await joinParty(page, player.page, player.user.id, partyId, code);
    const characterId = await createCharacter(player.page, 'Arani Ao Vivo');

    // Joined before the change: otherwise the refetch on SUBSCRIBED alone would bring it
    const joined = channelJoined(page, partyId);
    await page.goto(partyUrl(partyId));
    await hydrated(page.getByRole('main').getByRole('link', { name: 'Manage' }));
    await expect(page.getByText('Arani Ao Vivo')).toHaveCount(0);
    await joined;

    await bring(player.page, partyId, [characterId]);

    await expect(page.getByText('Arani Ao Vivo').first()).toBeVisible();

    await player.context.close();
  });

  test('a jogadora tirada pelo mestre é avisada e vai para a lista de mesas', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa da Saída');
    const player = await person(browser, 'live-removed');
    await joinParty(page, player.page, player.user.id, partyId, code);

    const joined = channelJoined(player.page, partyId);
    await player.page.goto(partyUrl(partyId));
    await hydrated(player.page.getByRole('button', { name: 'My place in the party' }));
    await joined;

    const removed = await page.request.delete(`/api/parties/${partyId}/members/${player.user.id}`);
    expect(removed.status()).toBe(204);

    await expect(player.page.getByText("You're no longer in this party.")).toBeVisible();
    await expect.poll(() => new URL(player.page.url()).pathname).toBe('/parties');

    await player.context.close();
  });

  test('as moedas do baú mudam na tela da jogadora, sem recarregar', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa do Baú ao Vivo');
    const player = await person(browser, 'live-chest');
    await joinParty(page, player.page, player.user.id, partyId, code);

    const joined = channelJoined(player.page, partyId);
    await player.page.goto(partyUrl(partyId, '/inventory'));
    const gold = player.page.getByRole('textbox', { name: 'Gold pieces' });
    await expect(gold).toHaveValue('0');
    await joined;

    // The GM's change, made elsewhere
    const { error } = await adminClient()
      .from('containers')
      .update({ coins: { cp: 0, sp: 0, ep: 0, gp: 40, pp: 0 } })
      .eq('party_id', partyId)
      .eq('kind', 'party_chest');
    expect(error).toBeNull();

    await expect(gold).toHaveValue('40');

    await player.context.close();
  });
});
