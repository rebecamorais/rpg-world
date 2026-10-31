import { expect, hydrated, test } from './support/fixtures';
import { linkIn, waitForEmail } from './support/mailbox';
import { PASSWORD, createUser, uniqueEmail } from './support/supabase';

test('cadastro: conta criada, e-mail confirmado e acesso liberado', async ({ page }) => {
  const email = uniqueEmail('signup');
  await page.goto('/register');

  await (await hydrated(page.getByLabel('Email'))).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password').fill(PASSWORD);
  // Cloudflare's test site key solves the challenge on its own and enables the button
  const submit = page.getByRole('button', { name: 'Register' });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();

  await expect(page.getByText('Account created!').first()).toBeVisible();

  const confirmation = linkIn(await waitForEmail(email), '/api/auth/confirm');
  await page.goto(confirmation);

  // A new account picks its username before anything else
  await expect(page).toHaveURL(/\/choose-username$/);
  await (await hydrated(page.getByLabel('Username'))).fill(`signup_${Date.now() % 100000}`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/characters$/);
  await expect(page.getByText('No characters yet')).toBeVisible();
});

test('cadastro com e-mail já usado responde igual e avisa o dono por e-mail', async ({ page }) => {
  // The form must not reveal who is registered: same screen as a new e-mail
  const user = await createUser('signup-existing');
  await page.goto('/register');
  await (await hydrated(page.getByLabel('Email'))).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password').fill(PASSWORD);
  const submit = page.getByRole('button', { name: 'Register' });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();

  await expect(page.getByText('Account created!').first()).toBeVisible();
  await expect(page.getByText('This email is already in use.')).toHaveCount(0);

  const notice = await waitForEmail(user.email);
  expect(notice).toContain('Você já tem uma conta');
  expect(linkIn(notice, '/forgot-password')).toMatch(/\/forgot-password$/);
});
