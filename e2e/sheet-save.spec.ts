import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

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

test('o skip link leva direto ao conteúdo', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('#main-content')).toBeFocused();
});
