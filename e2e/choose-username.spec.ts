import { characterUrl, createCharacter, expect, hydrated, signIn, test } from './support/fixtures';
import { createUser } from './support/supabase';

test.describe('escolher o username', () => {
  test('conta nova é levada a escolher o username antes do dashboard', async ({ page }) => {
    const user = await createUser('choose-username', undefined, { usernameChosen: false });
    await signIn(page, user);

    await page.goto('/characters');
    await expect(page).toHaveURL(/\/choose-username$/);
    await expect(page.getByRole('heading', { name: 'Choose your username' })).toBeVisible();
    await expect(page.getByLabel('Username')).toHaveValue('');

    await (await hydrated(page.getByLabel('Username'))).fill(`aria_${Date.now() % 100000}`);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/characters$/);
    await expect(page.getByRole('heading', { name: 'Characters' })).toBeVisible();
  });

  test('abrir uma ficha direto também passa pela escolha', async ({ page }) => {
    const user = await createUser('choose-username-sheet', undefined, { usernameChosen: false });
    await signIn(page, user);
    const id = await createCharacter(page, 'Waiting Hero');

    await page.goto(characterUrl(id));

    await expect(page).toHaveURL(/\/choose-username$/);
  });
});
