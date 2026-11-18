import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('edita a lore e ela continua lá depois de recarregar', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bilbo');
  await page.goto(characterUrl(id, '/lore'));

  await (await hydrated(page.getByLabel('Age', { exact: true }))).fill('111');
  await page.getByLabel('Backstory').fill('Found a ring in a cave.');
  const save = page.getByRole('button', { name: 'Save changes' });
  await save.click();
  await expect(save).toBeDisabled();

  await page.reload();
  await expect(page.getByLabel('Age', { exact: true })).toHaveValue('111');
  await expect(page.getByLabel('Backstory')).toHaveValue('Found a ring in a cave.');
});

test('os campos crescem com o texto, sem cortar nem criar rolagem', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bilbo');
  await page.goto(characterUrl(id, '/lore'));

  for (const label of ['Backstory', 'Hair']) {
    const field = await hydrated(page.getByLabel(label, { exact: true }));
    const before = await field.evaluate((el) => el.clientHeight);

    await field.fill('Uma linha longa de texto sobre a personagem. '.repeat(4).concat('\nFim.'));

    const { clientHeight, scrollHeight } = await field.evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(clientHeight).toBeGreaterThan(before);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  }
});

// The save bar sat inside the sheet's `isolate`: at the end of the page the footer's "Copy Pix
// key" was painted over Discard and Save, and clicking Save copied the key instead of saving
for (const { width, height } of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`em ${width}px, no fim da página, o clique do mouse em Salvar salva`, async ({
    page,
    user: _,
  }) => {
    await page.setViewportSize({ width, height });
    const id = await createCharacter(page, 'Bilbo');
    await page.goto(characterUrl(id, '/lore'));

    await (await hydrated(page.getByLabel('Age', { exact: true }))).fill('111');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    const save = page.getByRole('button', { name: 'Save', exact: true });
    const box = (await save.boundingBox())!;
    // The mouse, not the locator's click: whatever is on top at that point gets the click
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByText('Lore saved.')).toBeVisible();
    await expect(save).toBeHidden();
    await page.reload();
    await expect(page.getByLabel('Age', { exact: true })).toHaveValue('111');
  });
}

test('com a lore e a ficha editadas, uma barra só salva as duas', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bilbo');
  await page.goto(characterUrl(id));
  await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('17');
  // Another tab of the same sheet: the character's draft comes along
  await page.getByRole('complementary').getByRole('link', { name: 'Lore' }).click();
  await (await hydrated(page.getByLabel('Age', { exact: true }))).fill('111');

  await expect(page.getByText('Unsaved lore and sheet changes')).toBeVisible();
  await expect(page.getByText('Unsaved sheet changes')).toBeHidden();
  await page.getByRole('button', { name: 'Save all' }).last().click();

  await expect(page.getByText('Lore saved.')).toBeVisible();
  await expect(page.getByText('Character saved successfully!')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Age', { exact: true })).toHaveValue('111');
  await page.goto(characterUrl(id));
  await expect(page.getByLabel('AC', { exact: true })).toHaveValue('17');
});
