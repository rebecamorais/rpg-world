import { readFileSync } from 'node:fs';
import path from 'node:path';

import { BASE_URL } from './support/env';
import { expect, test } from './support/fixtures';

const PUBLIC_PAGES = [
  '',
  '/features',
  '/terms',
  '/privacy',
  '/login',
  '/register',
  '/forgot-password',
  '/support',
];

test('as 8 páginas públicas são pré-renderizadas nos 2 idiomas', () => {
  const manifest = JSON.parse(
    readFileSync(
      path.join(process.env.NEXT_DIST_DIR || '.next-e2e', 'prerender-manifest.json'),
      'utf-8',
    ),
  ) as { routes: Record<string, unknown> };

  for (const locale of ['en', 'pt']) {
    for (const page of PUBLIC_PAGES) {
      expect(Object.keys(manifest.routes)).toContain(`/${locale}${page}`);
    }
  }
});

test.describe('primeira visita', () => {
  // A browser in Portuguese (it sends Accept-Language: pt-BR)
  test.use({ locale: 'pt-BR' });

  test('com o navegador em português, a home abre em português, no endereço /pt', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/pt$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
  });

  test('o cookie NEXT_LOCALE=en vence o navegador em português', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: BASE_URL }]);

    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test('/pt/features é o endereço em português, com hreflang para o inglês', async ({ page }) => {
  await page.goto('/pt/features');

  await expect(page).toHaveURL(/\/pt\/features$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.rpgworldapp.com/pt/features',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://www.rpgworldapp.com/features',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://www.rpgworldapp.com/features',
  );
});

test('sem cookie nem idioma do navegador (um robô), /features abre em inglês', async ({
  browser,
}) => {
  const context = await browser.newContext({ extraHTTPHeaders: { 'accept-language': '' } });
  const page = await context.newPage();

  await page.goto('/features');

  await expect(page).toHaveURL(/\/features$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await context.close();
});

test('o app continua sem prefixo: /pt/characters volta para /characters, em português', async ({
  page,
  user: _,
}) => {
  await page.goto('/pt/characters');

  await expect(page).toHaveURL(/\/characters$/);
  await expect(page).not.toHaveURL(/\/pt\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
});

test('uma página que não existe responde 404 com o layout do site', async ({ page }) => {
  const response = await page.goto('/esta-pagina-nao-existe');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Go to the home page' }),
  ).toBeVisible();
});

test('logada, o 404 leva aos personagens, não à landing', async ({ page, user: _ }) => {
  const response = await page.goto('/esta-pagina-nao-existe');

  expect(response?.status()).toBe(404);
  // The logo stays the site's: home, as in the signed-in header
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Go to the home page' }),
  ).toHaveAttribute('href', '/');
  await page.getByRole('main').getByRole('link', { name: 'Go to my characters' }).click();
  await expect(page).toHaveURL(/\/characters$/);
});

test('/settings, o nome que o footer usa, abre o perfil em vez de um 404', async ({
  page,
  user: _,
}) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/settings\/profile$/);
});
