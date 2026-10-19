import { expect, hydrated, signIn, test } from './support/fixtures';
import { linkIn, waitForEmail } from './support/mailbox';
import { createUser } from './support/supabase';

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

  await (await hydrated(page.getByLabel('New Password', { exact: true }))).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm New Password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Update Password' }).click();

  await expect(page).toHaveURL(/\/characters$/);
  await signIn(page, { ...user }, NEW_PASSWORD);
});
