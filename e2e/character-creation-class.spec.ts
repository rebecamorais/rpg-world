import type { Page } from '@playwright/test';

import { expect, hydrated, test } from './support/fixtures';

const SHEET_PATH = /^\/system\/DnD_5e\/character\/([0-9a-f-]{36})$/;

/** Opens the creation form, names the character and picks the 2014 edition and the class. */
async function startCreation(page: Page, name: string, className: string) {
  await page.goto('/characters/new');
  await (await hydrated(page.getByLabel('Name *'))).fill(name);
  await page.getByRole('radio', { name: '2014 (SRD 5.1)' }).check();
  await page.getByRole('combobox', { name: 'Class' }).click();
  await page.getByRole('option', { name: className }).click();
}

async function pick(page: Page, group: 'Skills' | 'Tools', options: string[]) {
  const fieldset = page.getByRole('group', { name: group });
  // exact: "Lute" would also match "Flute" and "Pan Flute"
  for (const option of options)
    await fieldset.getByRole('checkbox', { name: option, exact: true }).check();
}

/** Creates and waits for the sheet; answers the new character's id. */
async function create(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Create' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toMatch(SHEET_PATH);
  return new URL(page.url()).pathname.match(SHEET_PATH)![1];
}

async function stored(page: Page, id: string) {
  const res = await page.request.get(`/api/characters/${id}`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return (body.character ?? body) as {
    hpMax: number;
    hpCurrent: number;
    edition?: string;
    class: string;
    skills: Record<string, { isProficient: boolean }>;
    savingThrowProficiencies: Record<string, boolean>;
    classChoices?: Record<string, string[]>;
  };
}

const CLASSES = [
  {
    name: 'Barbarian',
    id: 'barbarian',
    hp: 12,
    saves: ['Strength', 'Constitution'],
    skills: ['Athletics', 'Survival'],
    keys: ['ATHLETICS', 'SURVIVAL'],
  },
  {
    name: 'Bard',
    id: 'bard',
    hp: 8,
    saves: ['Dexterity', 'Charisma'],
    skills: ['Arcana', 'History', 'Performance'],
    keys: ['ARCANA', 'HISTORY', 'PERFORMANCE'],
  },
  {
    name: 'Cleric',
    id: 'cleric',
    hp: 8,
    saves: ['Wisdom', 'Charisma'],
    skills: ['Insight', 'Religion'],
    keys: ['INSIGHT', 'RELIGION'],
  },
  {
    name: 'Wizard',
    id: 'wizard',
    hp: 6,
    saves: ['Intelligence', 'Wisdom'],
    skills: ['Arcana', 'Investigation'],
    keys: ['ARCANA', 'INVESTIGATION'],
  },
];

test.describe('criação com classe', () => {
  for (const cls of CLASSES) {
    test(`${cls.name} de 2014: a ficha nasce com PV, salvaguardas e perícias da classe`, async ({
      page,
      user: _,
    }) => {
      await startCreation(page, `New ${cls.name}`, cls.name);
      await pick(page, 'Skills', cls.skills);
      await expect(page.getByRole('group', { name: 'Skills' })).toContainText(
        `${cls.skills.length} of ${cls.skills.length}`,
      );
      const id = await create(page);

      await expect(page.getByLabel('Hit Points', { exact: true })).toHaveValue(String(cls.hp));
      for (const save of cls.saves) {
        await expect(page.getByRole('button', { name: `Proficient in ${save}` })).toBeVisible();
      }
      for (const skill of cls.skills) {
        await expect(page.getByRole('button', { name: `Proficient in ${skill}` })).toBeVisible();
      }

      const sheet = await stored(page, id);
      expect(sheet).toMatchObject({ hpMax: cls.hp, hpCurrent: cls.hp, edition: '2014' });
      expect(sheet.class).toBe(cls.id);
      // The class's saving throws follow it: none is stored
      expect(sheet.savingThrowProficiencies ?? {}).toEqual({});
      expect(sheet.classChoices?.[`2014/${cls.id}/skills`]).toEqual(cls.keys);
    });
  }

  test('Bardo com 2 de 3 perícias: cria assim mesmo, com as duas marcadas', async ({
    page,
    user: _,
  }) => {
    await startCreation(page, 'Half-done Bard', 'Bard');
    await pick(page, 'Skills', ['Arcana', 'History']);
    await expect(page.getByRole('group', { name: 'Skills' })).toContainText('2 of 3');
    await pick(page, 'Tools', ['Lute']);
    const id = await create(page);

    await expect(page.getByRole('button', { name: 'Proficient in Arcana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proficient in History' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No proficiency in Performance' })).toBeVisible();

    const sheet = await stored(page, id);
    expect(sheet.classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY'],
      '2014/bard/tools': ['lute'],
    });
  });

  test('só nome e sistema: manda só isso e a ficha é a de sempre', async ({ page, user: _ }) => {
    await page.goto('/characters/new');
    await (await hydrated(page.getByLabel('Name *'))).fill('Plain Hero');
    const request = page.waitForRequest(
      (r) => r.method() === 'POST' && new URL(r.url()).pathname === '/api/characters',
    );
    const id = await create(page);

    expect((await request).postDataJSON()).toEqual({ name: 'Plain Hero', system: 'DnD_5e' });
    const sheet = await stored(page, id);
    expect(sheet).toMatchObject({ hpMax: 10, class: '' });
    expect(sheet.edition).toBeUndefined();
    expect(sheet.classChoices).toBeUndefined();
  });

  test('sem nome não cria, mesmo com as escolhas feitas', async ({ page, user: _ }) => {
    await page.goto('/characters/new');
    await hydrated(page.getByLabel('Name *'));
    await page.getByRole('radio', { name: '2014 (SRD 5.1)' }).check();
    await page.getByRole('combobox', { name: 'Class' }).click();
    await page.getByRole('option', { name: 'Barbarian' }).click();
    await pick(page, 'Skills', ['Athletics', 'Survival']);

    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Give your character a name.')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/characters/new');
  });
});
