import { expect, test } from './support/fixtures';

test('troca o idioma da interface para português', async ({ page, user: _ }) => {
  await page.goto('/characters');
  await expect(page.getByText('No characters yet')).toBeVisible();

  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Portuguese' }).click();

  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();

  // The choice is kept in a cookie
  await page.reload();
  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();
});
