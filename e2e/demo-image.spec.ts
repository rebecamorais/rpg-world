import { expect, hydrated, test } from './support/fixtures';

test.describe('imagens na demo', () => {
  test('amplia a imagem de um personagem na mesa', async ({ page }) => {
    await page.goto('/demo');

    await (await hydrated(page.getByRole('button', { name: /^View .+'s image$/ }).first())).click();

    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adjust image' })).toBeHidden();
  });

  test('o X fecha a imagem pelo mouse, também com zoom', async ({ page }) => {
    await page.goto('/demo');
    const open = async () =>
      (await hydrated(page.getByRole('button', { name: /^View .+'s image$/ }).first())).click();
    const viewer = page.getByRole('dialog', { name: 'Full-screen image' });
    // A real mouse click: Playwright refuses it while the image is the element on top of the X
    const close = () => viewer.getByRole('button', { name: 'Close' }).click();

    await open();
    await close();
    await expect(viewer).toBeHidden();

    await open();
    for (let i = 0; i < 4; i++) await viewer.getByRole('button', { name: 'Zoom in' }).click();
    await close();
    await expect(viewer).toBeHidden();
  });

  test('amplia a imagem pelo cabeçalho da ficha, sem oferecer ajuste', async ({ page }) => {
    await page.goto('/demo');
    await (await hydrated(page.getByRole('main').getByRole('link').first())).click();
    await expect(page).toHaveURL(/\/demo\/characters\//);

    await (await hydrated(page.getByRole('button', { name: 'View image', exact: true }))).click();

    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adjust image' })).toBeHidden();
  });
});
