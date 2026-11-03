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
import { PASSWORD, type TestUser, adminClient, createUser } from './support/supabase';

async function usernameOf(user: TestUser) {
  const { data } = await adminClient()
    .from('profile')
    .select('username')
    .eq('id', user.id)
    .single();
  return data!.username as string;
}

test.describe('mesas', () => {
  test('jogador entra pelo link e o mestre aprova', async ({ page, browser, user: _ }) => {
    const { id: partyId } = await createParty(page, 'Mesa de Quinta');
    await page.goto(partyUrl(partyId));
    await (
      await hydrated(page.getByRole('complementary').getByRole('link', { name: 'Settings' }))
    ).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(`${partyUrl(partyId)}/settings`);
    // The origin is filled in once the page hydrates (the server doesn't know it)
    const linkField = await hydrated(page.getByLabel('Invite link'));
    await expect(linkField).toHaveValue(/^http.*\/parties\/join\/[a-f0-9]{32}$/);
    const link = await linkField.inputValue();

    const player = await person(browser, 'link-player');
    await createCharacter(player.page, 'Arani');
    await player.page.goto(new URL(link).pathname);
    await (await hydrated(player.page.getByRole('button', { name: 'Ask to join' }))).click();
    await expect(player.page.getByRole('status').filter({ hasText: 'Request sent' })).toBeVisible();

    await page.goto(partyUrl(partyId));
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

    await page.goto(`${partyUrl(partyId)}/settings`);
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
    await (await hydrated(visitor.getByRole('link', { name: 'Sign in to join' }))).click();
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

  test('o diário da mesa aparece para o jogador, com aviso no celular', async ({
    page,
    browser,
    user: _,
  }) => {
    const docId = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-abcd';
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    const { id: partyId, code } = await createParty(page, 'Mesa do Diário');
    const player = await person(browser, 'journal-player');
    await joinParty(page, player.page, player.user.id, partyId, code);
    // Never load Google in tests: the iframe src is all that is asserted
    await player.context.route('https://docs.google.com/**', (route) =>
      route.fulfill({ status: 200, body: '' }),
    );

    await player.page.goto(`${partyUrl(partyId)}/journal`);
    await expect(player.page.getByText("The GM hasn't set up the journal yet")).toBeVisible();

    await page.goto(`${partyUrl(partyId)}/settings`);
    await (await hydrated(page.getByLabel('Google Docs link'))).fill(docUrl);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Journal saved')).toBeVisible();

    await player.page.reload();
    const frame = player.page.locator('iframe[title="Party journal"]');
    await expect(frame).toHaveAttribute('src', docUrl);
    await expect(player.page.getByRole('link', { name: 'Open in Google Docs' })).toHaveAttribute(
      'href',
      docUrl,
    );

    await player.page.setViewportSize({ width: 390, height: 800 });
    await expect(frame).toHaveCount(0);
    await expect(player.page.getByText(/On a phone the journal opens straight/)).toBeVisible();
    await expect(player.page.getByRole('link', { name: 'Open in Google Docs' })).toBeVisible();

    await player.context.close();
  });

  test('o inventário da party: o jogador põe moedas e um item, o mestre vê', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa do Baú');
    const player = await person(browser, 'chest-player');
    await joinParty(page, player.page, player.user.id, partyId, code);

    await player.page.goto(partyUrl(partyId, '/inventory'));
    await expect(player.page.getByText('The chest is empty.')).toBeVisible();

    // Receive is enabled once the chest has loaded
    await (await hydrated(player.page.getByRole('button', { name: 'Receive' }))).click();
    const dialog = player.page.getByRole('dialog', { name: 'Receive' });
    await dialog.getByLabel('Amount').fill('25');
    const coins = player.page.waitForResponse(
      (r) => r.url().includes('/chest/coins') && r.request().method() === 'PUT' && r.ok(),
    );
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await coins;

    await player.page.getByRole('button', { name: 'Add item' }).click();
    const catalog = player.page.getByRole('dialog', { name: 'Add item' });
    await catalog.getByRole('searchbox', { name: 'Search items' }).fill('rope');
    const added = player.page.waitForResponse(
      (r) => r.url().includes('/chest/items') && r.request().method() === 'POST' && r.ok(),
    );
    await catalog.getByRole('button', { name: 'Add Rope', exact: true }).click();
    await added;

    // The GM opens it from the sidebar
    await page.goto(partyUrl(partyId));
    await (
      await hydrated(page.getByRole('complementary').getByRole('link', { name: 'Inventory' }))
    ).click();
    await expect(page).toHaveURL((url) => url.pathname === partyUrl(partyId, '/inventory'));
    await expect(page.getByLabel('Gold pieces')).toHaveValue('25');
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('1');

    await player.context.close();
  });

  test('o link de convite mostra nome e prévia sem login, e leva ao login', async ({
    page,
    browser,
    user: _,
  }) => {
    const { code } = await createParty(page, 'Mesa Pública');
    const visitor = await browser.newContext();
    const anon = await visitor.newPage();

    await anon.goto(`/parties/join/${code}`);
    expect(new URL(anon.url()).pathname).toBe(`/parties/join/${code}`);
    await expect(anon.getByText('Mesa Pública', { exact: true })).toBeVisible();
    await expect(anon.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Invite: Mesa Pública',
    );
    await expect(anon.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og-image\.jpg$/,
    );

    await anon.getByRole('link', { name: 'Sign in to join' }).click();
    await expect(anon).toHaveURL(
      (url) =>
        url.pathname === '/login' && url.searchParams.get('next') === `/parties/join/${code}`,
    );

    // Other pages of the app still send a signed-out visitor to the login
    await anon.goto('/parties');
    await expect(anon).toHaveURL((url) => url.pathname === '/login');

    await visitor.close();
  });
});
