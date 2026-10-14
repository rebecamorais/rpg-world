import { characterUrl, createCharacter, expect, test } from './support/fixtures';

test('edita a lore e ela continua lá depois de recarregar', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bilbo');
  await page.goto(characterUrl(id, '/lore'));

  await page.getByLabel('Age').fill('111');
  await page.getByLabel('Backstory').fill('Found a ring in a cave.');
  const save = page.getByRole('button', { name: 'Save Changes' });
  await save.click();
  await expect(save).toBeDisabled();

  await page.reload();
  await expect(page.getByLabel('Age')).toHaveValue('111');
  await expect(page.getByLabel('Backstory')).toHaveValue('Found a ring in a cave.');
});
