import type { Page } from '@playwright/test';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';
import { packBackpack } from './support/inventory';

/**
 * Blockers of causes 4 (toaster over modals) and 5 (destructive action under the finger) of the
 * phase 1 review (docs/revisao-telas/fase-1-resultados.md).
 */

/** The spell search open on Fireball (and "Delayed Blast Fireball", which matches too). */
async function searchFireball(page: Page, characterId: string) {
  await page.goto(characterUrl(characterId, '/spells'));
  // The empty spellbook also offers it; use the page header's
  await (await hydrated(page.getByRole('button', { name: 'Add Spell' }).first())).click();
  const catalog = page.getByRole('dialog', { name: 'Spell list' });
  await catalog.getByRole('searchbox', { name: 'Search spells' }).fill('fireball');
  await expect(catalog.getByRole('article')).toHaveCount(2);
  return { catalog, fireball: catalog.getByRole('article', { name: /^Fireball/ }) };
}

/** Resolves once `n` inventory writes with `method` have succeeded. */
function inventoryWrites(page: Page, method: string, n: number) {
  let count = 0;
  return page.waitForResponse(
    (r) =>
      r.request().method() === method &&
      r.url().includes('/inventory/items') &&
      r.ok() &&
      ++count === n,
  );
}

/** Every spellbook write the page sends. */
function spellWrites(page: Page) {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/characters\/[^/]+\/spells/.test(request.url())) {
      writes.push(request.postData() ?? '');
    }
  });
  return writes;
}

test.describe('interação segura', () => {
  test('na busca de magias, o Desfazer do toast funciona com o modal aberto', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Undoer');
    const { catalog, fireball } = await searchFireball(page, id);
    await fireball.getByRole('button', { name: 'Learn spell' }).click();
    await expect(fireball.getByText('Learned')).toBeVisible();

    // The check forgets it, after asking
    await fireball.getByRole('button', { name: 'Forget spell' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('Fireball leaves the spellbook');
    await confirm.getByRole('button', { name: 'Forget', exact: true }).click();
    await expect(page.getByText('Spell forgotten.')).toBeVisible();
    await expect(fireball.getByText('Learned')).toHaveCount(0);

    // Before: the click fell on the modal's overlay, the modal closed and the spell stayed forgotten.
    // By role, inside the toasts' region: the modal must not hide it from screen readers either
    const toasts = page.getByRole('region', { name: /Notifications/ });
    await toasts.getByRole('button', { name: 'Undo' }).click();
    await expect(catalog).toBeVisible();
    await expect(fireball.getByText('Learned')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.getByRole('article', { name: /Fireball/ })).toHaveCount(1);
  });

  test('esquecer pede confirmação; cancelar mantém a magia', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Doubter');
    const writes = spellWrites(page);
    const { fireball } = await searchFireball(page, id);
    await fireball.getByRole('button', { name: 'Learn spell' }).click();
    await expect(fireball.getByText('Learned')).toBeVisible();

    await fireball.getByRole('button', { name: 'Forget spell' }).click();
    const confirm = page.getByRole('alertdialog');
    // Cancel has the focus: an Enter right after the tap forgets nothing
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(confirm).toBeHidden();

    await expect(fireball.getByText('Learned')).toBeVisible();
    expect(writes.filter((body) => body.includes('"forget"'))).toEqual([]);
  });

  test('duplo clique em aprender manda uma requisição só', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Eager');
    const writes = spellWrites(page);
    const { fireball } = await searchFireball(page, id);

    await fireball.getByRole('button', { name: 'Learn spell' }).dblclick();
    await expect(fireball.getByText('Learned')).toBeVisible();
    await expect(page.getByText('Spell learned!')).toHaveCount(1);

    // The second click must not have forgotten it either (nor asked to)
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('"learn"');
  });

  test('duas remoções seguidas: um toast só, e o Desfazer devolve as duas', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Clumsy');
    await packBackpack(page, id, [
      { id: 'rope', quantity: 1 },
      { id: 'torch', quantity: 3 },
      { id: 'bedroll', quantity: 1 },
    ]);
    await page.goto(characterUrl(id, '/inventory'));

    const bothDeleted = inventoryWrites(page, 'DELETE', 2);
    await (await hydrated(page.getByRole('button', { name: 'Remove Torch' }))).click();
    await page.getByRole('button', { name: 'Remove Bedroll' }).click();
    await bothDeleted;

    // Before: two toasts stacked, and the first one's Undo hid behind the second
    await expect(page.getByText('2 items removed')).toBeVisible();
    await expect(page.getByText('Torch removed')).toHaveCount(0);

    const restored = inventoryWrites(page, 'POST', 2);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await restored;

    await page.reload();
    await expect(page.getByLabel('Quantity of Torch')).toHaveText('3');
    await expect(page.getByLabel('Quantity of Bedroll')).toHaveText('1');
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('1');
  });
});
