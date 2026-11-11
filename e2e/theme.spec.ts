import { violations } from './support/axe';
import { BASE_URL } from './support/env';
import {
  createEnemySheet,
  createParty,
  expect,
  hydrated,
  partyUrl,
  test,
} from './support/fixtures';

test.describe('sem cookie', () => {
  test.use({ colorScheme: 'light' });

  test('abre escuro sem cookie, mesmo com o sistema em claro', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test('o botão troca, grava e a página recarrega no tema escolhido', async ({ page, context }) => {
  await page.goto('/');
  const html = page.locator('html');
  await (await hydrated(page.getByRole('button', { name: 'Use light theme' }))).click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await expect
    .poll(async () => (await context.cookies()).find((c) => c.name === 'theme')?.value)
    .toBe('light');

  // Set by the inline script before hydration, so the page never flashes dark
  await page.reload({ waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  await page.waitForLoadState('load');
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('cookie inválido abre escuro', async ({ page, context }) => {
  await context.addCookies([{ name: 'theme', value: 'neon', url: BASE_URL }]);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('navegação sem recarregar mantém o tema', async ({ page }) => {
  await page.goto('/');
  await (await hydrated(page.getByRole('button', { name: 'Use light theme' }))).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('contentinfo').getByRole('link', { name: 'Features' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/features');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('linha em espera com hover continua passando', async ({ page, user: _ }) => {
  const { id: partyId } = await createParty(page, 'Mesa do Tema');
  const goblinId = await createEnemySheet(page, 'Goblin', 7);
  const base = `/api/parties/${partyId}/encounter`;
  expect((await page.request.post(base)).status()).toBe(201);
  await page.request.post(`${base}/participants`, { data: { characterId: goblinId, count: 2 } });
  expect((await page.request.post(`${base}/start`)).status()).toBe(204);

  await page.goto(partyUrl(partyId));
  const order = page.getByRole('list', { name: 'Combat order' });
  const waiting = order.getByRole('listitem').and(page.locator(':not([aria-current="true"])'));
  await expect(order.getByRole('listitem')).toHaveCount(2);
  await (await hydrated(waiting.first())).hover();

  expect(await violations(page, { include: '[aria-label="Combat order"]' })).toEqual([]);
});
