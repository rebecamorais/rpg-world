import type { Page } from '@playwright/test';

import { characterUrl, createCharacter, expect, test } from '../support/fixtures';
import { SPELLS } from '../support/global-setup';

/**
 * Visual baselines of the main screens, desktop and phone (`npm run test:visual`).
 * Not part of `test:e2e`: font rendering differs between machines, so the baselines are
 * compared on the machine that made them. Update them on purpose with `-- --update-snapshots`
 * and commit the new images, so the PR shows the visual diff.
 */

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // Client data (profile, character) and image decoding settle
  await page.waitForTimeout(800);
}

async function snap(page: Page, name: string, mask: ReturnType<Page['locator']>[] = []) {
  await settle(page);
  // No screen may scroll sideways: it hides content and breaks fixed controls on phones
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${name} scrolls horizontally`).toBe(0);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, mask });
}

async function heroCharacter(page: Page): Promise<string> {
  const id = await createCharacter(page, 'Arani the Bold');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: {
      updates: {
        class: 'Wizard',
        race: 'High Elf',
        background: 'Sage',
        alignment: 'Neutral Good',
        level: 5,
        xp: 7200,
        accentColor: '#6d28d9',
        ac: 13,
        initiative: 2,
        hpMax: 32,
        hpCurrent: 24,
        hpTemp: 5,
        attributes: { STR: 8, DEX: 14, CON: 13, INT: 18, WIS: 12, CHA: 10 },
        savingThrowProficiencies: { INT: true, WIS: true },
        skills: { ARCANA: { isProficient: true }, HISTORY: { isProficient: true } },
        spellcastingSystem: 'slots',
        spellSlots: {
          '1': { max: 4, used: 1 },
          '2': { max: 3, used: 0 },
          '3': { max: 2, used: 2 },
        },
      },
    },
  });
  expect(res.ok(), `PUT character failed with ${res.status()}`).toBe(true);

  const lore = await page.request.put(`/api/characters/${id}/lore`, {
    data: {
      age: '142',
      eyes: 'Silver',
      backstory: 'Raised among the archives of Candlekeep, Arani left to find a lost spellbook.',
      ideals: 'Knowledge is the path to power and self-improvement.',
    },
  });
  expect(lore.ok(), `PUT lore failed with ${lore.status()}`).toBe(true);

  for (const spell of Object.values(SPELLS)) {
    const learn = await page.request.post(`/api/characters/${id}/spells`, {
      data: { id: spell.id, action: 'learn' },
    });
    expect(learn.ok()).toBe(true);
  }
  const prepare = await page.request.post(`/api/characters/${id}/spells`, {
    data: { id: SPELLS.shield.id, action: 'prepare' },
  });
  expect(prepare.ok()).toBe(true);
  return id;
}

test.describe('telas públicas', () => {
  for (const [name, path] of [
    ['home', '/'],
    ['features', '/features'],
    ['login', '/login'],
    ['register', '/register'],
  ] as const) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('heading').first().waitFor();
      // Turnstile renders a third-party widget whose state we don't control
      await snap(page, name, [page.locator('iframe[src*="challenges.cloudflare.com"]')]);
    });
  }
});

test.describe('telas logadas', () => {
  test.beforeEach(async ({ page, user: _ }, testInfo) => {
    // Fixed username so the sidebar looks the same on every run (the DB is reset per run)
    const res = await page.request.patch('/api/profile', {
      data: {
        username: `${testInfo.project.name}_${testInfo.title}`.replace(/\W+/g, '_').slice(0, 30),
      },
    });
    expect(res.ok(), `PATCH profile failed with ${res.status()}`).toBe(true);
  });

  test('lista vazia', async ({ page, user: _ }) => {
    await page.goto('/characters');
    await page.getByRole('link', { name: 'Create first character' }).waitFor();
    await snap(page, 'characters-empty');
  });

  test('lista, ficha, lore, magias e perfil', async ({ page, user }) => {
    const id = await heroCharacter(page);
    await createCharacter(page, 'Borin Ironfist');

    await page.goto('/characters');
    await expect(page.getByText('Borin Ironfist')).toBeVisible();
    await snap(page, 'characters');

    await page.goto(characterUrl(id));
    await expect(page.getByRole('heading', { name: 'Arani the Bold' })).toBeVisible();
    await snap(page, 'sheet-status');

    await page.goto(characterUrl(id, '/lore'));
    await expect(page.getByText(/Candlekeep/).first()).toBeVisible();
    await snap(page, 'sheet-lore');

    await page.goto(characterUrl(id, '/spells'));
    await expect(page.getByText(SPELLS.light.name).first()).toBeVisible();
    await snap(page, 'sheet-spells');

    await page.getByRole('button', { name: /Expand Fireball/ }).click();
    await snap(page, 'sheet-spells-open');
    // On the header: the open card's chips cover the middle of the toggle
    await page
      .getByRole('button', { name: /Collapse Fireball/ })
      .click({ position: { x: 40, y: 24 } });
    await expect(page.getByRole('button', { name: /Expand Fireball/ })).toBeVisible();

    await page.getByRole('button', { name: 'Add Spell' }).click();
    const catalog = page.getByRole('dialog', { name: 'Spell list' });
    await expect(catalog.getByRole('article')).toHaveCount(Object.keys(SPELLS).length);
    await snap(page, 'spells-search');
    await page.keyboard.press('Escape');

    await page.goto('/settings/profile');
    await page.getByRole('main').first().waitFor();
    await snap(page, 'profile', [page.getByText(user.email)]);
  });
});
