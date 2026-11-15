import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('troca o idioma da interface para português', async ({ page, user: _ }) => {
  await page.goto('/characters');
  await expect(page.getByText('No characters yet')).toBeVisible();

  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Português' }).click();

  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();
  // Signed in, switching language invites to help translate, in the new language
  await expect(page.getByText('Ajude a traduzir o RPG World')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Traduzir no Weblate' })).toBeVisible();

  // The toasts' region is named in the page's language too
  await expect(page.getByRole('region', { name: /^Notificações/ })).toBeAttached();

  // The choice is kept in a cookie
  await page.reload();
  await expect(page.getByText('Nenhum personagem ainda')).toBeVisible();

  // The invite shows once: switching again doesn't cover the page with it
  await page.getByRole('combobox').filter({ hasText: 'Português' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByText('No characters yet')).toBeVisible();
  await expect(page.getByText('Help translate RPG World')).toHaveCount(0);
});

test('com a ficha alterada, ficar na página mantém o idioma antigo', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bilingual Hero');
  await page.goto(characterUrl(id));
  // A sheet edit, kept in the draft: leaving asks first
  await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('15');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Português' }).click();

  await expect(page.getByLabel('AC', { exact: true })).toHaveValue('15');
  // Nothing saved the new language: the next page still opens in English
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === 'NEXT_LOCALE')?.value ?? 'en').toBe('en');
});

test('sem login, trocar o idioma não convida para traduzir', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Português' }).click();

  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
  await expect(page.getByText('Ajude a traduzir o RPG World')).toHaveCount(0);
});

test('depois de trocar para português, um link já pré-carregado abre em português', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: 'English' }).click();
  await page.getByRole('option', { name: 'Português' }).click();
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'Funcionalidades' }).click();

  await expect(page).toHaveURL(/\/features$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
});
