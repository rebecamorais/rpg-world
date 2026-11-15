import {
  bring,
  characterUrl,
  createCharacter,
  createParty,
  expect,
  hydrated,
  joinParty,
  partyUrl,
  person,
  test,
} from './support/fixtures';

// Phase 1 review, causes 11 (focus in dialogs) and 12 (no permission vs not found)

test.describe('ficha de colega e configurações da mesa', () => {
  test('o jogador não vê "Ver ficha" do colega e, pela URL, lê que a ficha é privada', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa Fechada');
    const owner = await person(browser, 'sheet-owner');
    const colleague = await person(browser, 'sheet-colleague');
    await joinParty(page, owner.page, owner.user.id, partyId, code);
    await joinParty(page, colleague.page, colleague.user.id, partyId, code);
    const theirs = await createCharacter(owner.page, 'Segredo');
    const mine = await createCharacter(colleague.page, 'Aberta');
    await bring(owner.page, partyId, [theirs]);
    await bring(colleague.page, partyId, [mine]);

    await colleague.page.goto(partyUrl(partyId));
    const main = colleague.page.getByRole('main');
    await expect(main.getByText('Segredo')).toBeVisible();
    // Their own character has the button; the colleague's has neither the button nor a link
    await expect(main.getByRole('button', { name: 'View sheet Aberta' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'View sheet Segredo' })).toHaveCount(0);
    await expect(main.getByRole('link', { name: 'Segredo' })).toHaveCount(0);

    // An old link: the sheet is private, said plainly (the API still answers 404)
    await colleague.page.goto(`${partyUrl(partyId)}/characters/${theirs}`);
    await expect(colleague.page.getByText('This sheet is private')).toBeVisible();
    await expect(colleague.page.getByText('Character not found')).toHaveCount(0);
    await expect(colleague.page.getByRole('link', { name: 'Back to the party' })).toBeVisible();

    // An id that isn't at this table: "not in the party", not "private"
    await colleague.page.goto(
      `${partyUrl(partyId)}/characters/00000000-0000-4000-8000-000000000000`,
    );
    await expect(colleague.page.getByText('This character isn’t in the party')).toBeVisible();
    await expect(colleague.page.getByText('This sheet is private')).toHaveCount(0);

    // Their own character through the party: their own sheet
    await colleague.page.goto(`${partyUrl(partyId)}/characters/${mine}`);
    await expect.poll(() => new URL(colleague.page.url()).pathname).toBe(characterUrl(mine));

    await owner.context.close();
    await colleague.context.close();
  });

  test('o jogador que abre as configurações cai na mesa com o aviso', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa do Mestre');
    const player = await person(browser, 'settings-player');
    await joinParty(page, player.page, player.user.id, partyId, code);

    await player.page.goto(`${partyUrl(partyId)}/settings`);

    await expect.poll(() => new URL(player.page.url()).pathname).toBe(partyUrl(partyId));
    await expect(player.page.getByText('Only the GM can open the party settings.')).toBeVisible();
    await expect(player.page.getByText('Party not found')).toHaveCount(0);

    await player.context.close();
  });
});

test('Ajustar PV pelo teclado: abre no número, Tab nas ações e o foco volta ao botão', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Keyboard Hero');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: { updates: { hpMax: 20, hpCurrent: 20 } },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id));

  // On a desktop the HP card's button (the vitals bar is a phone thing)
  const trigger = await hydrated(
    page.getByRole('button', { name: 'Adjust HP' }).filter({ visible: true }).first(),
  );
  await trigger.focus();
  await page.keyboard.press('Enter');

  const sheet = page.getByRole('dialog', { name: 'Adjust HP' });
  await expect(sheet.getByLabel('How much?')).toBeFocused();
  await page.keyboard.type('3');
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'Damage' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'Heal' })).toBeFocused();

  // Esc closes and the focus goes back to the button that opened it
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // Enter applies Damage and closes: the focus is back on the button again
  await page.keyboard.press('Enter');
  await expect(sheet.getByLabel('How much?')).toBeFocused();
  await page.keyboard.type('5');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await (await page.request.get(`/api/characters/${id}`)).json()).hpCurrent)
    .toBe(15);
  await expect(trigger).toBeFocused();
});

test('um diálogo aberto por estado devolve o foco ao botão que o abriu', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Spell Hero');
  await page.goto(characterUrl(id, '/spells'));

  const add = await hydrated(page.getByRole('button', { name: /add spell/i }).first());
  await add.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // The close button is the dialog's first tabbable, in the DOM order (a Shift+Tab would pass
  // either way: the focus scope wraps around)
  const firstTabbable = await dialog.evaluate((root) => {
    const tabbable = [
      ...root.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
      ),
    ].find((element) => element.tabIndex >= 0 && !element.matches(':disabled'));
    return tabbable?.textContent?.trim() ?? null;
  });
  expect(firstTabbable).toBe('Close');
  // …and the dialog still opens on its first field, not on it
  await expect(dialog.getByRole('button', { name: 'Close' })).not.toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
});
