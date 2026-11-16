import type { Page } from '@playwright/test';

import { expect, hydrated, test } from './support/fixtures';

const SHEET_PATH = /^\/system\/DnD_5e\/character\/([0-9a-f-]{36})$/;

/** Creates a 2014 Bard with only Arcana and History picked, and answers its id. */
async function createHalfDoneBard(page: Page): Promise<string> {
  await page.goto('/characters/new');
  await (await hydrated(page.getByLabel('Name *'))).fill('Pending Bard');
  await page.getByRole('radio', { name: '2014 (SRD 5.1)' }).check();
  await page.getByRole('combobox', { name: 'Class' }).click();
  await page.getByRole('option', { name: 'Bard' }).click();
  const skills = page.getByRole('group', { name: 'Skills' });
  await skills.getByRole('checkbox', { name: 'Arcana', exact: true }).check();
  await skills.getByRole('checkbox', { name: 'History', exact: true }).check();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toMatch(SHEET_PATH);
  return new URL(page.url()).pathname.match(SHEET_PATH)![1];
}

async function stored(page: Page, id: string) {
  const res = await page.request.get(`/api/characters/${id}`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return (body.character ?? body) as {
    skills: Record<string, { isProficient: boolean }>;
    classChoices?: Record<string, string[]>;
    dismissedChoices?: string[];
  };
}

async function saveSheet(page: Page) {
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.getByText('Character saved successfully!').first()).toBeVisible();
}

const notice = (page: Page) => page.getByRole('region', { name: 'Class picks left open' });
const choiceRow = (page: Page, choice: 'Skills' | 'Tools') =>
  notice(page)
    .getByRole('listitem')
    .filter({
      has: page.getByRole('button', { name: `Resolve: ${choice}` }),
    });

test.describe('pendências da classe na ficha', () => {
  test('2 de 3 mostra 1 pendente; resolver zera e marca; dispensar some e não volta', async ({
    page,
    user: _,
  }) => {
    const id = await createHalfDoneBard(page);

    await expect(choiceRow(page, 'Skills')).toContainText('2 of 3 picked');
    await expect(choiceRow(page, 'Tools')).toContainText('0 of 3 picked');

    // Resolve: the creation's picker, with the two already ticked
    await (await hydrated(page.getByRole('button', { name: 'Resolve: Skills' }))).click();
    const dialog = page.getByRole('dialog', { name: 'Bard: Skills' });
    await expect(dialog.getByRole('checkbox', { name: 'Arcana', exact: true })).toBeChecked();
    await dialog.getByRole('checkbox', { name: 'Stealth', exact: true }).check();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('button', { name: 'Resolve: Skills' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Proficient in Stealth' })).toBeVisible();

    // Dismiss the tools: the notice goes
    await page.getByRole('button', { name: 'Dismiss: Tools' }).click();
    await expect(notice(page)).toHaveCount(0);
    await saveSheet(page);

    await page.reload();
    await hydrated(page.getByRole('button', { name: 'Proficient in Stealth' }));
    await expect(notice(page)).toHaveCount(0);

    const sheet = await stored(page, id);
    expect(sheet.classChoices).toEqual({ '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] });
    expect(sheet.dismissedChoices).toEqual(['2014/bard/tools']);
    expect(sheet.skills.STEALTH).toMatchObject({ isProficient: true });
  });

  test('Bardo → Ladino: as perícias do Bardo ficam, as do Ladino aparecem; de volta ao Bardo, a dispensa segue', async ({
    page,
    user: _,
  }) => {
    const id = await createHalfDoneBard(page);
    await (await hydrated(page.getByRole('button', { name: 'Dismiss: Skills' }))).click();
    await page.getByRole('button', { name: 'Dismiss: Tools' }).click();
    await saveSheet(page);

    const toRogue = await page.request.put(`/api/characters/${id}`, {
      data: { updates: { class: 'rogue' } },
    });
    expect(toRogue.ok()).toBe(true);
    await page.reload();

    await expect(choiceRow(page, 'Skills')).toContainText('0 of 4 picked');
    // The Bard's picks are still marked, and still not the Rogue's
    await expect(page.getByRole('button', { name: 'Proficient in Arcana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proficient in History' })).toBeVisible();

    const toBard = await page.request.put(`/api/characters/${id}`, {
      data: { updates: { class: 'bard' } },
    });
    expect(toBard.ok()).toBe(true);
    await page.reload();

    await hydrated(page.getByRole('button', { name: 'Proficient in Arcana' }));
    await expect(notice(page)).toHaveCount(0);
    expect((await stored(page, id)).classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY'],
    });
  });

  test('o servidor confere a resolução como na criação', async ({ page, user: _ }) => {
    const id = await createHalfDoneBard(page);

    const res = await page.request.put(`/api/characters/${id}`, {
      data: {
        updates: {
          classChoices: {
            '2014/bard/skills': ['ARCANA', 'HISTORY', 'HISTORY', 'STEALTH', 'INSIGHT'],
            '2014/rogue/skills': ['STEALTH'],
          },
        },
      },
    });
    expect(res.ok()).toBe(true);

    const sheet = await stored(page, id);
    expect(sheet.classChoices).toEqual({ '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] });
    expect(sheet.skills.INSIGHT?.isProficient ?? false).toBe(false);
  });
});
