import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('no celular, a faixa do descanso fica acima da barra de abas e o "go" recolhe', async ({
  page,
  user: _,
}) => {
  // The project's phone (Pixel 7) as is: resizing an emulated mobile viewport left the page
  // scrolled sideways, and the sheet then took the "go" taps meant for the bar
  const id = await createCharacter(page, 'Phone Monk');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: {
      updates: { class: 'Monk', level: 5, edition: '2014', attributes: { WIS: 14, DEX: 16 } },
    },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id));

  const shortRest = await hydrated(page.getByRole('button', { name: 'Short rest' }));
  // The header's actions wrap: nothing widens the page past the phone
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width);
  await shortRest.click();
  const bar = page.getByRole('complementary', { name: /^Short rest/ });
  await expect(bar).toBeVisible();

  const tabBar = page.getByRole('navigation', { name: 'Sheet tabs' });
  const barBox = await bar.boundingBox();
  const tabBox = await tabBar.boundingBox();
  expect(barBox).not.toBeNull();
  expect(tabBox).not.toBeNull();
  expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(tabBox!.y + 1);

  // Open by default; "go" on the hit dice item scrolls there and collapses the bar
  const toggle = bar.getByRole('button', { name: /^Short rest/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await bar.getByRole('button', { name: /^go: (Roll|Spend hit dice)/ }).click();

  await expect(page.locator('#sheet-hit-dice')).toBeInViewport();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
