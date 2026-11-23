import type { Page } from '@playwright/test';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

// "10 lb" or "5 kg", by the screen's language
const WEIGHT = /\d\s?(lb|kg)$/;

// text-transform is checked with the retrying toHaveCSS, not a one-shot getComputedStyle: the
// list re-renders after an item is added, and a read on a just-detached node returns ""

async function addRope(page: Page) {
  await (await hydrated(page.getByRole('button', { name: 'Add item' }).first())).click();
  const catalog = page.getByRole('dialog', { name: 'Add item' });
  await catalog.getByRole('searchbox', { name: 'Search items' }).fill('rope');
  // The weight in the catalog row keeps its unit's case ("10 lb", not "10 LB")
  const rope = catalog.getByRole('button', { name: 'Add Rope', exact: true });
  await expect(rope.getByText(WEIGHT)).toBeVisible();
  await expect(rope.getByText(WEIGHT)).toHaveCSS('text-transform', 'none');
  const written = page.waitForResponse(
    (r) => r.url().includes('/inventory/items') && r.request().method() === 'POST' && r.ok(),
  );
  await rope.click();
  await written;
  await expect(catalog).toBeHidden();
}

// text-label (uppercase, spaced) is for short labels; sentences, units and buttons keep their case
test.describe('text-label só em rótulos curtos (causa 8)', () => {
  test('em 320px o "Add item" fica dentro do card, e o botão e o peso não ficam em caixa alta', async ({
    page,
    user: _,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const id = await createCharacter(page, 'Packrat');
    await page.goto(characterUrl(id, '/inventory'));
    await addRope(page);

    // The SectionCard around the Backpack heading
    const backpack = page
      .getByRole('heading', { name: 'Backpack', level: 2 })
      .locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " rounded-xl ")][1]');
    const add = backpack.getByRole('button', { name: 'Add item' });
    await expect(add).toBeVisible();
    await expect(add).toHaveCSS('text-transform', 'none');

    // The header wraps instead of pushing the button past the card's right edge
    const card = await backpack.boundingBox();
    const button = await add.boundingBox();
    expect(card && button).toBeTruthy();
    expect(button!.x + button!.width).toBeLessThanOrEqual(card!.x + card!.width);
    // And the page itself doesn't scroll sideways
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );

    // The group's weight ("10 lb") keeps its unit's case; the group's name is the label
    const group = backpack.getByRole('region').first();
    const weight = group.getByText(WEIGHT).first();
    await expect(weight).toHaveCSS('text-transform', 'none');
    await expect(group.getByRole('heading', { level: 3 })).toHaveCSS('text-transform', 'uppercase');
  });

  test('o botão "Add spell" do grimório não fica em caixa alta', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Elminster');
    await page.goto(characterUrl(id, '/spells'));

    const add = await hydrated(page.getByRole('button', { name: 'Add spell' }).first());
    await expect(add).toHaveCSS('text-transform', 'none');
  });
});
