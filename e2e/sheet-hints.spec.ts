import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('o ícone de um número da ficha explica o que ele é, com clique', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Curious Hero');
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('button', { name: 'What is Initiative?' }))).click();

  await expect(page.getByRole('tooltip')).toContainText('Added to the d20');
});

test.describe('no celular', () => {
  test.use({ hasTouch: true, viewport: { width: 412, height: 915 } });

  test('abre a explicação com um toque', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Touch Hero');
    await page.goto(characterUrl(id));

    await (await hydrated(page.getByRole('button', { name: 'What is Hit Dice?' }))).tap();

    await expect(page.getByRole('tooltip')).toContainText('One die per level');
  });
});

test('a engrenagem do card de magia troca o sistema na hora', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Arcane Hero');
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('button', { name: 'Configure magic system' }))).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Spell Slots' }).click();
  await expect(dialog).toBeVisible(); // switching the system swaps the card, not the dialog
  await dialog.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Spell Slots', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
});
