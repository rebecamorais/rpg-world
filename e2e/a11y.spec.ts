import { violations } from './support/axe';
import {
  bring,
  characterUrl,
  createCharacter,
  createParty,
  expect,
  hydrated,
  joinParty,
  partyUrl,
  person,
  signIn,
  test,
} from './support/fixtures';
import { adminClient, createUser } from './support/supabase';

/** Every page has one main landmark and one h1, so screen readers can jump straight to it. */
async function landmarks(page: import('@playwright/test').Page) {
  return {
    main: await page.locator('main, [role="main"]').count(),
    h1: await page.locator('h1').count(),
  };
}

test.describe('acessibilidade (axe)', () => {
  for (const path of [
    '/',
    '/features',
    '/login',
    '/register',
    '/forgot-password',
    '/privacy',
    '/terms',
    '/support',
    '/auth/error',
    '/demo',
    '/demo?mode=combat',
    '/demo/npcs',
    '/demo/inventory',
    '/demo/characters/mirela',
    '/demo/characters/mirela/lore',
    '/demo/characters/mirela/spells',
    '/demo/characters/mirela/inventory',
  ]) {
    test(`página pública ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('main').waitFor();
      await page.waitForTimeout(300);
      expect(await violations(page)).toEqual([]);
      expect(await landmarks(page)).toEqual({ main: 1, h1: 1 });
    });
  }

  // The skip link is the first stop and lands on the content, past header and sidebar
  for (const path of ['/', '/demo', '/characters']) {
    test(`pular para o conteúdo em ${path}`, async ({ page }) => {
      if (path === '/characters') await signIn(page, await createUser('a11y-skip'));
      await page.goto(path);
      await hydrated(page.getByRole('main').first());
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Skip to content' });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
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
    test.setTimeout(90_000); // a dozen pages, axe twice on each (one per theme)
    const id = await createCharacter(page, 'Accessible Hero');
    for (const path of [
      '/characters',
      '/characters/new',
      '/characters/npcs',
      '/enemies',
      '/parties',
      characterUrl(id),
      characterUrl(id, '/lore'),
      characterUrl(id, '/spells'),
      characterUrl(id, '/inventory'),
      characterUrl(id, '/appearance'),
      '/settings/profile',
      '/change-password',
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

  test('escolha de nome de usuário', async ({ page }) => {
    await signIn(page, await createUser('a11y-username', undefined, { usernameChosen: false }));
    await page.goto('/choose-username');
    await page.getByRole('main').first().waitFor();
    await page.waitForTimeout(300);
    expect(await violations(page)).toEqual([]);
    expect(await landmarks(page)).toEqual({ main: 1, h1: 1 });
  });

  test('mesa: visão do mestre, do jogador e do convite', async ({ page, browser, user: _ }) => {
    test.setTimeout(90_000);
    const { id, code } = await createParty(page, 'Accessible Party');
    const bia = await person(browser, 'a11y-party-bia');
    await joinParty(page, bia.page, bia.user.id, id, code);
    await bring(bia.page, id, [await createCharacter(bia.page, 'Bia Hero')]);
    const outsider = await person(browser, 'a11y-party-out');

    const check = async (who: import('@playwright/test').Page, path: string, label: string) => {
      await who.goto(path);
      await who.getByRole('main').first().waitFor();
      await who.waitForTimeout(500);
      expect.soft(await violations(who), label).toEqual([]);
      expect.soft(await landmarks(who), label).toEqual({ main: 1, h1: 1 });
    };

    for (const tab of ['', '/inventory', '/journal', '/settings']) {
      await check(page, partyUrl(id, tab), `mestre ${tab || '/'}`);
    }
    for (const tab of ['', '/inventory', '/journal']) {
      await check(bia.page, partyUrl(id, tab), `jogador ${tab || '/'}`);
    }
    await check(outsider.page, `/parties/join/${code}`, 'convite');

    await bia.context.close();
    await outsider.context.close();
  });

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
