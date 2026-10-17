import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test.describe('ciclo do personagem', () => {
  test('cria, edita, salva e continua igual depois de recarregar', async ({ page, user: _ }) => {
    await page.goto('/characters');
    await page.getByRole('link', { name: 'Create first character' }).click();

    await (await hydrated(page.getByLabel('Name *'))).fill('Thorin');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/system\/DnD_5e\/character\/[0-9a-f-]{36}$/);
    await expect(page.getByText('Thorin').first()).toBeVisible();

    // Strength 10 → 16 (modifier +3) through the attribute dialog
    await page.getByRole('button', { name: /^STR/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit STR' });
    await dialog.getByLabel('Base Value').fill('16');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: /^STR/ })).toContainText('+3');

    await page.getByLabel('Hit Points', { exact: true }).fill('7');

    const save = page.getByRole('button', { name: 'Save Changes' });
    await save.click();
    await expect(page.getByText('Character saved successfully!')).toBeVisible();
    await expect(save).toBeDisabled();

    await page.reload();
    await expect(page.getByRole('button', { name: /^STR/ })).toContainText('16');
    await expect(page.getByLabel('Hit Points', { exact: true })).toHaveValue('7');
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
});
