import { characterUrl, createCharacter, expect, test } from './support/fixtures';

test('aprende, prepara e esquece uma magia', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Elminster');
  await page.goto(characterUrl(id, '/spells'));

  // Learn Fireball from the catalog
  await page.getByRole('button', { name: 'Add Spell' }).click();
  const catalog = page.getByRole('dialog', { name: 'Spell list' });
  const search = catalog.getByPlaceholder('Spell name (e.g.: fireball)');
  await search.fill('fire');
  await search.press('Enter');
  const fireballInCatalog = catalog.getByRole('article', { name: /Fireball/ });
  await expect(catalog.getByRole('article')).toHaveCount(1);
  await fireballInCatalog.getByRole('button', { name: /Expand Fireball/ }).click();
  await fireballInCatalog.getByRole('button', { name: 'Learn' }).click();
  await expect(page.getByText('Spell learned!')).toBeVisible();
  await page.keyboard.press('Escape');

  // It shows up in the spellbook, under its level
  const fireball = page.getByRole('article', { name: /Fireball/ });
  await page.getByRole('tab', { name: /Level 3/ }).click();
  await fireball.getByRole('button', { name: /Expand Fireball/ }).click();
  await fireball.getByRole('button', { name: 'Prepare spell' }).click();
  await expect(page.getByText('Spell prepared.')).toBeVisible();
  await expect(page.getByText('1 prepared')).toBeVisible();

  // Learned and prepared state come from the server
  await page.reload();
  await expect(page.getByText('1 prepared')).toBeVisible();

  await page.getByRole('tab', { name: /Level 3/ }).click();
  await fireball.getByRole('button', { name: /Expand Fireball/ }).click();
  await fireball.getByRole('button', { name: 'Forget spell' }).click();
  await expect(page.getByText('Spell forgotten.')).toBeVisible();
  await expect(fireball).toHaveCount(0);
});
