import type { Page } from '@playwright/test';
import path from 'node:path';

import { violations } from './support/axe';
import { expect, hydrated, signIn, test } from './support/fixtures';
import { largePng } from './support/large-png';
import { createUser } from './support/supabase';

const AVATAR = path.join(import.meta.dirname, 'support', 'avatar.png');

/** The avatar on the page (not the viewer's), named after the account: "<username>'s image". */
const profileAvatar = (page: Page) =>
  page.getByRole('main').getByRole('img', { name: /'s image$/ });

const uniqueUsername = () => `hero_${crypto.randomUUID().slice(0, 8)}`;

test('edita o perfil e ele continua igual depois de recarregar', async ({ page, user: _ }) => {
  const username = uniqueUsername();
  await page.goto('/settings/profile');

  await (await hydrated(page.getByLabel('Username', { exact: true }))).fill(username);
  await page.getByLabel('Name', { exact: true }).fill('Drizzt');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile updated successfully!')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue(username);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Drizzt');
});

test('apagar o nome real grava o vazio, e ele continua apagado depois de recarregar', async ({
  page,
  user: _,
}) => {
  await page.goto('/settings/profile');
  const name = await hydrated(page.getByLabel('Name', { exact: true }));
  await name.fill('Drizzt Do’Urden');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile updated successfully!')).toBeVisible();

  await name.fill('');
  // The first save's toast may still be up: wait for this save's own answer
  const saved = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/profile' && r.request().method() !== 'GET' && r.ok(),
  );
  await page.getByRole('button', { name: 'Save profile' }).click();
  await saved;

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
});

test('"Meu perfil" tem os cards Perfil, Conta e Zona de perigo, e o e-mail só para leitura', async ({
  page,
  user,
}) => {
  await page.goto('/settings/profile');

  await expect(page.getByRole('heading', { level: 1, name: 'My profile' })).toBeVisible();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Danger zone' })).toBeVisible();
  await page.getByRole('link', { name: 'Change password' }).click();
  await expect(page).toHaveURL(/\/change-password$/);
});

test('sair do perfil com o nome alterado e sem salvar pede confirmação', async ({
  page,
  user: _,
}) => {
  await page.goto('/settings/profile');
  await (await hydrated(page.getByLabel('Name', { exact: true }))).fill('Não salvo');

  let asked = false;
  page.once('dialog', async (dialog) => {
    asked = true;
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: 'Change password' }).click();

  expect(asked).toBe(true);
  await expect(page).toHaveURL(/\/settings\/profile$/);
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
  await page.getByRole('button', { name: 'Save profile' }).click();

  await expect(page.getByText('This username is already taken.')).toBeVisible();
});

test('troca o avatar, servido pelo proxy com uma URL nova a cada envio', async ({ page, user }) => {
  await page.goto('/settings/profile');
  const avatar = profileAvatar(page);

  async function upload(previousSrc: string | null) {
    // Before hydration the file is picked but nobody hears the change, and the crop never opens
    await (await hydrated(page.getByTestId('image-upload-input'))).setInputFiles(AVATAR);
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

test('remove a foto do perfil, com confirmação', async ({ page, user: _ }) => {
  await page.goto('/settings/profile');
  await hydrated(page.getByLabel('Username', { exact: true }));
  const avatar = profileAvatar(page);
  await page.getByTestId('image-upload-input').setInputFiles(AVATAR);
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(avatar).toBeVisible();

  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await page
    .getByRole('alertdialog', { name: 'Remove the image?' })
    .getByRole('button', { name: 'Remove' })
    .click();

  await expect(page.getByText('Image removed')).toBeVisible();
  await expect(avatar).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Add image' })).toBeVisible();
  await expect(avatar).toBeHidden();
});

test('ajusta a imagem salva sem reenviar o arquivo', async ({ page, user: _ }) => {
  await page.goto('/settings/profile');
  await hydrated(page.getByLabel('Username', { exact: true }));
  const avatar = profileAvatar(page);
  await page.getByTestId('image-upload-input').setInputFiles(AVATAR);
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(avatar).toHaveAttribute('src', /\/api\/images\/avatars\//);
  const before = await avatar.getAttribute('src');

  await page.getByRole('button', { name: 'View image', exact: true }).click();
  await page.getByRole('button', { name: 'Adjust image' }).click();
  await page
    .getByRole('dialog', { name: 'Adjust image' })
    .getByRole('button', { name: 'Save' })
    .click();

  await expect(avatar).not.toHaveAttribute('src', before!);
  await expect
    .poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test('modal da imagem com zoom não tem violações de acessibilidade', async ({ page, user: _ }) => {
  await page.goto('/settings/profile');
  await hydrated(page.getByLabel('Username', { exact: true }));
  await page.getByTestId('image-upload-input').setInputFiles(AVATAR);
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();

  expect(await violations(page, { include: '[role="dialog"]' })).toEqual([]);
});

test('imagem grande é recortada e comprimida antes de subir', async ({ page, user }) => {
  const original = largePng(1600);
  expect(original.length).toBeGreaterThan(5 * 1024 * 1024); // above the server's limit

  await page.goto('/settings/profile');
  await hydrated(page.getByLabel('Username', { exact: true }));
  await page.getByTestId('image-upload-input').setInputFiles({
    name: 'ai-art.png',
    mimeType: 'image/png',
    buffer: original,
  });
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Zoom').fill('2');
  await dialog.getByRole('button', { name: 'Save' }).click();

  const avatar = profileAvatar(page);
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
