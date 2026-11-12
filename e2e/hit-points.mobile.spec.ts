import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';

test('no celular, ajustar PV salva na hora e desfazer devolve', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Bruised Hero');
  const res = await page.request.put(`/api/characters/${id}`, {
    data: { updates: { hpMax: 20, hpCurrent: 20 } },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id));

  const vitals = page.getByRole('region', { name: 'Combat at a glance' });
  await (await hydrated(vitals.getByRole('button', { name: 'Adjust HP' }))).click();
  const sheet = page.getByRole('dialog', { name: 'Adjust HP' });
  await sheet.getByLabel('How much?').fill('7');
  await sheet.getByRole('button', { name: 'Damage' }).click();

  // Saved with no save button: the sheet has nothing pending
  await expect(page.getByText('HP 13 / 20')).toBeVisible();
  await expect(vitals).toContainText('13 / 20');
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Combat at a glance' })).toContainText('13 / 20');

  // The tab bar sits at the bottom; the toast stays above it, so Undo can be tapped
  await (await hydrated(vitals.getByRole('button', { name: 'Adjust HP' }))).click();
  await sheet.getByLabel('How much?').fill('2');
  await sheet.getByRole('button', { name: 'Heal' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(vitals).toContainText('13 / 20');

  await expect(page.getByRole('navigation', { name: 'Sheet tabs' })).toBeVisible();
});
