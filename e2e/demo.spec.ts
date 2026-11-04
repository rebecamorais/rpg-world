import { expect, test } from './support/fixtures';

const PLAYERS = ['ada', 'katherine', 'grace', 'hedy', 'maren', 'mirela'];

test.describe('demo pública', () => {
  test('anônimo vê as 6 personagens, navega a ficha de Ada e só lê', async ({ page }) => {
    const calls: string[] = [];
    page.on('request', (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith('/api/')) calls.push(`${request.method()} ${pathname}`);
    });

    await page.goto('/demo');
    await expect(page).not.toHaveURL(/\/login/);
    for (const slug of PLAYERS) {
      await expect(page.locator(`a[href="/demo/characters/${slug}"]`).first()).toBeVisible();
    }

    await page.locator('a[href="/demo/characters/ada"]').first().click();
    await expect(page).toHaveURL(/\/demo\/characters\/ada$/);
    await expect(page.getByLabel('Hit Points', { exact: true })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Meet the Inspiration' })).toBeVisible();

    for (const tab of ['Lore', 'Spells', 'Inventory', 'Status']) {
      await page.getByRole('navigation').getByRole('link', { name: tab, exact: true }).click();
      await expect(page).toHaveURL(/\/demo\/characters\/ada/);
    }

    await page.goto('/demo/npcs');
    await expect(page.locator('a[href^="/demo/characters/"]')).toHaveCount(7);

    await page.goto('/demo/inventory');
    await expect(page.getByRole('heading', { name: 'Party inventory' })).toBeVisible();

    const unexpected = calls.filter((call) => call !== 'GET /api/auth/session');
    expect(unexpected).toEqual([]);
  });

  test('recarregar a ficha funciona, id desconhecido dá 404 e o modo combate é ignorado', async ({
    page,
  }) => {
    await page.goto('/demo/characters/mirela');
    await page.reload();
    await expect(page.getByLabel('Hit Points', { exact: true })).toBeVisible();

    const missing = await page.goto('/demo/characters/inexistente');
    expect(missing?.status()).toBe(404);

    await page.goto('/demo?mode=combat');
    await expect(page.getByText('Round')).toHaveCount(0);
  });

  test('"Create account" leva ao cadastro sem redirecionar', async ({ page }) => {
    await page.goto('/demo');
    await page.getByRole('banner').getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('quem está logado volta ao app e vê só os próprios personagens', async ({
    page,
    user: _,
  }) => {
    await page.goto('/demo');
    await page.getByRole('banner').getByRole('link', { name: 'Back to app' }).click();
    await expect(page).toHaveURL(/\/characters$/);
    await expect(page.locator('a[href^="/demo/characters/"]')).toHaveCount(0);
    await expect(page.getByText('Ada Lovelace')).toHaveCount(0);
  });
});

test.describe('demo no celular', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('navegação e botão cabem na tela', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByRole('navigation', { name: 'Demo navigation' })).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Create account' }),
    ).toBeVisible();
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });
});
