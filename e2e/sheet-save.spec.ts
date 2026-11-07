import path from 'node:path';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';
import { widePng } from './support/large-png';
import { adminClient } from './support/supabase';

const AVATAR = path.join(import.meta.dirname, 'support', 'avatar.png');

test.describe('salvar a ficha', () => {
  test('mostra alterações não salvas e salva com Ctrl+S', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Shortcut Hero');
    await page.goto(characterUrl(id));

    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('17');
    await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();

    await page.keyboard.press('ControlOrMeta+s');

    await expect(page.getByText('Character saved successfully!')).toBeVisible();
    await expect(page.getByText('Unsaved changes')).toBeHidden();
    await page.reload();
    await expect(page.getByLabel('AC', { exact: true })).toHaveValue('17');
  });

  test('avisa antes de sair da ficha com rascunho, mas não ao trocar de aba', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Careful Hero');
    await page.goto(characterUrl(id));
    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('15');

    // Another tab of the same sheet keeps the draft: no question
    await page.getByRole('complementary').getByRole('link', { name: 'Lore' }).click();
    await expect(page).toHaveURL(/\/lore$/);
    await page.getByRole('complementary').getByRole('link', { name: 'Status' }).click();
    await expect(page.getByLabel('AC', { exact: true })).toHaveValue('15');

    // Leaving the sheet asks; cancelling stays with the draft
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('unsaved changes');
      void dialog.dismiss();
    });
    await page.getByRole('complementary').getByRole('link', { name: 'My Characters' }).click();
    await expect(page).toHaveURL(characterUrl(id));

    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('complementary').getByRole('link', { name: 'My Characters' }).click();
    await expect(page).toHaveURL(/\/characters$/);
  });

  test('marca os testes contra a morte ao lado dos pontos de vida', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Dying Hero');
    await page.goto(characterUrl(id));

    const first = await hydrated(page.getByRole('button', { name: 'Death save failure 1' }));
    await first.click();
    await page.getByRole('button', { name: 'Death save failure 2' }).click();

    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Death save failure 3' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

test('a engrenagem abre a aparência, e a cor escolhida só grava com Salvar', async ({
  page,
  user: _,
}) => {
  page.on('dialog', (dialog) => dialog.accept()); // the unsaved changes warning on reload
  const id = await createCharacter(page, 'Stylish Hero');
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('link', { name: 'Sheet appearance' }))).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sheet appearance' })).toBeVisible();

  const code = page.getByLabel('Color code');
  await (await hydrated(code)).fill('#c2410c');
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Color code')).not.toHaveValue('#c2410c');

  await (await hydrated(page.getByLabel('Color code'))).fill('#c2410c');
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Character saved successfully!').first()).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Color code')).toHaveValue('#c2410c');
});

test('ajustar a imagem na ficha só grava com Salvar', async ({ page, user: _ }) => {
  page.on('dialog', (dialog) => dialog.accept()); // the unsaved changes warning on reload
  const name = 'Adjusted Hero';
  const id = await createCharacter(page, name);
  await page.goto(characterUrl(id));

  const cropSave = () =>
    page.getByRole('dialog', { name: 'Adjust image' }).getByRole('button', { name: 'Save' });
  const saveSheet = async () => {
    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.getByText('Character saved successfully!').first()).toBeVisible();
  };
  const openViewer = async () => {
    await (await hydrated(page.getByRole('button', { name: 'View image', exact: true }))).click();
    return page.getByRole('img', { name });
  };
  const adjust = async () => {
    await openViewer();
    await page.getByRole('button', { name: 'Adjust image' }).click();
    await cropSave().click();
    await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  };

  await (await hydrated(page.getByRole('link', { name: 'Sheet appearance' }))).click();
  await page.locator('#image-file-input').setInputFiles(AVATAR);
  await cropSave().click();
  await expect(page.getByRole('button', { name: 'View image' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  await saveSheet();

  await page.goto(characterUrl(id));
  const saved = await (await openViewer()).getAttribute('src');
  await page.keyboard.press('Escape');

  await adjust();
  await page.reload();
  await expect(await openViewer()).toHaveAttribute('src', saved!);
  await page.keyboard.press('Escape');

  await adjust();
  await saveSheet();
  await page.reload();
  await expect(await openViewer()).not.toHaveAttribute('src', saved!);
});

test('ajusta uma imagem salva com caminho relativo, como as do seed local', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Seeded Hero');
  await adminClient()
    .from('characters')
    .update({ avatar_url: '/demo/pioneers/golden-oath.webp' })
    .eq('id', id);
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('button', { name: 'View image', exact: true }))).click();
  await page.getByRole('button', { name: 'Adjust image' }).click();

  await page
    .getByRole('dialog', { name: 'Adjust image' })
    .getByRole('button', { name: 'Save' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Character saved successfully!').first()).toBeVisible();

  await page.reload();
  await (await hydrated(page.getByRole('button', { name: 'View image', exact: true }))).click();
  await expect(page.getByRole('img', { name: 'Seeded Hero' })).toHaveAttribute(
    'src',
    /\/api\/images\/avatars\//,
  );
});

test('guarda a imagem completa, usa no modal e limpa o par anterior', async ({ page, user }) => {
  const name = 'Full Art Hero';
  const id = await createCharacter(page, name);
  await page.goto(characterUrl(id));

  const cropSave = () =>
    page.getByRole('dialog', { name: 'Adjust image' }).getByRole('button', { name: 'Save' });
  const saved = () => page.getByText('Character saved successfully!').first();
  const stored = async () => {
    const { data } = await adminClient().storage.from('avatars').list(`${user.id}/characters`);
    return (data ?? []).map((file) => file.name);
  };

  await (await hydrated(page.getByRole('link', { name: 'Sheet appearance' }))).click();
  // 300 x 100: the crop is square, so a whole image keeps its proportion only if it was kept
  await page.locator('#image-file-input').setInputFiles({
    name: 'wide.png',
    mimeType: 'image/png',
    buffer: widePng(300, 100),
  });
  await cropSave().click();
  await expect(page.getByRole('button', { name: 'View image' })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(saved()).toBeVisible();

  await page.getByRole('link', { name: 'Back to the sheet' }).click();
  await hydrated(page.getByRole('button', { name: 'View image', exact: true }));
  await page.getByRole('button', { name: 'View image', exact: true }).click();
  const image = page.getByRole('img', { name });
  await expect(image).toHaveAttribute('src', /\/characters\/[^/]+(?<!-avatar)\.\w+$/);
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth / img.naturalHeight))
    .toBeCloseTo(3);
  const first = await stored();
  expect(first).toHaveLength(2);

  await page.getByRole('button', { name: 'Adjust image' }).click();
  await cropSave().click();
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(saved()).toBeVisible();

  await expect.poll(stored).toHaveLength(2);
  expect((await stored()).some((file) => first.includes(file))).toBe(false);

  await page.getByRole('button', { name: 'View image', exact: true }).click();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth / img.naturalHeight))
    .toBeCloseTo(3);
});

test('o skip link leva direto ao conteúdo', async ({ page }) => {
  await page.goto('/login');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('#main-content')).toBeFocused();
});
