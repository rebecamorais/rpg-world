import type { Locator } from '@playwright/test';

import { expect, hydrated, test } from './support/fixtures';

// Phase 2 review, header-controles-e-feedback: the header's controls are the phone's main
// navigation, and were 32 to 36px tall

/** Pressing 21px from the control's center (past a 36px box) still lands on it: a 44px target. */
async function expectTouchTarget(control: Locator) {
  const box = (await control.boundingBox())!;
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const hits = await control.evaluate(
    (element, { x, y }) =>
      [
        [x, y - 21],
        [x, y + 21],
        [x - 21, y],
        [x + 21, y],
      ].map(([px, py]) => element.contains(document.elementFromPoint(px, py))),
    center,
  );
  expect(hits, 'top, bottom, left and right of a 44px target').toEqual([true, true, true, true]);
}

test('menu, tema, fale conosco e idioma têm alvo de toque de 44px', async ({ page, user: _ }) => {
  await page.goto('/characters');
  const header = page.getByRole('banner');
  await hydrated(header.getByRole('button', { name: 'Open menu' }));

  for (const control of [
    header.getByRole('button', { name: 'Open menu' }),
    header.getByRole('button', { name: 'Use light theme' }),
    header.getByRole('button', { name: 'Contact us' }),
    header.getByRole('combobox', { name: 'Language' }),
  ]) {
    await expectTouchTarget(control);
  }
});

test('"Fale conosco": o tipo se escolhe dentro e o rascunho não some ao fechar sem querer', async ({
  page,
  user: _,
}) => {
  await page.goto('/characters');
  const trigger = await hydrated(
    page.getByRole('banner').getByRole('button', { name: 'Contact us' }),
  );
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Contact us' });

  await dialog.getByRole('combobox', { name: 'Message Type' }).click();
  await page.getByRole('option', { name: 'Bug', exact: true }).click();
  await dialog
    .getByLabel('Message', { exact: true })
    .fill('The spell list scrolls back to the top.');

  // A tap outside closes it, as Esc does
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();

  await trigger.click();
  await expect(dialog.getByLabel('Message', { exact: true })).toHaveValue(
    'The spell list scrolls back to the top.',
  );
  await expect(dialog.getByRole('combobox', { name: 'Message Type' })).toHaveText(/Bug/);
});
