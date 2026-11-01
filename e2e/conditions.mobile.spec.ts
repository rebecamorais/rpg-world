import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('o toque na condição de uma magia abre o popover, e o toque fora fecha', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Elminster');
  const learn = await page.request.post(`/api/characters/${id}/spells`, {
    data: { id: 'dnd5e:srd-5.2:spell:hold-person', action: 'learn' },
  });
  expect(learn.ok()).toBe(true);
  await page.goto(characterUrl(id, '/spells'));

  const card = page.getByRole('article', { name: /Hold Person/ });
  await (await hydrated(card.getByRole('button', { name: /Expand Hold Person/ }))).tap();
  await card.locator('p').getByRole('button', { name: 'Paralyzed, condition' }).tap();

  const popover = page.getByRole('dialog');
  await expect(popover).toContainText('While you have the Paralyzed condition');
  const box = await popover.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.mouse.click(5, page.viewportSize()!.height - 5);
  await expect(popover).toBeHidden();
});
