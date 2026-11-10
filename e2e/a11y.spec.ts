import { violations } from './support/axe';
import {
  characterUrl,
  createCharacter,
  createParty,
  expect,
  hydrated,
  joinParty,
  partyUrl,
  person,
  test,
} from './support/fixtures';
import { adminClient } from './support/supabase';

/** Every page has one main landmark and one h1, so screen readers can jump straight to it. */
async function landmarks(page: import('@playwright/test').Page) {
  return {
    main: await page.locator('main, [role="main"]').count(),
    h1: await page.locator('h1').count(),
  };
}

test.describe('acessibilidade (axe)', () => {
  for (const path of ['/', '/features', '/login', '/register', '/forgot-password', '/demo']) {
    test(`página pública ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('main').waitFor();
      await page.waitForTimeout(300);
      expect(await violations(page)).toEqual([]);
      expect(await landmarks(page)).toEqual({ main: 1, h1: 1 });
    });
  }

  test('modal de bug report do cabeçalho', async ({ page }) => {
    await page.goto('/');
    const trigger = await hydrated(
      page.getByRole('banner').getByRole('button', { name: 'Report a bug' }),
    );
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Talk to the Game Master' });
    await dialog.getByLabel('Message', { exact: true }).waitFor();
    await page.waitForTimeout(300);
    expect(await violations(page)).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

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
      expect.soft(await landmarks(page), path).toEqual({ main: 1, h1: 1 });
    }
  });

  // The player picks any color, a preset or their own; text in that color is adjusted until it
  // reads on both themes
  for (const accentColor of [
    '#fde047',
    '#1e1b4b',
    '#7f1d1d',
    '#ef4444',
    '#3b82f6',
    '#ec4899',
    '#a855f7',
  ]) {
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

  test('mesa sem mestre: sem pedido, com pedido (candidato e quem vota) e com o suporte liberado', async ({
    page,
    browser,
    user,
  }) => {
    const { id, code } = await createParty(page, 'Accessible Table');
    const bia = await person(browser, 'a11y-bia');
    const caio = await person(browser, 'a11y-caio');
    await joinParty(page, bia.page, bia.user.id, id, code);
    await joinParty(page, caio.page, caio.user.id, id, code);
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    expect(error).toBeNull();

    const check = async (who: typeof bia, label: string) => {
      await who.page.goto(partyUrl(id));
      await expect(who.page.getByText('This party has no GM').first()).toBeVisible();
      await who.page.waitForTimeout(500);
      expect.soft(await violations(who.page), label).toEqual([]);
      expect.soft(await landmarks(who.page), label).toEqual({ main: 1, h1: 1 });
    };

    await check(bia, 'sem pedido');
    expect((await bia.page.request.post(`/api/parties/${id}/gm-claim`)).ok()).toBe(true);
    await check(bia, 'candidato');
    await check(caio, 'quem vota');
    await adminClient()
      .from('party_gm_claims')
      .update({ created_at: new Date(Date.now() - 2 * 86_400_000).toISOString() })
      .eq('party_id', id);
    await check(caio, 'suporte liberado');

    await bia.context.close();
    await caio.context.close();
  });
});
