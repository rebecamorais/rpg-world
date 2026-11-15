import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('ficha antiga de Monge: escolhe a edição, gasta Ki e usa o descanso curto', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Old Monk');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: { updates: { class: 'Monk', level: 5, attributes: { WIS: 14, DEX: 16 } } },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id));

  // No edition yet: the card offers it, and the Ki Points box is not there
  await expect(page.getByText('New: class resources')).toBeVisible();
  await expect(page.locator('#sheet-resources')).toHaveCount(0);

  await (await hydrated(page.getByRole('button', { name: '2014', exact: true }))).click();

  const resources = page.locator('#sheet-resources');
  await expect(resources).toBeVisible();
  await expect(resources.getByRole('group', { name: 'Ki Points, 5 of 5 available' })).toBeVisible();

  await resources.getByRole('button', { name: 'Ki Points 1, available' }).click();
  await expect(resources.getByRole('group', { name: 'Ki Points, 4 of 5 available' })).toBeVisible();

  await page.reload();
  await expect(
    page.locator('#sheet-resources').getByRole('group', { name: 'Ki Points, 4 of 5 available' }),
  ).toBeVisible();

  await (await hydrated(page.getByRole('button', { name: 'Short rest' }))).click();
  const checklist = page.getByRole('complementary', { name: /^Short rest/ });
  await expect(checklist.getByText('Ki Points returns: all')).toBeVisible();

  await checklist.getByRole('button', { name: 'Done' }).click();
  await expect(checklist).toBeHidden();
});
