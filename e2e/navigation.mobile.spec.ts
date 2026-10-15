import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';
import { SPELLS } from './support/global-setup';

test.describe('celular', () => {
  test('navega pelo menu em gaveta', async ({ page, user: _ }) => {
    await page.goto('/characters');
    // On small screens the sidebar opens from a button in the header
    await expect(page.getByRole('complementary')).toBeHidden();

    await page.getByRole('banner').getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await drawer.getByRole('link', { name: 'My Profile' }).click();

    await expect(page).toHaveURL(/\/settings\/profile$/);
  });

  test('pula para um nível do grimório pelo índice', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Pocket Wizard');
    for (const spell of [SPELLS.light, SPELLS.fireball]) {
      const res = await page.request.post(`/api/characters/${id}/spells`, {
        data: { id: spell.id, action: 'learn' },
      });
      expect(res.ok()).toBe(true);
    }
    await page.goto(characterUrl(id, '/spells'));
    await expect(page.getByRole('heading', { name: 'Cantrips' })).toBeVisible();

    const index = page.getByRole('navigation', { name: 'Index' });
    await index.getByRole('link', { name: /Level 3/ }).click();

    await expect(page.getByRole('heading', { name: 'Level 3 Spells' })).toBeInViewport();
    await expect(page.getByRole('article', { name: /Fireball/ })).toBeInViewport();
    // The index stays on screen (sticky) to jump back
    await expect(index).toBeInViewport();
  });

  test('filtra magias pelo painel de filtros do modal', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Pocket Wizard');
    await page.goto(characterUrl(id, '/spells'));
    await page.getByRole('button', { name: 'Add Spell' }).first().click();
    const catalog = page.getByRole('dialog', { name: 'Spell list' });

    // Only the search is on screen until the filters are opened
    const level = catalog.getByRole('combobox', { name: 'Level' });
    await expect(level).toBeHidden();
    await catalog.getByRole('button', { name: 'Filters', exact: true }).click();
    await level.click();
    await page.getByRole('option', { name: 'Level 3' }).click();

    await expect(catalog.getByRole('button', { name: 'Filters (1)', exact: true })).toBeVisible();
    await expect(catalog.getByRole('article')).toHaveCount(1);
    await expect(catalog.getByRole('article', { name: /Fireball/ })).toBeVisible();
  });

  test('exclui um personagem pela lista', async ({ page, user: _ }) => {
    await createCharacter(page, 'Tiny Hero');
    await page.goto('/characters');

    await page.getByRole('button', { name: /^Actions for / }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete character?' });
    await dialog.getByPlaceholder('Type the exact name here').fill('Tiny Hero');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('No characters yet')).toBeVisible();
  });
});

test('no celular, salva pela barra fixa que aparece com alterações', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Thumb Hero');
  await page.goto(characterUrl(id));

  await (await hydrated(page.getByRole('button', { name: 'Lose 1 HP' }))).click();

  const bar = page.locator('body > div').filter({ hasText: 'Unsaved changes' }).last();
  await bar.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByText('Character saved successfully!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeHidden();
});
