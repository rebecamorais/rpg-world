import type { Locator, Page } from '@playwright/test';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';
import { packBackpack } from './support/inventory';

/**
 * Phone blockers of cause 5 (destructive action under the finger) and decision 4 (toasts at the
 * top) of the phase 1 review (docs/revisao-telas/fase-1-resultados.md). 390px, as in the review.
 */
test.use({ viewport: { width: 390, height: 844 } });

/** Taps the same spot `times` times, quickly, like a finger that doesn't move. */
async function tapSpot(page: Page, target: Locator, times: number) {
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  for (let i = 0; i < times; i++) await page.touchscreen.tap(x, y);
}

const ITEMS = [
  { id: 'rope', quantity: 2 },
  { id: 'torch', quantity: 1 },
  { id: 'bedroll', quantity: 1 },
  { id: 'blanket', quantity: 1 },
  { id: 'candle', quantity: 1 },
];

test.describe('interação segura no celular', () => {
  test('três toques rápidos no − de um item com 2 param em 1 e não apagam nada', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Thumbs');
    await packBackpack(page, id, ITEMS);
    await page.goto(characterUrl(id, '/inventory'));

    const less = await hydrated(page.getByRole('button', { name: 'One less Rope' }));
    await less.scrollIntoViewIfNeeded();
    // The trash isn't where − is
    const lessBox = (await less.boundingBox())!;
    const trashBox = (await page.getByRole('button', { name: 'Remove Rope' }).boundingBox())!;
    const overlaps =
      lessBox.x < trashBox.x + trashBox.width &&
      trashBox.x < lessBox.x + lessBox.width &&
      lessBox.y < trashBox.y + trashBox.height &&
      trashBox.y < lessBox.y + lessBox.height;
    expect(overlaps).toBe(false);
    // 44px to the touch
    expect(lessBox.width).toBeGreaterThanOrEqual(44);
    expect(lessBox.height).toBeGreaterThanOrEqual(44);

    const patched = page.waitForResponse(
      (r) => r.request().method() === 'PATCH' && r.url().includes('/inventory/items/') && r.ok(),
    );
    await tapSpot(page, less, 3);
    await patched;

    // Before: at 1 the − became the trash, the item left, the list moved up and the third tap
    // removed the item below
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('1');
    await expect(less).toBeDisabled();
    await page.reload();
    await expect(page.getByLabel('Quantity of Rope')).toHaveText('1');
    for (const name of ['Torch', 'Bedroll', 'Blanket', 'Candle']) {
      await expect(page.getByLabel(`Quantity of ${name}`)).toHaveText('1');
    }
  });

  test('toques repetidos na lixeira removem só aquele item: a linha segura o lugar', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Butterfingers');
    await packBackpack(page, id, ITEMS);
    await page.goto(characterUrl(id, '/inventory'));

    const trash = await hydrated(page.getByRole('button', { name: 'Remove Torch' }));
    await trash.scrollIntoViewIfNeeded();
    const deleted = page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && r.url().includes('/inventory/items/') && r.ok(),
    );
    await tapSpot(page, trash, 3);
    await deleted;

    // The removed row stays, with its own Undo, until the toast goes
    await expect(page.getByRole('button', { name: 'Undo removing Torch' })).toBeVisible();
    await expect(page.getByText('Torch removed')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Quantity of Torch')).toHaveCount(0);
    for (const name of ['Rope', 'Bedroll', 'Blanket', 'Candle']) {
      await expect(page.getByLabel(`Quantity of ${name}`)).toBeVisible();
    }
  });

  test('os toasts aparecem no topo, abaixo da área segura', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Notified');
    await packBackpack(page, id, ITEMS);
    await page.goto(characterUrl(id, '/inventory'));

    await (await hydrated(page.getByRole('button', { name: 'Remove Candle' }))).click();
    const toast = page.locator('[data-sonner-toast]').filter({ hasText: 'Candle removed' });
    await expect(toast).toBeVisible();
    // Sonner slides it in from above the screen: measure once it has landed
    await expect(toast).toHaveAttribute('data-mounted', 'true');
    await expect.poll(async () => (await toast.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0);
    const box = (await toast.boundingBox())!;
    expect(box.y).toBeLessThan(844 / 3);
    expect(box.y).toBeGreaterThanOrEqual(0);

    // The tab bar at the bottom stays free
    const tabs = page.getByRole('navigation', { name: 'Sheet tabs' });
    const tabsBox = (await tabs.boundingBox())!;
    expect(box.y + box.height).toBeLessThan(tabsBox.y);
  });
});
