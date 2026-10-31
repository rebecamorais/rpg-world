import type { Browser, Page } from '@playwright/test';

import {
  createCharacter,
  createParty,
  expect,
  hydrated,
  partyUrl,
  signIn,
  test,
} from './support/fixtures';
import { PASSWORD, type TestUser, adminClient, createUser } from './support/supabase';

/** Another person, signed in on their own browser context (separate cookies). */
async function person(browser: Browser, label: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = await createUser(label);
  await signIn(page, user);
  return { context, page, user };
}

async function usernameOf(user: TestUser) {
  const { data } = await adminClient()
    .from('profile')
    .select('username')
    .eq('id', user.id)
    .single();
  return data!.username as string;
}

/** Through the API: asks with the link and the GM approves. */
async function joinParty(gm: Page, player: Page, playerId: string, partyId: string, code: string) {
  expect((await player.request.post(`/api/parties/join/${code}`)).ok()).toBe(true);
  expect((await gm.request.patch(`/api/parties/${partyId}/members/${playerId}`)).status()).toBe(
    204,
  );
}

async function bring(player: Page, partyId: string, characterIds: string[]) {
  const res = await player.request.put(`/api/parties/${partyId}/my-characters`, {
    data: { characterIds },
  });
  expect(res.status()).toBe(204);
}

test.describe('mesas', () => {
  test('jogador entra pelo link e o mestre aprova', async ({ page, browser, user: _ }) => {
    const { id: partyId } = await createParty(page, 'Mesa de Quinta');
    await page.goto(partyUrl(partyId));
    // The origin is filled in once the page hydrates (the server doesn't know it)
    const linkField = await hydrated(page.getByLabel('Invite link'));
    await expect(linkField).toHaveValue(/^http.*\/parties\/join\/[a-f0-9]{32}$/);
    const link = await linkField.inputValue();

    const player = await person(browser, 'link-player');
    await createCharacter(player.page, 'Arani');
    await player.page.goto(new URL(link).pathname);
    await (await hydrated(player.page.getByRole('button', { name: 'Ask to join' }))).click();
    await expect(player.page.getByRole('status').filter({ hasText: 'Request sent' })).toBeVisible();

    await page.reload();
    await (await hydrated(page.getByRole('button', { name: 'Approve' }))).click();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);

    await player.page.goto('/parties');
    const asPlayer = player.page.getByRole('region', { name: 'As player' });
    await asPlayer.getByRole('link', { name: 'Mesa de Quinta' }).click();
    await expect.poll(() => new URL(player.page.url()).pathname).toBe(partyUrl(partyId));
    await (await hydrated(player.page.getByRole('checkbox', { name: /Arani/ }))).check();
    await player.page.getByRole('button', { name: 'Save' }).click();
    await expect(player.page.getByText('Characters updated')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Passive Perception')).toBeVisible();
    await page.getByRole('link', { name: /Arani/ }).click();
    await expect(page.getByText('Read only')).toBeVisible();
    await expect(page.getByLabel('AC', { exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0);

    await page.getByRole('complementary').getByRole('link', { name: 'Lore' }).click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/parties\/.+\/lore$/);
    await expect(page.getByText('Read only')).toBeVisible();

    await player.context.close();
  });

  test('convite por username com aceite', async ({ page, browser, user: _ }) => {
    const { id: partyId } = await createParty(page, 'Mesa do Convite');
    const player = await person(browser, 'invited-player');

    await page.goto(partyUrl(partyId));
    await (
      await hydrated(page.getByLabel('Invite by username'))
    ).fill(`@${await usernameOf(player.user)}`);
    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    await expect(page.getByText('Invite sent')).toBeVisible();

    await player.page.goto('/parties');
    const invites = player.page.getByRole('region', { name: 'Invitations' });
    await (await hydrated(invites.getByRole('button', { name: 'Accept' }))).click();
    await expect(
      player.page.getByRole('region', { name: 'As player' }).getByRole('link', {
        name: 'Mesa do Convite',
      }),
    ).toBeVisible();

    await player.context.close();
  });

  test('deslogado abre o link, entra e volta ao convite', async ({ page, browser, user: _ }) => {
    const { code } = await createParty(page, 'Mesa Aberta');
    const context = await browser.newContext();
    const visitor = await context.newPage();
    const user = await createUser('signed-out');

    await visitor.goto(`/parties/join/${code}`);
    await expect.poll(() => new URL(visitor.url()).pathname).toBe('/login');
    await (await hydrated(visitor.getByLabel('Email'))).fill(user.email);
    await visitor.getByLabel('Password').fill(PASSWORD);
    await visitor.getByRole('button', { name: 'Sign In' }).click();

    await expect.poll(() => new URL(visitor.url()).pathname).toBe(`/parties/join/${code}`);
    await expect(visitor.getByText('Mesa Aberta')).toBeVisible();

    await context.close();
  });

  test('link trocado não serve mais', async ({ page, browser, user: _ }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa Trocada');
    expect((await page.request.post(`/api/parties/${partyId}/invite-code`)).ok()).toBe(true);

    const player = await person(browser, 'old-link');
    await player.page.goto(`/parties/join/${code}`);
    await expect(player.page.getByText('This invite is no longer valid')).toBeVisible();
    expect((await player.page.request.post(`/api/parties/join/${code}`)).status()).toBe(404);

    await player.context.close();
  });

  test('colega não lê a ficha completa; o mestre não escreve', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa Segura');
    const player = await person(browser, 'owner-player');
    const colleague = await person(browser, 'colleague');
    await joinParty(page, player.page, player.user.id, partyId, code);
    await joinParty(page, colleague.page, colleague.user.id, partyId, code);
    const characterId = await createCharacter(player.page, 'Segredo');
    await bring(player.page, partyId, [characterId]);

    for (const path of [
      `/api/parties/${partyId}/characters/${characterId}`,
      `/api/parties/${partyId}/characters/${characterId}/lore`,
      `/api/parties/${partyId}/characters/${characterId}/spells`,
      `/api/characters/${characterId}`,
    ]) {
      const res = await colleague.page.request.get(path);
      expect(res.status(), path).toBe(404);
    }
    const view = await (await colleague.page.request.get(`/api/parties/${partyId}`)).json();
    expect(view.gm).toBeNull();
    expect(Object.keys(view.roster[0]).sort()).toEqual(
      [
        'accentColor',
        'avatarUrl',
        'characterId',
        'class',
        'level',
        'name',
        'ownerId',
        'race',
      ].sort(),
    );

    // The GM reads, but writing through the owner's routes is refused
    expect((await page.request.get(`/api/parties/${partyId}/characters/${characterId}`)).ok()).toBe(
      true,
    );
    const update = await page.request.put(`/api/characters/${characterId}`, {
      data: { updates: { name: 'Sequestrada' } },
    });
    expect([403, 404]).toContain(update.status());
    const learn = await page.request.post(`/api/characters/${characterId}/spells`, {
      data: { id: 'dnd5e:srd-5.1:spell:fireball', action: 'learn' },
    });
    expect([403, 404]).toContain(learn.status());
    const lore = await page.request.put(`/api/characters/${characterId}/lore`, {
      data: { backstory: 'Escrita pelo mestre' },
    });
    expect([403, 404]).toContain(lore.status());

    const own = await (await player.page.request.get(`/api/characters/${characterId}`)).json();
    expect(own.name).toBe('Segredo');

    await player.context.close();
    await colleague.context.close();
  });

  test('sair da mesa mantém o personagem em Meus Personagens', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa de Saída');
    const player = await person(browser, 'leaver');
    await joinParty(page, player.page, player.user.id, partyId, code);
    const characterId = await createCharacter(player.page, 'Fica Comigo');
    await bring(player.page, partyId, [characterId]);

    await player.page.goto(partyUrl(partyId));
    player.page.once('dialog', (dialog) => dialog.accept());
    await (await hydrated(player.page.getByRole('button', { name: 'Leave party' }))).click();
    await expect.poll(() => new URL(player.page.url()).pathname).toBe('/parties');

    await player.page.goto('/characters');
    await expect(player.page.getByText('Fica Comigo')).toBeVisible();
    const gmView = await (await page.request.get(`/api/parties/${partyId}`)).json();
    expect(gmView.roster).toEqual([]);

    await player.context.close();
  });
});
