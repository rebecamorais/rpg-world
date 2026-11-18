import { expect, hydrated, signIn, test } from './support/fixtures';
import { linkIn, waitForEmail } from './support/mailbox';
import { PASSWORD, createUser } from './support/supabase';

const NEW_PASSWORD = 'BrandNewPass456!';

test('esqueci a senha: link por e-mail, nova senha e login com ela', async ({ page }) => {
  const user = await createUser('recovery');
  await page.goto('/forgot-password');

  await (await hydrated(page.getByLabel('Email'))).fill(user.email);
  const submit = page.getByRole('button', { name: 'Send recovery email' });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();
  await expect(page.getByText('Email sent! 📬').first()).toBeVisible();

  await page.goto(linkIn(await waitForEmail(user.email), '/api/auth/confirm'));

  await (await hydrated(page.getByLabel('New Password', { exact: true }))).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm New Password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Update Password' }).click();
  await expect(page.getByText('Password changed! 🎉').first()).toBeVisible();

  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: NEW_PASSWORD },
  });
  expect(login.ok()).toBe(true);
});

test('senha provisória obriga a troca antes de entrar', async ({ page }) => {
  const user = await createUser('first-access', '123MudaASenha@');
  await page.goto('/login');

  await (await hydrated(page.getByLabel('Email'))).fill(user.email);
  await page.getByLabel('Password').fill('123MudaASenha@');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/change-password$/);

  await (await hydrated(page.getByLabel('Current password'))).fill('123MudaASenha@');
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();

  await expect(page).toHaveURL(/\/settings\/profile\?passwordChanged=1$/);
  await signIn(page, { ...user }, NEW_PASSWORD);
});

test('sem sessão, a troca de senha leva ao login', async ({ page }) => {
  await page.goto('/change-password');

  await expect(page).toHaveURL(/\/login\?next=%2Fchange-password$/);
});

test('trocar a senha pelo perfil pede a atual, avisa por e-mail e mostra o retorno', async ({
  page,
  user,
}) => {
  await page.goto('/settings/profile');
  await (await hydrated(page.getByRole('link', { name: 'Change password' }))).click();

  // Wrong current password: refused, on its field
  await (await hydrated(page.getByLabel('Current password'))).fill('not-my-password');
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Incorrect current password.', { exact: false })).toBeVisible();

  await page.getByLabel('Current password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();

  // The confirmation survives the reload that follows the change
  await expect(page).toHaveURL(/\/settings\/profile\?passwordChanged=1$/);
  await expect(page.getByRole('status').filter({ hasText: 'Password changed.' })).toBeVisible();
  expect(await waitForEmail(user.email)).toContain('Sua senha foi alterada');

  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: NEW_PASSWORD },
  });
  expect(login.ok()).toBe(true);
});
