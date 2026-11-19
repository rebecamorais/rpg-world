import { expect, hydrated, test } from './support/fixtures';
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
  await expect(page.getByRole('heading', { name: 'Email sent' })).toBeFocused();

  await page.goto(linkIn(await waitForEmail(user.email), '/api/auth/confirm'));

  await (await hydrated(page.getByLabel('New password', { exact: true }))).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Update password' }).click();
  // Already signed in by the link: straight into the app, with the toast
  await expect(page).toHaveURL(/\/characters$/);
  await expect(page.getByText('Password changed', { exact: true })).toBeVisible();

  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: NEW_PASSWORD },
  });
  expect(login.ok()).toBe(true);
});

test('nova senha sem a sessão do link: avisa na hora e oferece outro link', async ({ page }) => {
  await page.goto('/reset-password');

  await expect(page.getByRole('heading', { name: 'This link no longer works' })).toBeVisible();
  await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Request a new link' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
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
