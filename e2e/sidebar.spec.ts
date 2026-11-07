import { expect, test } from './support/fixtures';

test('o menu recolhe em ícones, abre ao passar o mouse e a escolha fica', async ({
  page,
  user: _,
}) => {
  await page.goto('/characters');
  const menu = page.getByRole('complementary');
  const drawer = page.getByTestId('sidebar-drawer');

  await menu.getByRole('button', { name: 'Collapse menu' }).click();
  await expect(menu).toHaveAttribute('data-sidebar', 'rail');
  await page.mouse.move(800, 400);
  await expect(drawer).toBeHidden();

  // Collapsing is what gives the page more room
  const box = await menu.boundingBox();
  expect(box?.width).toBeLessThan(80);

  await page.reload();
  await expect(menu).toHaveAttribute('data-sidebar', 'rail');

  await menu.hover();
  await expect(drawer.getByRole('link', { name: 'My Profile' })).toBeVisible();
  await page.mouse.move(800, 400);
  await expect(drawer).toBeHidden();

  await menu.hover();
  await drawer.getByRole('button', { name: 'Keep menu open' }).click();
  await expect(menu).toHaveAttribute('data-sidebar', 'pinned');

  await page.reload();
  await expect(menu).toHaveAttribute('data-sidebar', 'pinned');
});
