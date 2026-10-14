import { characterUrl, createCharacter, expect, test } from './support/fixtures';
import { SPELLS } from './support/global-setup';

test.describe('celular', () => {
  test('navega pelo menu em gaveta', async ({ page, user: _ }) => {
    await page.goto('/characters');
    // The sidebar is replaced by a floating button on small screens
    await expect(page.getByRole('complementary')).toBeHidden();

    await page.getByRole('button', { name: 'Menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await drawer.getByRole('link', { name: 'My Profile' }).click();

    await expect(page).toHaveURL(/\/settings\/profile$/);
  });

  test('escolhe o nível do grimório pelo seletor', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Pocket Wizard');
    for (const spell of [SPELLS.light, SPELLS.fireball]) {
      const res = await page.request.post(`/api/characters/${id}/spells`, {
        data: { id: spell.id, action: 'learn' },
      });
      expect(res.ok()).toBe(true);
    }
    await page.goto(characterUrl(id, '/spells'));
    await expect(page.getByRole('heading', { name: 'Cantrips' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Index' }).click();
    await page.getByRole('option', { name: 'Level 3' }).click();

    await expect(page.getByRole('heading', { name: 'Level 3 Spells' })).toBeVisible();
    await expect(page.getByRole('article', { name: /Fireball/ })).toBeVisible();
  });

  test('exclui um personagem pela lista', async ({ page, user: _ }) => {
    await createCharacter(page, 'Tiny Hero');
    await page.goto('/characters');

    await page.getByRole('button', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    await dialog.getByPlaceholder('Type the exact name here').fill('Tiny Hero');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('No characters yet')).toBeVisible();
  });
});
