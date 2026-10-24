import { expect, test } from './support/fixtures';

test('troca o idioma da interface para português', async ({ page, user: _ }) => {
  await page.goto('/characters');
  await expect(page.getByText('No characters yet')).toBeVisible();

  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Portuguese' }).click();

  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();
  // Signed in, switching language invites to help translate, in the new language
  await expect(page.getByText('Ajude a traduzir o RPG World')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Traduzir no Crowdin' })).toBeVisible();

  // The choice is kept in a cookie
  await page.reload();
  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();
});

test('sem login, trocar o idioma não convida para traduzir', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Portuguese' }).click();

  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
  await expect(page.getByText('Ajude a traduzir o RPG World')).toHaveCount(0);
});

test('depois de trocar para português, um link já pré-carregado abre em português', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Portuguese' }).click();
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'Funcionalidades' }).click();

  await expect(page).toHaveURL(/\/features$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
});
