import path from 'node:path';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

const AVATAR = path.join(import.meta.dirname, 'support', 'avatar.png');

test.describe('salvar a ficha', () => {
  test('mostra alterações não salvas e salva com Ctrl+S', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Shortcut Hero');
    await page.goto(characterUrl(id));

    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('17');
    await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();

    await page.keyboard.press('ControlOrMeta+s');

    await expect(page.getByText('Character saved successfully!')).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeHidden();
    await page.reload();
    await expect(page.getByLabel('AC', { exact: true })).toHaveValue('17');
  });

  test('avisa antes de sair da ficha com rascunho, mas não ao trocar de aba', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Careful Hero');
    await page.goto(characterUrl(id));
    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('15');

    // Another tab of the same sheet keeps the draft: no question
    await page.getByRole('complementary').getByRole('link', { name: 'Lore' }).click();
    await expect(page).toHaveURL(/\/lore$/);
    await page.getByRole('complementary').getByRole('link', { name: 'Status' }).click();
    await expect(page.getByLabel('AC', { exact: true })).toHaveValue('15');

    // Leaving the sheet asks; cancelling stays with the draft
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      void dialog.dismiss();
    });
    await page.getByRole('complementary').getByRole('link', { name: 'My Characters' }).click();
    await expect(page).toHaveURL(characterUrl(id));

    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('complementary').getByRole('link', { name: 'My Characters' }).click();
    await expect(page).toHaveURL(/\/characters$/);
  });

  test('marca os testes contra a morte ao lado dos pontos de vida', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Dying Hero');
    await page.goto(characterUrl(id));

    const first = await hydrated(page.getByRole('button', { name: 'Death save failure 1' }));
    await first.click();
    await page.getByRole('button', { name: 'Death save failure 2' }).click();

    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Death save failure 3' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

test('o avatar abre a personalização do personagem', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Stylish Hero');
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('button', { name: 'Customize Character' }))).click();

  await expect(page.getByRole('dialog', { name: 'Customize Character' })).toBeVisible();
});

test('ajustar a imagem na ficha só grava com Salvar', async ({ page, user: _ }) => {
  page.on('dialog', (dialog) => dialog.accept()); // the unsaved changes warning on reload
  const name = 'Adjusted Hero';
  const id = await createCharacter(page, name);
  await page.goto(characterUrl(id));

  const cropSave = () =>
    page.getByRole('dialog', { name: 'Adjust image' }).getByRole('button', { name: 'Save' });
  const saveSheet = async () => {
    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.getByText('Character saved successfully!').first()).toBeVisible();
  };
  const openViewer = async () => {
    await (await hydrated(page.getByRole('button', { name: 'View image', exact: true }))).click();
    return page.getByRole('img', { name });
  };
  const adjust = async () => {
    await openViewer();
    await page.getByRole('button', { name: 'Adjust image' }).click();
    await cropSave().click();
    await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  };

  await (await hydrated(page.getByRole('button', { name: 'Customize Character' }))).click();
  await page.locator('#image-file-input').setInputFiles(AVATAR);
  await cropSave().click();
  // The dialog hides the rest of the page from the accessibility tree: the status shows after it
  await expect(
    page.getByRole('dialog', { name: 'Customize Character' }).getByRole('button', {
      name: 'View image',
    }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  await saveSheet();

  await page.reload();
  const saved = await (await openViewer()).getAttribute('src');
  await page.keyboard.press('Escape');

  await adjust();
  await page.reload();
  await expect(await openViewer()).toHaveAttribute('src', saved!);
  await page.keyboard.press('Escape');

  await adjust();
  await saveSheet();
  await page.reload();
  await expect(await openViewer()).not.toHaveAttribute('src', saved!);
});

test('o skip link leva direto ao conteúdo', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('#main-content')).toBeFocused();
});
