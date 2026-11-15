import type { Locator, Page } from '@playwright/test';

import { BASE_URL } from './support/env';
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
  test,
} from './support/fixtures';

// Fixed bars and breakpoints that ignored the side menu (causa 6 of the phase 1 review)

/** No text in the locator's elements runs past its own box (cut by overflow or truncate). */
async function expectNoOverflow(locator: Locator) {
  const cut = await locator.evaluateAll((elements) =>
    elements
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => el.textContent?.trim() ?? ''),
  );
  expect(cut, 'elements whose content runs past their box').toEqual([]);
}

/** `inner` sits inside `outer`, on screen: nothing of it is cut by the outer's overflow. */
async function expectInside(inner: Locator, outer: Locator) {
  const [a, b] = [await inner.boundingBox(), await outer.boundingBox()];
  expect(a && b, 'both on screen').toBeTruthy();
  expect(a!.x).toBeGreaterThanOrEqual(b!.x - 1);
  expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x + b!.width + 1);
}

/** What the user would hit tapping the middle of the locator is the locator itself. */
async function expectOnTop(page: Page, locator: Locator) {
  const box = (await locator.boundingBox())!;
  const hit = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('a, button')?.textContent ?? null,
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  expect(hit).toBe(await locator.textContent());
}

/**
 * The side menu kept open, as someone who pinned it: with no saved choice it's a rail below
 * 1024px, and these check the widest menu next to the page.
 */
async function pinMenu(page: Page) {
  await page.context().addCookies([{ name: 'sidebar-pinned', value: 'true', url: BASE_URL }]);
}

// 640 is a 1280px desktop at 200% zoom; up to 767 the side menu shows and the tab bar too
for (const width of [640, 700, 767]) {
  test(`em ${width}px a barra de abas começa à direita do menu lateral`, async ({
    page,
    user: _,
  }) => {
    await pinMenu(page);
    await page.setViewportSize({ width, height: 800 });
    const id = await createCharacter(page, 'Side Hero');
    await page.goto(characterUrl(id));

    const tabs = page.getByRole('navigation', { name: 'Sheet tabs' });
    await expect(tabs).toBeVisible();
    const menu = (await page.getByTestId('sidebar-panel').boundingBox())!;
    const bar = (await tabs.boundingBox())!;
    expect(bar.x).toBeGreaterThanOrEqual(menu.x + menu.width - 1);

    // Status and Lore were the ones under the menu
    await expectOnTop(page, tabs.getByRole('link', { name: 'Status' }));
    await expectOnTop(page, tabs.getByRole('link', { name: 'Lore' }));
  });
}

test('os números de combate mostram só o ícone, e o nome abre no ícone', async ({
  page,
  user: _,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const id = await createCharacter(page, 'Label Hero');
  await page.goto(characterUrl(id));

  // The combat card's header (the hit dice block sits in its grid): five numbers in one row,
  // icon and value only
  const header = page.locator('#sheet-hit-dice').locator('xpath=../..');
  const blocks = header.locator(':scope > .grid > *');
  await expect(blocks).toHaveCount(5);
  const tops = await blocks.evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  expect(new Set(tops).size).toBe(1);
  // Each icon names its number: on hover with a mouse, on tap on a phone
  for (const label of ['AC', 'Initiative', 'Speed', 'Hit Dice', 'Passive Perception']) {
    await expect(header.getByRole('button', { name: `What is ${label}?` })).toBeVisible();
  }
  await (await hydrated(header.getByRole('button', { name: 'What is Speed?' }))).hover();
  await expect(page.getByRole('tooltip')).toContainText('Speed');
  await page.mouse.move(0, 0);
  await header.getByRole('button', { name: 'What is Initiative?' }).click();
  await expect(page.getByRole('tooltip')).toContainText('Added to the d20');
});

test('em 768px com o menu aberto o card de combate cabe inteiro', async ({ page, user: _ }) => {
  await pinMenu(page);
  await page.setViewportSize({ width: 768, height: 1000 });
  const id = await createCharacter(page, 'Narrow Hero');
  await page.goto(characterUrl(id));

  const hp = page.locator('#sheet-hp');
  await expect(hp).toBeVisible();
  // The − and + of the HP were cut by the card's overflow
  await expectInside(page.getByRole('button', { name: 'Lose 1 HP' }), hp);
  await expectInside(page.getByRole('button', { name: 'Heal 1 HP' }), hp);
  // No stat label nor value runs out of its block ("5d8", "30m", "PASSIVE PE…")
  const header = page.locator('#sheet-hit-dice').locator('xpath=../..');
  await expectNoOverflow(header.locator('.text-label'));
  await expectNoOverflow(header.locator('.font-mono'));
});

test('a ficha no painel lateral da mesa não estoura o card de combate', async ({
  page,
  browser,
  user: _,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { id: partyId, code } = await createParty(page, 'Mesa do Painel');
  const player = await person(browser, 'panel-player');
  const characterId = await createCharacter(player.page, 'Arani');
  await joinParty(page, player.page, player.user.id, partyId, code);
  await bring(player.page, partyId, [characterId]);

  await page.goto(partyUrl(partyId));
  await (await hydrated(page.getByRole('button', { name: 'View sheet Arani' }))).click();
  const panel = page.getByRole('dialog', { name: 'Arani' });
  const hp = panel.locator('#sheet-hp');
  await expect(hp).toBeVisible();

  // The panel is far narrower than the 1280px screen: the card follows its own width
  const header = panel.locator('#sheet-hit-dice').locator('xpath=../..');
  await expectNoOverflow(header.locator('.text-label'));
  await expectNoOverflow(header.locator('.font-mono'));
  await expectInside(panel.getByRole('button', { name: 'Lose 1 HP' }), hp);
  await player.context.close();
});
