import { expect, hydrated, test } from './support/fixtures';
import { PASSWORD, createUser } from './support/supabase';

test.describe('autenticação', () => {
  test('visitante é mandado para o login ao abrir uma página protegida', async ({ page }) => {
    await page.goto('/characters');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Sign in to RPG World')).toBeVisible();
  });

  test('login com e-mail e senha abre a lista de personagens', async ({ page }) => {
    const user = await createUser('login');
    await page.goto('/login');

    await (await hydrated(page.getByLabel('Email'))).fill(user.email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/characters$/);
    await expect(page.getByText('No characters yet')).toBeVisible();
  });

  test('senha errada mostra a mensagem traduzida e não entra', async ({ page }) => {
    const user = await createUser('wrong-password');
    await page.goto('/login');

    await (await hydrated(page.getByLabel('Email'))).fill(user.email);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.locator('form').getByText('Incorrect email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logout encerra a sessão', async ({ page, user: _user }) => {
    await page.goto('/characters');

    await page.getByRole('banner').getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/characters');
    await expect(page).toHaveURL(/\/login$/);
  });
});
