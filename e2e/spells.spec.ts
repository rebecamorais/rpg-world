import { characterUrl, createCharacter, expect, test } from './support/fixtures';

test('aprende, prepara e esquece uma magia', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  // Learn Fireball from the catalog
  // The empty spellbook also offers it; use the page header's
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
  await page.keyboard.press('Escape');

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
