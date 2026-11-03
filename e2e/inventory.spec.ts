import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test.describe('inventário', () => {
  test('recebe, paga com troco, adiciona e aumenta um item, e tudo fica salvo', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Packrat');
    await page.goto(characterUrl(id, '/inventory'));
    expect(new URL(page.url()).pathname).toBe(characterUrl(id, '/inventory'));

    // Receive 10 GP
    await (await hydrated(page.getByRole('button', { name: 'Receive' }))).click();
    let dialog = page.getByRole('dialog', { name: 'Receive' });
    await dialog.getByLabel('Amount').fill('10');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel('Gold pieces')).toHaveValue('10');

    // Pay 5 SP out of gold only: a gold piece is broken and the change comes back in silver
    await page.getByRole('button', { name: 'Pay' }).click();
    dialog = page.getByRole('dialog', { name: 'Pay' });
    await dialog.getByLabel('Amount').fill('5');
    await dialog.getByRole('combobox', { name: 'Coin' }).click();
    await page.getByRole('option', { name: 'SP' }).click();
    await expect(dialog.getByText('Change', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel('Gold pieces')).toHaveValue('9');
    await expect(page.getByLabel('Silver pieces')).toHaveValue('5');

    // Add a rope and make it two
    await page.getByRole('button', { name: 'Add item' }).click();
    const catalog = page.getByRole('dialog', { name: 'Add item' });
    await catalog.getByRole('searchbox', { name: 'Search items' }).fill('rope');
    await catalog.getByRole('button', { name: 'Add Rope', exact: true }).click();
    await expect(catalog).toBeHidden();
    await page.getByRole('button', { name: 'One more Rope' }).click();
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('2');

    // Everything survives a reload
    await page.reload();
    await expect(page.getByLabel('Gold pieces')).toHaveValue('9');
    await expect(page.getByLabel('Silver pieces')).toHaveValue('5');
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('2');
  });
});
