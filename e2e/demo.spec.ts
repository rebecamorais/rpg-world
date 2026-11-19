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
    await expect(page.getByLabel('Hit points', { exact: true })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Meet the Inspiration' })).toBeVisible();

    for (const tab of ['Lore', 'Spellbook', 'Inventory', 'Status']) {
      await page.getByRole('complementary').getByRole('link', { name: tab, exact: true }).click();
      await expect(page).toHaveURL(/\/demo\/characters\/ada/);
    }

    await page.goto('/demo/npcs');
    await expect(page.locator('a[href^="/demo/characters/"]')).toHaveCount(7);

    await page.goto('/demo/inventory');
    await expect(page.getByText('Party inventory', { exact: true })).toBeVisible();

    const unexpected = calls.filter((call) => call !== 'GET /api/auth/session');
    expect(unexpected).toEqual([]);
  });

  test('recarregar a ficha funciona, id desconhecido dá 404 e o modo combate é ignorado', async ({
    page,
  }) => {
    await page.goto('/demo/characters/mirela');
    await page.reload();
    await expect(page.getByLabel('Hit points', { exact: true })).toBeVisible();

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

  test('o header rola com a página, e a VitalsBar gruda no topo', async ({ page }) => {
    await page.goto('/demo/characters/ada');
    const vitals = page.getByRole('region', { name: 'Combat at a glance' });
    await expect(vitals).toBeVisible();
    await page.mouse.wheel(0, 1200);

    await expect
      .poll(async () => (await page.getByRole('banner').boundingBox())?.y ?? 0)
      .toBeLessThan(0);
    await expect.poll(async () => (await vitals.boundingBox())?.y ?? -1).toBeLessThan(8);
  });
});

test.describe('demo: o que gruda, o convite e os títulos', () => {
  test('no desktop, o índice do Grimório gruda logo abaixo do header, não por baixo', async ({
    page,
  }) => {
    await page.goto('/demo/characters/ada/spells');
    const index = page.getByRole('navigation', { name: 'Index' });
    await expect(index).toBeVisible();
    await page.mouse.wheel(0, 1500);

    const header = await page.getByRole('banner').boundingBox();
    const headerBottom = (header?.y ?? 0) + (header?.height ?? 0);
    await expect
      .poll(async () => (await index.boundingBox())?.y ?? 0)
      .toBeGreaterThanOrEqual(headerBottom - 1);
  });

  test('a primeira recusa abre o convite; as seguintes, um toast só, sem empilhar', async ({
    page,
  }) => {
    await page.goto('/demo/inventory');
    const pay = page.getByRole('button', { name: 'Pay' });
    const toast = page.getByText('The demo is read only: nothing here is saved.');

    // Pay refuses at once: no payment form to fill in first
    await pay.click();
    const invite = page.getByRole('dialog', { name: 'Create your adventure' });
    await expect(invite).toBeVisible();
    await expect(toast).toHaveCount(0);
    await invite.getByRole('button', { name: 'Keep exploring' }).click();

    await pay.click();
    await pay.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(toast).toHaveCount(1);
  });

  test('cada página da demo tem o seu título na aba', async ({ page }) => {
    await page.goto('/demo');
    await expect(page).toHaveTitle('Demo · The Pioneers · RPG World');
    await page.goto('/demo/npcs');
    await expect(page).toHaveTitle('NPCs · Demo · The Pioneers · RPG World');
    await page.goto('/demo/inventory');
    await expect(page).toHaveTitle('Chest · Demo · The Pioneers · RPG World');
  });
});
