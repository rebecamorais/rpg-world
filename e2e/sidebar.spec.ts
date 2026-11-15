import { expect, hydrated, test } from './support/fixtures';

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

// Phase 2 review, navegacao-do-painel: with no saved choice the menu is a rail below 1024px and
// pinned from it; the person's choice is kept
test.describe('sem escolha salva', () => {
  test('abaixo de 1024px começa em trilho e a página fica com a largura', async ({
    page,
    user: _,
  }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto('/characters');
    const menu = page.getByRole('complementary');

    await expect(menu).toHaveAttribute('data-sidebar', 'rail');
    await expect
      .poll(async () => (await page.getByTestId('sidebar-panel').boundingBox())?.width)
      .toBeLessThan(80);

    // Pinning it is remembered over the width
    await menu.hover({ position: { x: 30, y: 20 } });
    await menu.getByRole('button', { name: 'Keep menu open' }).click();
    await page.reload();
    await expect(menu).toHaveAttribute('data-sidebar', 'pinned');
  });

  test('a partir de 1024px começa fixa e aberta', async ({ page, user: _ }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/characters');

    await expect(page.getByRole('complementary')).toHaveAttribute('data-sidebar', 'pinned');
    await expect
      .poll(async () => (await page.getByTestId('sidebar-panel').boundingBox())?.width)
      .toBeGreaterThan(240);
  });
});

test('recolher pelo teclado fecha na hora, e Esc fecha o trilho aberto pelo foco', async ({
  page,
  user: _,
}) => {
  await page.goto('/characters');
  const menu = page.getByRole('complementary');
  const panel = page.getByTestId('sidebar-panel');

  const collapse = await hydrated(menu.getByRole('button', { name: 'Collapse menu' }));
  await collapse.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('data-sidebar', 'rail');
  // The focus is still on the button, yet the strip closes
  await expect(panel).toHaveAttribute('data-expanded', 'false');

  // Leaving and coming back by keyboard opens it again; Esc closes it
  await page.getByRole('heading', { level: 1 }).click();
  await menu.getByRole('link', { name: 'My Characters' }).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(panel).toHaveAttribute('data-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(panel).toHaveAttribute('data-expanded', 'false');
});

test('"Recolher menu" fica no pé do menu, longe do nome da pessoa', async ({ page, user: _ }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/characters');
  const menu = page.getByRole('complementary');

  const collapse = (await menu.getByRole('button', { name: 'Collapse menu' }).boundingBox())!;
  const newCharacter = (await menu.getByRole('link', { name: 'New character' }).boundingBox())!;
  expect(collapse.y).toBeGreaterThan(newCharacter.y + newCharacter.height);
  // At the foot of the visible menu (the header is 80px)
  expect(collapse.y + collapse.height).toBeGreaterThan(800 - 80);
});

test('pular para o conteúdo cai na página: o menu lateral fica fora do main', async ({
  page,
  user: _,
}) => {
  await page.goto('/characters');
  const main = page.getByRole('main');
  await expect(main).toHaveCount(1);
  await expect(main.getByRole('complementary')).toHaveCount(0);
  await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('complementary').getByRole('navigation', { name: 'Main navigation' }),
  ).toBeVisible();

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  // The next stop is in the page, not the menu's first control
  expect(
    await page.evaluate(() => ({
      inPage: document.activeElement?.closest('main') !== null,
      inMenu: document.activeElement?.closest('aside') !== null,
    })),
  ).toEqual({ inPage: true, inMenu: false });
});
