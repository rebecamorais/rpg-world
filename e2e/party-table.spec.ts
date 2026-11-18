import {
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

async function usernameOf(userId: string) {
  const { data } = await adminClient().from('profile').select('username').eq('id', userId).single();
  return data!.username as string;
}

// Phase 2 of the screen review: the Table tab, its empty states and the GM's answers
test.describe('aba Mesa: retorno, vazios e lista de mesas', () => {
  test('o mestre aprova um pedido: só aquela linha espera, e o aviso diz quem entrou', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa dos Pedidos');
    const ana = await person(browser, 'request-ana');
    const bia = await person(browser, 'request-bia');
    for (const p of [ana, bia]) {
      expect((await p.page.request.post(`/api/parties/join/${code}`)).ok()).toBe(true);
    }
    const anaName = `@${await usernameOf(ana.user.id)}`;
    const biaName = `@${await usernameOf(bia.user.id)}`;

    await page.goto(partyUrl(partyId));
    // The tab names itself in the document title, like Combat, Journal and Chest
    await expect(page).toHaveTitle(/Mesa dos Pedidos · Party/);

    // Ana's approval held on the way: Bia's row stays usable meanwhile
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route(`**/api/parties/${partyId}/members/${ana.user.id}`, async (route) => {
      await held;
      await route.continue();
    });
    await (
      await hydrated(page.getByRole('button', { name: `Approve ${anaName}'s request` }))
    ).click();
    await expect(
      page.getByRole('button', { name: `Approve ${anaName}'s request` }),
    ).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('button', { name: `Approve ${biaName}'s request` })).toBeEnabled();
    release();
    await expect(page.getByText(`${anaName} joined the party`)).toBeVisible();

    // Declining has its own title and its own notice
    await page.getByRole('button', { name: `Decline ${biaName}'s request` }).click();
    const dialog = page.getByRole('alertdialog', { name: `Decline ${biaName}'s request?` });
    await dialog.getByRole('button', { name: 'Decline' }).click();
    await expect(page.getByText(`${biaName}'s request declined`)).toBeVisible();

    // Ana is in but brought nobody yet: the GM is told the players still have to pick
    await expect(page.getByText("The players haven't picked who to bring yet")).toBeVisible();

    await ana.context.close();
    await bia.context.close();
  });

  test('mesa vazia: o mestre vai ao convite e a jogadora escolhe quem levar dali mesmo', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa Vazia');
    await page.goto(partyUrl(partyId));
    await (await hydrated(page.getByRole('link', { name: 'Invite players' }))).click();
    await expect(page).toHaveURL((url) => url.pathname === `${partyUrl(partyId)}/settings`);
    await expect(page.getByLabel('Invite by username')).toBeInViewport();

    const player = await person(browser, 'empty-table');
    await createCharacter(player.page, 'Arani');
    await joinParty(page, player.page, player.user.id, partyId, code);
    await player.page.goto(partyUrl(partyId));
    await (await hydrated(player.page.getByRole('button', { name: 'Choose characters' }))).click();
    const dialog = player.page.getByRole('dialog', { name: 'My party membership' });
    await dialog.getByRole('checkbox', { name: /Arani/ }).check();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(player.page.getByText('Characters updated')).toBeVisible();
    // Saved, the dialog closes (d-fase2-tempo-real#4) and the table fills
    await expect(dialog).toBeHidden();
    await expect(
      player.page.getByRole('region', { name: 'Characters in the party' }).getByText('Arani'),
    ).toBeVisible();
    // "Choose characters" is gone with the empty state: the focus lands on the list's heading
    await expect(
      player.page.getByRole('heading', { name: 'Characters in the party' }),
    ).toBeFocused();

    // Leaving: its own title, apart from Save, saying what happens to the characters
    await player.page.getByRole('button', { name: 'My party membership' }).click();
    await player.page.getByRole('dialog').getByRole('button', { name: 'Leave party' }).click();
    const confirm = player.page.getByRole('alertdialog', { name: 'Leave the party?' });
    await expect(confirm).toContainText('To come back, you ask again');
    await confirm.getByRole('button', { name: 'Cancel' }).click();

    await player.context.close();
  });

  test('o link esticado do card do Role Play sai do Tab: o teclado vai pelo Ver ficha', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa do Teclado');
    const player = await person(browser, 'keyboard-player');
    const characterId = await createCharacter(player.page, 'Arani');
    await joinParty(page, player.page, player.user.id, partyId, code);
    await player.page.request.put(`/api/parties/${partyId}/my-characters`, {
      data: { characterIds: [characterId] },
    });

    await page.goto(partyUrl(partyId));
    const viewSheet = await hydrated(page.getByRole('button', { name: 'View sheet Arani' }));
    // The stretched link still opens the sheet with the mouse, out of the Tab order
    await expect(page.getByRole('link', { name: /Arani/ })).toHaveAttribute('tabindex', '-1');
    await viewSheet.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: /Arani/ })).not.toBeFocused();

    await player.context.close();
  });

  test('o mestre tira um jogador: o botão diz quem, e o aviso confirma', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa da Saída');
    const player = await person(browser, 'removed-player');
    await joinParty(page, player.page, player.user.id, partyId, code);
    const name = `@${await usernameOf(player.user.id)}`;

    await page.goto(`${partyUrl(partyId)}/settings`);
    await (
      await hydrated(page.getByRole('button', { name: `Remove ${name} from the party` }))
    ).click();
    await page
      .getByRole('alertdialog', { name: `Remove ${name} from the party?` })
      .getByRole('button', { name: 'Remove' })
      .click();
    await expect(page.getByText(`${name} left the party`)).toBeVisible();

    await player.context.close();
  });

  test('diário vazio: o mestre cai no card do diário e, salvo, volta por "Ver diário"', async ({
    page,
    user: _,
  }) => {
    const docUrl =
      'https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-abcd/edit';
    await page
      .context()
      .route('https://docs.google.com/**', (route) => route.fulfill({ status: 200, body: '' }));
    const { id: partyId } = await createParty(page, 'Mesa do Diário Vazio');
    await page.goto(partyUrl(partyId, '/journal'));
    await expect(page.getByText("The journal isn't set up yet")).toBeVisible();
    await (await hydrated(page.getByRole('link', { name: 'Set up the journal' }))).click();
    await expect(page).toHaveURL((url) => url.hash === '#journal');
    const field = page.getByLabel('Google Docs link');
    await expect(field).toBeInViewport();

    // A link that is not a document says why, under the field
    await field.fill('https://example.com/abc');
    await field.blur();
    await expect(field).toHaveAccessibleDescription(/Paste the link of a Google Docs document/);

    await field.fill(docUrl);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: 'View journal' }).click();
    await expect(page).toHaveURL((url) => url.pathname === partyUrl(partyId, '/journal'));
    await expect(page.locator('iframe[title="Party journal"]')).toHaveAttribute('src', docUrl);
  });

  test('criar mesa com Enter repetido cria uma só', async ({ page, user: _ }) => {
    await page.goto('/parties');
    const field = await hydrated(page.getByLabel('Party name'));
    await field.fill('Mesa Única');
    // The keyboard, not the field: the page may already be on its way to the new party
    for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => /^\/parties\/[0-9a-f-]{36}$/.test(url.pathname));

    const mine = await (await page.request.get('/api/parties')).json();
    expect(
      mine.asGm.filter((p: { name: string }) => p.name === 'Mesa Única'),
      'só uma mesa criada',
    ).toHaveLength(1);
  });

  test('sem conexão, o aviso no topo tem fundo opaco', async ({ page, user: _ }) => {
    const { id: partyId } = await createParty(page, 'Mesa Offline');
    await page.goto(partyUrl(partyId));
    await hydrated(page.getByRole('heading', { name: 'Mesa Offline' }));
    await page.context().setOffline(true);
    const notice = page.getByRole('status').filter({ hasText: 'No connection' });
    await expect(notice).toBeVisible();
    // An rgba/oklch with alpha below 1 let the header show through the text
    const background = await notice.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).not.toMatch(/\/\s*0?\.\d+\)|rgba\([^)]*,\s*0?\.\d+\)/);
    await page.context().setOffline(false);
  });
});
