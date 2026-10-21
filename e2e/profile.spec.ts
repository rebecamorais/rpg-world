import path from 'node:path';

import { expect, hydrated, signIn, test } from './support/fixtures';
import { largePng } from './support/large-png';
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
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
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

  // Saved with the upload, without pressing Save
  await page.reload();
  await expect(avatar).toHaveAttribute('src', second!);
});

test('imagem grande é recortada e comprimida antes de subir', async ({ page, user }) => {
  const original = largePng(1600);
  expect(original.length).toBeGreaterThan(5 * 1024 * 1024); // above the server's limit

  await page.goto('/settings/profile');
  await hydrated(page.getByLabel('Username', { exact: true }));
  await page.locator('#image-file-input').setInputFiles({
    name: 'ai-art.png',
    mimeType: 'image/png',
    buffer: original,
  });
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Zoom').fill('2');
  await dialog.getByRole('button', { name: 'Save' }).click();

  const avatar = page.getByRole('img', { name: 'Current avatar' });
  await expect(avatar).toHaveAttribute('src', new RegExp(`/api/images/avatars/${user.id}/`));
  const saved = await avatar.evaluate(async (img: HTMLImageElement) => {
    const blob = await (await fetch(img.src)).blob();
    await img.decode();
    return { size: blob.size, type: blob.type, width: img.naturalWidth, height: img.naturalHeight };
  });

  expect(saved.size).toBeLessThan(1024 * 1024);
  expect(saved.type).toBe('image/webp');
  expect(saved.width).toBe(saved.height);
  expect(saved.width).toBeLessThanOrEqual(1024);

  await page.getByRole('button', { name: 'View image' }).click();
  await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
});
