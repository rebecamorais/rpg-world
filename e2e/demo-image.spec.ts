import { expect, hydrated, test } from './support/fixtures';

test.describe('imagens na demo', () => {
  test('amplia a imagem de um personagem na mesa', async ({ page }) => {
    await page.goto('/demo');

    await (await hydrated(page.getByRole('button', { name: /^View .+'s image$/ }).first())).click();

    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adjust image' })).toBeHidden();
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
