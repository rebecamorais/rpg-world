import path from 'node:path';

import { expect, hydrated, signIn, test } from './support/fixtures';
import { createUser } from './support/supabase';

const AVATAR = path.join(import.meta.dirname, 'support', 'avatar.png');

const uniqueUsername = () => `hero_${crypto.randomUUID().slice(0, 8)}`;

test('edita o perfil e ele continua igual depois de recarregar', async ({ page, user: _ }) => {
  const username = uniqueUsername();
  await page.goto('/settings/profile');

  await (await hydrated(page.getByLabel('Username', { exact: true }))).fill(username);
  await page.getByLabel('Name', { exact: true }).fill('Drizzt');
  await page.getByRole('button', { name: 'Yellow' }).click();
  await page.getByRole('button', { name: 'Save Profile' }).click();
  await expect(page.getByText('Profile updated successfully!')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(username);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Drizzt');
  await expect(page.getByRole('button', { name: 'Yellow' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('username de outra pessoa mostra a mensagem certa', async ({ page, user: _ }) => {
  const username = uniqueUsername();
  const owner = await createUser('username-owner');
  const other = await page.context().browser()!.newContext();
  const otherPage = await other.newPage();
  await signIn(otherPage, owner);
  expect((await otherPage.request.patch('/api/profile', { data: { username } })).status()).toBe(
    204,
  );
  await other.close();

  await page.goto('/settings/profile');
  await (await hydrated(page.getByLabel('Username', { exact: true }))).fill(username);
  await page.getByRole('button', { name: 'Save Profile' }).click();

  await expect(page.getByText('This username is already taken.')).toBeVisible();
});

test('troca o avatar, servido pelo proxy com uma URL nova a cada envio', async ({ page, user }) => {
  await page.goto('/settings/profile');
  const avatar = page.getByRole('img', { name: 'Current avatar' });

  async function upload(previousSrc: string | null) {
    await page.locator('#image-file-input').setInputFiles(AVATAR);
    if (previousSrc) await expect(avatar).not.toHaveAttribute('src', previousSrc);
    await expect(avatar).toHaveAttribute('src', new RegExp(`/api/images/avatars/${user.id}/`));
    // The proxy actually serves the image
    await expect
      .poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    return avatar.getAttribute('src');
  }

  const first = await upload(null);
  const second = await upload(first);

  expect(second).not.toBe(first);
});
