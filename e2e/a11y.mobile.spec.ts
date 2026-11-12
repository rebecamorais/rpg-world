import { violations } from './support/axe';
import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test.describe('acessibilidade no celular', () => {
  for (const path of ['/', '/login', '/demo', '/demo/characters/mirela']) {
    test(`página pública ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('main').waitFor();
      await page.waitForTimeout(300);
      expect(await violations(page)).toEqual([]);
    });
  }

  test('ficha e lista logadas', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Pocket Hero');
    for (const path of ['/characters', characterUrl(id), characterUrl(id, '/spells')]) {
      await page.goto(path);
      await page.getByRole('main').first().waitFor();
      await page.waitForTimeout(500);
      expect.soft(await violations(page), path).toEqual([]);
    }
  });

  test('gaveta do menu: axe, foco preso e Escape devolve o foco', async ({ page, user: _ }) => {
    await page.goto('/characters');
    const trigger = await hydrated(
      page.getByRole('banner').getByRole('button', { name: 'Open menu' }),
    );
    await trigger.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(300);
    expect(await violations(page, { include: '[role="dialog"]' })).toEqual([]);

    // Tabbing never leaves the open drawer
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
