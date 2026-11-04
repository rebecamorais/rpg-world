import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, hydrated, signIn, test } from './support/fixtures';
import { linkIn, waitForEmail } from './support/mailbox';
import { PASSWORD, type TestUser, adminClient, createUser, uniqueEmail } from './support/supabase';

/** Serious and critical WCAG A/AA violations, like a11y.spec.ts. */
async function violations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => `${n.target.join(' ')} → ${n.html.slice(0, 160)}`),
    }));
}

/** The username a person typed to confirm has to be one they chose. */
async function chooseUsername(user: TestUser, username: string) {
  const { error } = await adminClient()
    .from('profile')
    .update({ username, username_chosen: true })
    .eq('id', user.id);
  if (error) throw error;
}

/** Direct SQL for what the APIs can't produce (test_helpers exists only in the test database). */
async function forgetPassword(user: TestUser) {
  const { error } = await adminClient()
    .schema('test_helpers' as never)
    .rpc(
      'run_and_hold' as never,
      {
        p_sql: `UPDATE auth.users SET encrypted_password = '' WHERE id = '${user.id}'`,
        p_seconds: 0,
      } as never,
    );
  if (error) throw new Error((error as { message: string }).message);
}

/** A confirmed account that never had a password (Google or magic link), signed in on `page`. */
async function signInWithoutPassword(page: Page, username: string): Promise<TestUser> {
  const email = uniqueEmail('no-password');
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');
  const user = { id: data.user.id, email };
  await chooseUsername(user, username);

  // The admin API stores a random password; an account made through Google stores none
  await forgetPassword(user);

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw link.error;
  await page.goto(
    `/api/auth/confirm?token_hash=${link.data.properties.hashed_token}&type=magiclink`,
  );
  await expect(page).toHaveURL(/\/characters$/);
  return user;
}

/** Step 1 in the app, through the API: the e-mail is the thing under test, not the dialog. */
async function requestDeletion(page: Page, username: string, password?: string) {
  const res = await page.request.post('/api/profile/deletion-request', {
    data: { username, password },
  });
  expect(res.status()).toBe(204);
}

async function deletionLink(user: TestUser) {
  return linkIn(await waitForEmail(user.email), '/delete-account');
}

test('com senha: pede na zona de perigo, confirma pelo e-mail e a conta some', async ({ page }) => {
  const user = await createUser('delete-password');
  await chooseUsername(user, 'thorin_e2e');
  await signIn(page, user);
  await page.goto('/settings/profile');

  const zone = page.getByRole('region', { name: 'Danger zone' });
  await expect(zone).toBeVisible();
  expect(await violations(page)).toEqual([]);

  await (await hydrated(zone.getByRole('button', { name: 'Delete my account' }))).click();
  const dialog = page.getByRole('dialog');
  const send = dialog.getByRole('button', { name: 'Send confirmation e-mail' });
  await expect(send).toBeDisabled();
  expect(await violations(page)).toEqual([]);

  await dialog.getByLabel('Your username').fill('thorin_e2e');
  await dialog.getByLabel('Password').fill(PASSWORD);
  await send.click();
  await expect(dialog.getByText('Check your e-mail')).toBeVisible();

  // Opening the link only shows the account: nothing is deleted yet
  await page.goto(await deletionLink(user));
  await expect(page.getByRole('heading', { name: 'Confirm account deletion' })).toBeVisible();
  await expect(page.getByText('thorin_e2e')).toBeVisible();
  expect(await violations(page)).toEqual([]);
  expect(page.url()).not.toContain('next=');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Confirm account deletion' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete my account for good' }).click();

  await expect(page).toHaveURL(/\/\?accountDeleted=1$/);
  await expect(page.getByRole('status')).toHaveText('Your account was deleted.');
  // A full page load: the header of the deleted account's own session is gone, not just the URL
  await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: PASSWORD },
  });
  expect(login.ok()).toBe(false);
});

test('sem senha: só o username e o link do e-mail', async ({ page, browser }) => {
  const user = await signInWithoutPassword(page, 'bilbo_e2e');
  await page.goto('/settings/profile');

  await (await hydrated(page.getByRole('button', { name: 'Delete my account' }))).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Password')).toHaveCount(0);
  await dialog.getByLabel('Your username').fill('bilbo_e2e');
  await dialog.getByRole('button', { name: 'Send confirmation e-mail' }).click();
  await expect(dialog.getByText('Check your e-mail')).toBeVisible();

  // The link is opened with no session, like in the phone's mail app
  const link = await deletionLink(user);
  const mail = await browser.newContext();
  const mailPage = await mail.newPage();
  await mailPage.goto(link);
  await expect(mailPage).toHaveURL(/\/delete-account\?token=/);
  await mailPage.getByRole('button', { name: 'Delete my account for good' }).click();

  await expect(mailPage).toHaveURL(/\/\?accountDeleted=1$/);
  await mail.close();
  const { data } = await adminClient().auth.admin.getUserById(user.id);
  expect(data.user).toBeNull();
});

test('senha errada fica no campo e leva a "esqueci minha senha"', async ({ page }) => {
  const user = await createUser('delete-wrong-password');
  await chooseUsername(user, 'frodo_e2e');
  await signIn(page, user);
  await page.goto('/settings/profile');

  await (await hydrated(page.getByRole('button', { name: 'Delete my account' }))).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your username').fill('frodo_e2e');
  await dialog.getByLabel('Password').fill('not-the-password');
  await dialog.getByRole('button', { name: 'Send confirmation e-mail' }).click();

  await expect(dialog.getByText(/Incorrect password/)).toBeVisible();
  await expect(dialog.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByRole('link', { name: 'Forgot my password' })).toHaveAttribute(
    'href',
    '/forgot-password',
  );
});

test('link sem token, ou com token que não existe, mostra o aviso de link inválido', async ({
  page,
}) => {
  for (const path of ['/delete-account', '/delete-account?token=nao-existe']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'This link does not work' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete my account for good' })).toHaveCount(0);
  }
  expect(await violations(page)).toEqual([]);
});

test('a página do link não se indexa nem manda o endereço adiante', async ({ page }) => {
  await page.goto('/delete-account?token=abc');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});

test('no celular, a zona de perigo e o diálogo cabem na tela e passam no axe', async ({ page }) => {
  const user = await createUser('delete-phone');
  await chooseUsername(user, 'sam_e2e');
  await signIn(page, user);
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/settings/profile');

  await (await hydrated(page.getByRole('button', { name: 'Delete my account' }))).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  expect(await violations(page)).toEqual([]);
});

test('a sessão antiga de outro aparelho cai no login depois da exclusão, sem laço de redirecionamento', async ({
  browser,
}) => {
  const user = await createUser('delete-stale');
  await chooseUsername(user, 'pippin_e2e');

  const old = await browser.newContext();
  const oldPage = await old.newPage();
  await signIn(oldPage, user);
  await oldPage.goto('/characters');
  await expect(oldPage).toHaveURL(/\/characters$/);

  // Another device deletes the account; the first one keeps its cookies
  const phone = await browser.newContext();
  const phonePage = await phone.newPage();
  await signIn(phonePage, user);
  await requestDeletion(phonePage, 'pippin_e2e', PASSWORD);
  await phonePage.goto(await deletionLink(user));
  await phonePage.getByRole('button', { name: 'Delete my account for good' }).click();
  await expect(phonePage).toHaveURL(/\/\?accountDeleted=1$/);

  await oldPage.goto('/characters');
  await expect(oldPage).toHaveURL(/\/login$/);
  await expect(oldPage.getByRole('button', { name: 'Sign In' })).toBeVisible();
  // /login with the old cookies must not bounce back to /characters either
  await oldPage.goto('/login');
  await expect(oldPage).toHaveURL(/\/login$/);

  await old.close();
  await phone.close();
});
