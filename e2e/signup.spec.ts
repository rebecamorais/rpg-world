import { expect, hydrated, test } from './support/fixtures';
import { linkIn, waitForEmail } from './support/mailbox';
import { PASSWORD, uniqueEmail } from './support/supabase';

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

  const confirmation = linkIn(await waitForEmail(email), '/auth/v1/verify');
  await page.goto(confirmation);

  await expect(page).toHaveURL(/\/characters$/);
  await expect(page.getByText('No characters yet')).toBeVisible();
});

test('cadastro recusa e-mail já usado, com a mensagem traduzida', async ({ page }) => {
  const email = uniqueEmail('signup-twice');
  for (const attempt of [1, 2]) {
    await page.goto('/register');
    await (await hydrated(page.getByLabel('Email'))).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm Password').fill(PASSWORD);
    const submit = page.getByRole('button', { name: 'Register' });
    await expect(submit).toBeEnabled({ timeout: 15_000 });
    await submit.click();

    if (attempt === 1) await expect(page.getByText('Account created!').first()).toBeVisible();
  }

  await expect(page.getByText('This email is already in use.')).toBeVisible();
});
