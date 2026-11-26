import type { Page } from '@playwright/test';

import { characterUrl, createCharacter, expect, test } from './support/fixtures';

/**
 * Closes the catalog from the keyboard and waits for its focus to return to Add Spell. The dialog
 * hands focus back a moment after it unmounts: a card focused before that loses it to the button.
 */
async function closeCatalog(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Add Spell' }).first()).toBeFocused();
}

test('aprende, prepara e esquece uma magia', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  // Learn Fireball from the catalog
  // Empty, only the empty state offers it: the header's comes with the first spell
  await page.getByRole('button', { name: 'Add Spell' }).first().click();
  const catalog = page.getByRole('dialog', { name: 'Add Spell' });
  const search = catalog.getByRole('searchbox', { name: 'Search spells' });
  await search.fill('fireball');
  // "Delayed Blast Fireball" matches too
  const fireballInCatalog = catalog.getByRole('article', { name: /^Fireball/ });
  await expect(catalog.getByRole('article')).toHaveCount(2);
  await fireballInCatalog.getByRole('button', { name: 'Learn spell' }).click();
  await expect(page.getByText('Spell learned!')).toBeVisible();
  await expect(fireballInCatalog.getByText('Learned')).toBeVisible();
  await page.keyboard.press('Escape');

  // It shows up in the spellbook, under its level
  const fireball = page.getByRole('article', { name: /Fireball/ });
  await fireball.getByRole('button', { name: 'Prepare spell' }).click();
  await expect(page.getByText('Spell prepared.')).toBeVisible();
  await expect(page.getByText('1 prepared')).toBeVisible();

  // Learned and prepared state come from the server
  await page.reload();
  await expect(page.getByText('1 prepared')).toBeVisible();

  await fireball.getByRole('button', { name: /Expand Fireball/ }).click();
  await fireball.getByRole('button', { name: 'Forget spell' }).click();
  // Forgetting asks first; learning and preparing don't
  await page.getByRole('alertdialog').getByRole('button', { name: 'Forget', exact: true }).click();
  await expect(page.getByText('Spell forgotten.')).toBeVisible();
  await expect(fireball).toHaveCount(0);
});

// b-grimorio#5: the forgotten card unmounts with its button, and focus fell to the page's top
test('esquecer pelo teclado leva o foco ao próximo card', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  await page.getByRole('button', { name: 'Add Spell' }).first().click();
  const catalog = page.getByRole('dialog', { name: 'Add Spell' });
  const search = catalog.getByRole('searchbox', { name: 'Search spells' });
  for (const [query, name] of [
    ['fireball', /^Fireball/],
    ['lightning bolt', /^Lightning Bolt/],
  ] as const) {
    await search.fill(query);
    const card = catalog.getByRole('article', { name });
    await card.getByRole('button', { name: 'Learn spell' }).click();
    await expect(card.getByText('Learned')).toBeVisible();
  }
  await closeCatalog(page);

  // Both are 3rd level, in name order: Fireball, then Lightning Bolt
  const fireball = page.getByRole('article', { name: /Fireball/ });
  const toggle = fireball.getByRole('button', { name: /Expand Fireball/ });
  await toggle.focus();
  await page.keyboard.press('Enter');
  const forget = fireball.getByRole('button', { name: 'Forget spell' });
  await forget.focus();
  await page.keyboard.press('Enter');

  // Cancel has the focus; Tab to Forget and confirm
  const confirm = page.getByRole('alertdialog');
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(confirm.getByRole('button', { name: 'Forget', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(fireball).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Expand Lightning Bolt/ })).toBeFocused();
});

// The open card's background layers cover its toggle button, which hid the button's own ring
test('o anel do teclado aparece no card aberto, por cima do efeito', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  await page.getByRole('button', { name: 'Add Spell' }).first().click();
  const catalog = page.getByRole('dialog', { name: 'Add Spell' });
  await catalog.getByRole('searchbox', { name: 'Search spells' }).fill('fireball');
  const inCatalog = catalog.getByRole('article', { name: /^Fireball/ });
  await inCatalog.getByRole('button', { name: 'Learn spell' }).click();
  await expect(inCatalog.getByText('Learned')).toBeVisible();
  await closeCatalog(page);

  const fireball = page.getByRole('article', { name: /Fireball/ });
  await fireball.getByRole('button', { name: /Expand Fireball/ }).focus();
  await page.keyboard.press('Enter');
  await expect(fireball.getByRole('button', { name: /Collapse Fireball/ })).toBeFocused();

  const ring = await fireball.evaluate((card) => {
    const style = getComputedStyle(card);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(ring).toEqual({ style: 'solid', width: '2px' });

  // Closed again, from the keyboard: the ring stays
  await page.keyboard.press('Enter');
  await expect(fireball.getByRole('button', { name: /Expand Fireball/ })).toBeFocused();
  await expect(fireball).toHaveCSS('outline-style', 'solid');
});
