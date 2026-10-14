import AxeBuilder from '@axe-core/playwright';

import { characterUrl, createCharacter, expect, test } from './support/fixtures';

/** Serious and critical WCAG A/AA violations: id, impact and the offending elements. */
async function violations(page: import('@playwright/test').Page, disabledRules: string[] = []) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(disabledRules)
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => `${n.target.join(' ')} → ${n.html.slice(0, 160)}`),
    }));
}

test.describe('acessibilidade (axe)', () => {
  for (const path of ['/login', '/register', '/forgot-password']) {
    test(`página pública ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.locator('form').waitFor();
      expect(await violations(page)).toEqual([]);
    });
  }

  test('páginas logadas: lista, ficha, lore, magias e perfil', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Accessible Hero');
    for (const path of [
      '/characters',
      characterUrl(id),
      characterUrl(id, '/lore'),
      characterUrl(id, '/spells'),
      '/settings/profile',
    ]) {
      await page.goto(path);
      await page.getByRole('main').first().waitFor();
      await page.waitForTimeout(500); // client data (character, profile) settles
      expect.soft(await violations(page), path).toEqual([]);
    }
  });

  // The player picks any color; text in that color is lightened until it reads on the dark theme
  for (const accentColor of ['#fde047', '#1e1b4b', '#7f1d1d']) {
    test(`cor de destaque ${accentColor} continua legível`, async ({ page, user: _ }) => {
      const id = await createCharacter(page, 'Colorful Hero');
      const res = await page.request.put(`/api/characters/${id}`, {
        data: { updates: { accentColor } },
      });
      expect(res.ok()).toBe(true);

      for (const path of ['/characters', characterUrl(id)]) {
        await page.goto(path);
        await page.getByRole('main').first().waitFor();
        await page.waitForTimeout(500);
        expect.soft(await violations(page), path).toEqual([]);
      }
    });
  }
});
