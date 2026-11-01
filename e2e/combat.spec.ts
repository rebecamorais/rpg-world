import type { Page } from '@playwright/test';

import {
  bring,
  characterUrl,
  createCharacter,
  createEnemySheet,
  createParty,
  expect,
  hydrated,
  joinParty,
  partyUrl,
  person,
  test,
} from './support/fixtures';

/** The GM's party with one player who brought Arani, and a Goblin enemy sheet (7 HP). */
async function table(page: Page, browser: Parameters<typeof person>[0], label: string) {
  const { id: partyId, code } = await createParty(page, 'Mesa de Combate');
  const goblinId = await createEnemySheet(page, 'Goblin', 7);
  const player = await person(browser, label);
  const heroId = await createCharacter(player.page, 'Arani');
  await player.page.request.put(`/api/characters/${heroId}`, {
    data: { updates: { hpMax: 20, hpCurrent: 12 } },
  });
  await joinParty(page, player.page, player.user.id, partyId, code);
  await bring(player.page, partyId, [heroId]);
  return { partyId, goblinId, heroId, player };
}

/** Through the API: Arani (10), Goblin 1 (15) and Goblin 2 (5), sorted and started. */
async function runningCombat(page: Page, partyId: string, heroId: string, goblinId: string) {
  const base = `/api/parties/${partyId}/encounter`;
  expect((await page.request.post(base)).status()).toBe(201);
  await page.request.post(`${base}/participants`, { data: { characterId: heroId } });
  await page.request.post(`${base}/participants`, { data: { characterId: goblinId, count: 2 } });
  const view = await (await page.request.get(base)).json();
  const [hero, g1, g2] = view.rows.map((row: { participantId: string }) => row.participantId);
  await page.request.put(`${base}/order`, { data: { participantIds: [g1, hero, g2] } });
  expect((await page.request.post(`${base}/start`)).status()).toBe(204);
  return { hero, g1, g2 };
}

const order = (page: Page) => page.getByRole('list', { name: 'Combat order' });
const current = (page: Page) => order(page).locator('[aria-current="true"]');

test.describe('combate', () => {
  test('o mestre monta e começa o combate e o jogador vê a ordem e a vez sem recarregar', async ({
    page,
    browser,
    user: _,
  }) => {
    const { partyId, player } = await table(page, browser, 'combat-player');
    await player.page.goto(partyUrl(partyId));
    await hydrated(player.page.getByRole('heading', { name: 'Mesa de Combate' }));

    await page.goto(partyUrl(partyId));
    await (await hydrated(page.getByRole('tab', { name: 'Combat' }))).click();
    await page.getByRole('button', { name: 'Prepare combat' }).click();
    await expect(player.page.getByText('The GM is preparing the combat.')).toBeVisible();

    await page.getByRole('button', { name: "Add the party's characters" }).click();
    await expect(page.getByLabel("Arani's initiative")).toBeVisible();
    await page.getByRole('combobox', { name: 'Enemy sheet' }).click();
    await page.getByRole('option', { name: 'Goblin' }).click();
    await page.getByLabel('How many').fill('2');
    await page.getByRole('button', { name: 'Add enemy' }).click();
    await expect(page.getByLabel("Goblin 2's initiative")).toBeVisible();

    for (const [name, initiative] of [
      ['Arani', '10'],
      ['Goblin 1', '15'],
      ['Goblin 2', '5'],
    ]) {
      const field = page.getByLabel(`${name}'s initiative`);
      await field.fill(initiative);
      // Saved on blur; sorting right after must already see it (no waiting for the server)
      await field.blur();
      await expect(page.getByLabel(`${name}'s initiative`)).toHaveValue(initiative);
    }
    await page.getByRole('button', { name: 'Sort by initiative' }).click();
    await expect(order(page).getByRole('listitem').first()).toContainText('Goblin 1');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('heading', { name: 'Round 1' })).toBeVisible();

    await expect(order(player.page).getByRole('listitem')).toHaveText([
      /^Goblin 1/,
      /^Arani/,
      /^Goblin 2/,
    ]);
    await expect(current(player.page)).toContainText('Goblin 1');
    // No HP, initiative or AC reaches the player
    await expect(player.page.getByText('/7')).toHaveCount(0);
    await expect(order(player.page)).not.toContainText('15');
  });

  test('o jogador encerra o próprio turno e a tela do mestre anda; o mestre encerra o turno de um goblin', async ({
    page,
    browser,
    user: _,
  }) => {
    const { partyId, goblinId, heroId, player } = await table(page, browser, 'turn-player');
    await runningCombat(page, partyId, heroId, goblinId);
    await page.goto(partyUrl(partyId));
    await player.page.goto(partyUrl(partyId));
    await hydrated(page.getByRole('button', { name: 'End turn' }));

    await expect(current(page)).toContainText('Goblin 1');
    await page.getByRole('button', { name: 'End turn' }).click();

    await expect(player.page.getByText('Your turn')).toBeVisible();
    await (await hydrated(player.page.getByRole('button', { name: 'End my turn' }))).click();

    await expect(current(page)).toContainText('Goblin 2');
    await expect(player.page.getByRole('button', { name: 'End my turn' })).toHaveCount(0);
    await page.getByRole('button', { name: 'End turn' }).click();
    await expect(page.getByRole('heading', { name: 'Round 2' })).toBeVisible();
    await expect(current(player.page)).toContainText('Goblin 1');
  });

  test('o jogador salva o PV na ficha e a linha do mestre atualiza', async ({
    page,
    browser,
    user: _,
  }) => {
    const { partyId, goblinId, heroId, player } = await table(page, browser, 'hp-player');
    await runningCombat(page, partyId, heroId, goblinId);
    await page.goto(partyUrl(partyId));
    const hero = order(page).getByRole('listitem').filter({ hasText: 'Arani' });
    await expect(hero).toContainText('12/20');

    const res = await player.page.request.put(`/api/characters/${heroId}`, {
      data: { updates: { hpCurrent: 0, deathSaves: { successes: 1, failures: 2 } } },
    });
    expect(res.ok()).toBe(true);

    await expect(hero).toContainText('0/20');
    await expect(hero).toContainText('Death saves: 1 successes, 2 failures');
  });

  test('o mestre duplica uma ficha de inimigo', async ({ page, user: _ }) => {
    await createEnemySheet(page, 'Goblin', 7);
    await page.goto('/enemies');

    await (await hydrated(page.getByRole('button', { name: 'Actions for Goblin' }))).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect.poll(() => new URL(page.url()).pathname).not.toBe('/enemies');
    expect(new URL(page.url()).pathname).toMatch(new RegExp(`^${characterUrl('')}`));
    await page.goto('/enemies');
    await expect(page.getByRole('link', { name: 'Goblin (copy)' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Goblin', exact: true })).toBeVisible();
  });
});
