import { violations } from './support/axe';
import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('jogadora cria, copia e edita caixinhas na configuração, e usa na ficha e no descanso', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Boxed Rogue');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: { updates: { class: 'Monk', level: 5, edition: '2014' } },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id));

  // "edit" on the Resources box lands on the boxes, in the sheet's settings
  await (
    await hydrated(page.locator('#sheet-resources').getByRole('link', { name: 'edit' }))
  ).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sheet settings' })).toBeVisible();
  const settings = page.locator('#class-resources');
  await expect(settings.getByText('Ki Points')).toBeVisible();

  // A box of her own: the name is focused and typed over
  await (await hydrated(settings.getByRole('button', { name: 'Add box' }))).click();
  await expect(settings.getByLabel('Name')).toBeFocused();
  await page.keyboard.type('Ring of Luck');
  const ring = settings.getByRole('group', { name: 'Ring of Luck' });
  await ring.getByLabel('Uses').fill('3');
  await ring.getByRole('combobox', { name: 'Comes back on' }).click();
  await page.getByRole('option', { name: 'Short rest' }).click();
  await ring.getByRole('combobox', { name: 'Comes from' }).click();
  await page.getByRole('option', { name: 'Item' }).click();
  await ring.getByRole('button', { name: 'Red' }).click();
  await ring.getByLabel('Description').fill('Reroll one d20.');
  // The open fields, in both themes
  expect(await violations(page, { include: '#class-resources' })).toEqual([]);
  await settings.getByRole('button', { name: 'Close Ring of Luck' }).click();

  // A resource of another class, copied at her level
  await settings.getByRole('button', { name: 'Copy from a class' }).click();
  await settings.getByRole('combobox', { name: 'Class' }).click();
  await page.getByRole('option', { name: 'Druid' }).click();
  await settings.getByRole('combobox', { name: 'Resource' }).click();
  await page.getByRole('option', { name: 'Wild Shape' }).click();
  await settings.getByRole('button', { name: 'Copy', exact: true }).click();
  await settings.getByRole('button', { name: 'Close Wild Shape' }).click();

  // The class box: fewer uses, and it no longer comes back on a short rest
  await settings.getByRole('button', { name: 'Edit Ki Points' }).click();
  const ki = settings.getByRole('group', { name: 'Ki Points' });
  await ki.getByLabel('Uses').fill('2');
  await ki.getByRole('combobox', { name: 'Comes back on' }).click();
  await page.getByRole('option', { name: 'Long rest' }).click();

  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Character saved successfully!').first()).toBeVisible();

  await page.goto(characterUrl(id));
  const resources = page.locator('#sheet-resources');
  await expect(resources.getByRole('group', { name: 'Ki Points, 2 of 2 available' })).toBeVisible();
  await expect(
    resources.getByRole('group', { name: 'Ring of Luck, 3 of 3 available' }),
  ).toBeVisible();
  await expect(
    resources.getByRole('group', { name: 'Wild Shape, 2 of 2 available' }),
  ).toBeVisible();

  // Her description is what the box's name opens
  await (
    await hydrated(resources.getByRole('button', { name: 'Ring of Luck', exact: true }))
  ).click();
  await expect(page.getByText('Reroll one d20.')).toBeVisible();
  await page.keyboard.press('Escape');

  await resources.getByRole('button', { name: 'Ring of Luck 1, available' }).click();
  await expect(
    resources.getByRole('group', { name: 'Ring of Luck, 2 of 3 available' }),
  ).toBeVisible();

  // The checklist reads the recovery that was saved: the ring is back, Ki is not
  await page.getByRole('button', { name: 'Short rest' }).click();
  const checklist = page.getByRole('complementary', { name: /^Short rest/ });
  await expect(checklist.getByText('Ring of Luck returns: all')).toBeVisible();
  await expect(checklist.getByText(/Ki Points returns/)).toHaveCount(0);
  await checklist.getByRole('button', { name: 'Done' }).click();

  // Leveling up: the box she changed keeps her number
  const up = await page.request.put(`/api/characters/${id}`, { data: { updates: { level: 6 } } });
  expect(up.ok()).toBe(true);
  await page.reload();
  await expect(
    page.locator('#sheet-resources').getByRole('group', { name: 'Ki Points, 2 of 2 available' }),
  ).toBeVisible();

  // Hiding one and deleting another, back in the settings
  await page.goto(characterUrl(id, '/appearance'));
  await (await hydrated(settings.getByRole('button', { name: 'Hide Ki Points' }))).click();
  // A hidden box is dimmed in the list, and still readable
  expect(await violations(page, { include: '#class-resources' })).toEqual([]);
  await settings.getByRole('button', { name: 'Edit Wild Shape' }).click();
  await settings.getByRole('button', { name: 'Delete box' }).click();
  await expect(settings.getByRole('button', { name: 'Add box' })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Character saved successfully!').first()).toBeVisible();

  await page.goto(characterUrl(id));
  await expect(
    page.locator('#sheet-resources').getByRole('group', { name: /^Ring of Luck/ }),
  ).toBeVisible();
  await expect(page.locator('#sheet-resources').getByText('Ki Points')).toHaveCount(0);
  await expect(page.locator('#sheet-resources').getByText('Wild Shape')).toHaveCount(0);

  // Gone from the saved sheet too, not only from the screen
  const saved = await (await page.request.get(`/api/characters/${id}`)).json();
  const keys = Object.keys(saved.resources ?? saved.character?.resources ?? {});
  expect(keys.filter((key) => key.startsWith('custom:'))).toHaveLength(1);
});
