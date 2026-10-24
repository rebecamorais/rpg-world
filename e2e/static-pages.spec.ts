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
  test.use({ extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });

  test('com o navegador em português, a home abre em português', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
  });

  test('o cookie NEXT_LOCALE=en vence o navegador em português', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: BASE_URL }]);

    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test('/pt/features redireciona para /features', async ({ page }) => {
  await page.goto('/pt/features');

  await expect(page).toHaveURL(/\/features$/);
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
