import {
  characterUrl,
  createCharacter,
  createEnemySheet,
  expect,
  hydrated,
  test,
} from './support/fixtures';

test.describe('ciclo do personagem', () => {
  test('cria, edita, salva e continua igual depois de recarregar', async ({ page, user: _ }) => {
    await page.goto('/characters');
    await expect(page).toHaveTitle('My characters · RPG World');
    await page.getByRole('link', { name: 'Create first character' }).click();

    await (await hydrated(page.getByLabel('Name *'))).fill('Thorin');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/system\/DnD_5e\/character\/[0-9a-f-]{36}$/);
    await expect(page.getByText('Thorin').first()).toBeVisible();
    // Each tab says which sheet it is
    await expect(page).toHaveTitle('Status · Thorin · RPG World');

    // Strength 10 → 16 (modifier +3) through the attribute dialog
    await page.getByRole('button', { name: /^STR/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit STR' });
    await dialog.getByLabel('Base value').fill('16');
    // An attribute goes into the draft: the dialog applies it, the sheet's Save keeps it
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('button', { name: /^STR/ })).toContainText('+3');

    await page.getByLabel('Hit points', { exact: true }).fill('7');

    const save = page.getByRole('button', { name: 'Save changes' });
    await save.click();
    await expect(page.getByText('Character saved successfully!')).toBeVisible();
    await expect(save).toBeDisabled();

    await page.reload();
    await expect(page.getByRole('button', { name: /^STR/ })).toContainText('16');
    await expect(page.getByLabel('Hit points', { exact: true })).toHaveValue('7');

    await page.goto(`${page.url()}/lore`);
    await expect(page).toHaveTitle('Lore · Thorin · RPG World');
  });

  test('exclui o personagem só depois de digitar o nome', async ({ page, user: _ }) => {
    await createCharacter(page, 'Doomed Hero');
    await page.goto('/characters');

    await page.getByRole('button', { name: /^Actions for / }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    const confirm = dialog.getByRole('button', { name: 'Delete' });

    await expect(confirm).toBeDisabled();
    await dialog.getByPlaceholder('Type the exact name here').fill('Doomed Hero');
    await confirm.click();

    await expect(page.getByText('No characters yet')).toBeVisible();
  });

  test('o nome do personagem é exibido como texto, nunca como HTML', async ({ page, user: _ }) => {
    const name = '<img src=x onerror="window.__xss=true">';
    const id = await createCharacter(page, name);

    await page.goto('/characters');
    await page.getByRole('button', { name: /^Actions for / }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    await expect(dialog).toContainText(name);
    // The CSP would block the onerror anyway: the tag itself must never be created
    await expect(dialog.locator('img')).toHaveCount(0);

    await page.goto(characterUrl(id));
    await expect(page.getByText(name).first()).toBeVisible();

    expect(await page.evaluate(() => (window as { __xss?: boolean }).__xss)).toBeUndefined();
  });

  test('a lista, a sidebar e a ficha chegam com a página, sem buscar de novo pela API', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Preloaded Hero');
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      const { pathname } = new URL(request.url());
      if (request.method() === 'GET' && pathname.startsWith('/api/')) apiCalls.push(pathname);
    });

    await page.goto('/characters');
    await hydrated(page.getByRole('link', { name: /Preloaded Hero/ }).first());
    await page.goto(characterUrl(id));
    await hydrated(page.getByRole('button', { name: /^STR/ }));

    expect(apiCalls).not.toContain('/api/characters');
    expect(apiCalls).not.toContain('/api/profile');
    expect(apiCalls).not.toContain(`/api/characters/${id}`);
  });

  test('"Novo personagem" fica no cabeçalho de /characters, como o dos NPCs', async ({
    page,
    user: _,
  }) => {
    await createCharacter(page, 'Existing Hero');
    await page.goto('/characters');

    // The page header's, not the sidebar's
    await page.locator('header').getByRole('link', { name: 'New character' }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/characters/new');
  });

  test('a aba de NPCs tem o próprio h1, e as abas são sublinhadas', async ({ page, user: _ }) => {
    await page.goto('/characters/npcs');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My NPCs');
    const current = page
      .getByRole('navigation', { name: 'Characters or NPCs' })
      .getByRole('link', { name: 'My NPCs' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveCSS('border-bottom-style', 'solid');
  });

  test('pelo teclado, excluir manda o foco para o card seguinte', async ({ page, user: _ }) => {
    // Newest first: Maren, then Katherine
    await createCharacter(page, 'Katherine');
    await createCharacter(page, 'Maren');
    await page.goto('/characters');

    await (await hydrated(page.getByRole('button', { name: 'Actions for Maren' }))).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Delete' }).press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    await dialog.getByPlaceholder('Type the exact name here').fill('Maren');
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('link', { name: 'Katherine', exact: true })).toBeFocused();
  });

  test('excluir um NPC fala de NPC', async ({ page, user: _ }) => {
    await createEnemySheet(page, 'Goblin', 7);
    await page.goto('/characters/npcs');

    await (await hydrated(page.getByRole('button', { name: 'Actions for Goblin' }))).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete NPC?' });
    await expect(dialog).toContainText("To confirm, type the NPC's name: Goblin");
    await dialog.getByPlaceholder('Type the exact name here').fill('Goblin');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('NPC deleted successfully.')).toBeVisible();
  });

  test('em 768 com a sidebar, um card por linha e o nome inteiro à vista', async ({
    page,
    user: _,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await createCharacter(page, 'Katherine Johnson');
    await createCharacter(page, 'Maren Hamilton');
    await page.goto('/characters');

    const first = page.getByRole('heading', { name: 'Maren Hamilton' });
    const second = page.getByRole('heading', { name: 'Katherine Johnson' });
    await expect(first).toHaveAttribute('title', 'Maren Hamilton');
    const [a, b] = [await first.boundingBox(), await second.boundingBox()];
    // One column: the second card is below the first, not beside it
    expect(b!.y).toBeGreaterThan(a!.y + a!.height);
    expect(Math.abs(a!.x - b!.x)).toBeLessThan(1);
    // Not cut: the heading is as wide as its text needs
    expect(await first.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('um nome sem espaços não estoura o diálogo de excluir no celular', async ({
    page,
    user: _,
  }) => {
    const name = 'Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    await createCharacter(page, name);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/characters');

    await (await hydrated(page.getByRole('button', { name: `Actions for ${name}` }))).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    await expect(dialog).toBeVisible();

    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const box = (await dialog.boundingBox())!;
    const confirm = (await dialog.getByRole('button', { name: 'Delete' }).boundingBox())!;
    expect(confirm.x + confirm.width).toBeLessThanOrEqual(box.x + box.width);
  });
});
