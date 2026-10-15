import { characterUrl, createCharacter, expect, test } from './support/fixtures';

test('aprende, prepara e esquece uma magia', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  // Learn Fireball from the catalog
  // The empty spellbook also offers it; use the page header's
  await page.getByRole('button', { name: 'Add Spell' }).first().click();
  const catalog = page.getByRole('dialog', { name: 'Spell list' });
  const search = catalog.getByRole('searchbox', { name: 'Search spells' });
  await search.fill('fire');
  const fireballInCatalog = catalog.getByRole('article', { name: /Fireball/ });
  await expect(catalog.getByRole('article')).toHaveCount(1);
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
  await expect(page.getByText('Spell forgotten.')).toBeVisible();
  await expect(fireball).toHaveCount(0);
});
