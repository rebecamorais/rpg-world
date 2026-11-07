import { expect, test } from './support/fixtures';

test('o menu recolhe em ícones, cresce com o mouse sem mover a página e a escolha fica', async ({
  page,
  user: _,
}) => {
  await page.goto('/characters');
  const menu = page.getByRole('complementary');
  const panel = page.getByTestId('sidebar-panel');
  const heading = page.getByRole('heading', { level: 1 });
  // At its top: hovering the middle of a tall menu would scroll the page to center it
  const hoverMenu = () => menu.hover({ position: { x: 30, y: 20 } });

  await menu.getByRole('button', { name: 'Collapse menu' }).click();
  await expect(menu).toHaveAttribute('data-sidebar', 'rail');
  await page.mouse.move(800, 400);
  await expect(panel).toHaveAttribute('data-expanded', 'false');
  await expect.poll(async () => (await panel.boundingBox())?.width).toBeLessThan(80);

  await page.reload();
  await expect(menu).toHaveAttribute('data-sidebar', 'rail');
  await expect.poll(async () => (await panel.boundingBox())?.width).toBeLessThan(80);
  const pageBefore = await heading.boundingBox();

  await hoverMenu();
  await expect.poll(async () => (await panel.boundingBox())?.width).toBeGreaterThan(240);
  expect(await heading.boundingBox()).toEqual(pageBefore);

  await page.mouse.move(800, 400);
  await expect.poll(async () => (await panel.boundingBox())?.width).toBeLessThan(80);

  await hoverMenu();
  await menu.getByRole('button', { name: 'Keep menu open' }).click();
  await expect(menu).toHaveAttribute('data-sidebar', 'pinned');

  await page.reload();
  await expect(menu).toHaveAttribute('data-sidebar', 'pinned');
});
