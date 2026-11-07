import AxeBuilder from '@axe-core/playwright';
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
  revealNpc,
  test,
} from './support/fixtures';

const HOLD_PERSON_2024 = 'dnd5e:srd-5.2:spell:hold-person';
const HOLD_PERSON_2014 = 'dnd5e:srd-5.1:spell:hold-person';

/** Serious and critical WCAG A/AA violations on the page, or only inside `include`. */
async function violations(page: Page, include?: string, disabledRules: string[] = []) {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(disabledRules);
  const results = await (include ? builder.include(include) : builder).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(' ')) }));
}

async function learnedSpell(page: Page, spellId: string) {
  const id = await createCharacter(page, 'Elminster');
  const res = await page.request.post(`/api/characters/${id}/spells`, {
    data: { id: spellId, action: 'learn' },
  });
  expect(res.ok()).toBe(true);
  await page.goto(characterUrl(id, '/spells'));
  return id;
}

/** The GM's party with one player who brought Arani, running combat: Goblin 1, Arani, Goblin 2. */
async function runningTable(page: Page, browser: Parameters<typeof person>[0], label: string) {
  const { id: partyId, code } = await createParty(page, 'Mesa de Condições');
  const goblinId = await createEnemySheet(page, 'Goblin', 7);
  const player = await person(browser, label);
  const heroId = await createCharacter(player.page, 'Arani');
  await joinParty(page, player.page, player.user.id, partyId, code);
  await bring(player.page, partyId, [heroId]);

  const base = `/api/parties/${partyId}/encounter`;
  expect((await page.request.post(base)).status()).toBe(201);
  await page.request.post(`${base}/participants`, { data: { characterId: heroId } });
  await page.request.post(`${base}/participants`, { data: { characterId: goblinId, count: 2 } });
  const view = await (await page.request.get(base)).json();
  const [hero, g1, g2] = view.rows.map((row: { participantId: string }) => row.participantId);
  await page.request.put(`${base}/order`, { data: { participantIds: [g1, hero, g2] } });
  expect((await page.request.post(`${base}/start`)).status()).toBe(204);
  return { partyId, player };
}

const order = (page: Page) => page.getByRole('list', { name: 'Combat order' });
const rowOf = (page: Page, name: string) =>
  order(page).getByRole('listitem').filter({ hasText: name });

test.describe('condições nas magias', () => {
  test('a condição de uma magia 5.2 abre o popover pelo clique e pelo teclado', async ({
    page,
    user: _,
  }) => {
    await learnedSpell(page, HOLD_PERSON_2024);
    const card = page.getByRole('article', { name: /Hold Person/ });
    await (await hydrated(card.getByRole('button', { name: /Expand Hold Person/ }))).click();

    expect(await violations(page, 'article')).toEqual([]);

    const term = card.locator('p').getByRole('button', { name: 'Paralyzed, condition' });
    await term.click();
    const popover = page.getByRole('dialog');
    await expect(popover).toContainText('While you have the Paralyzed condition');
    expect(await violations(page, '[role="dialog"]')).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(term).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(popover).toBeVisible();
  });

  test.describe('em português', () => {
    test.use({ locale: 'pt-BR' });

    test('a condição aparece no idioma da tela', async ({ page, user: _ }) => {
      await learnedSpell(page, HOLD_PERSON_2014);
      const card = page.getByRole('article', { name: /Imobilizar Pessoa/ });
      await (
        await hydrated(card.getByRole('button', { name: /Expandir Imobilizar Pessoa/ }))
      ).click();

      await card
        .locator('p')
        .getByRole('button', { name: /, condição$/ })
        .click();
      await expect(page.getByRole('dialog')).toContainText('Paralisado');
    });
  });
});

test.describe('condições no combate', () => {
  test('o mestre liga Caído num inimigo e o jogador vê o selo sem recarregar', async ({
    page,
    browser,
    user: _,
  }) => {
    const { partyId, player } = await runningTable(page, browser, 'cond-player');
    await player.page.goto(partyUrl(partyId));
    await hydrated(player.page.getByRole('heading', { name: 'Round 1' }));
    await page.goto(partyUrl(partyId));

    const goblin = rowOf(page, 'Goblin 1');
    await revealNpc(page, 'Goblin 1');
    await (await hydrated(goblin.getByRole('button', { name: 'Conditions of Goblin 1' }))).click();
    const picker = page.getByRole('dialog', { name: 'Conditions' });
    await picker.getByRole('switch', { name: 'Prone' }).click();
    await expect(picker.getByRole('switch', { name: 'Prone' })).toBeChecked();
    // The dialog's own contents; the dimmed page behind it is not what a user reads now
    expect(await violations(page, '[role="dialog"]')).toEqual([]);
    await page.keyboard.press('Escape');

    await expect(goblin.getByRole('button', { name: 'Prone, condition' })).toBeVisible();
    // Every row, minus contrast: the dimmed rows of other turns already fail it by design
    expect(await violations(page, '[aria-label="Combat order"]', ['color-contrast'])).toEqual([]);
    // The current row, where the badges sit at full opacity, with every rule
    expect(await violations(page, '[aria-current="true"]')).toEqual([]);
    await expect(
      rowOf(player.page, 'Goblin 1').getByRole('button', { name: 'Prone, condition' }),
    ).toBeVisible();
    // The player's list has no button to change someone else's conditions
    await expect(
      rowOf(player.page, 'Goblin 1').getByRole('button', { name: /^Conditions of/ }),
    ).toHaveCount(0);
  });

  test('o jogador liga Envenenado no próprio personagem e só nele tem o botão', async ({
    page,
    browser,
    user: _,
  }) => {
    const { partyId, player } = await runningTable(page, browser, 'poison-player');
    await page.goto(partyUrl(partyId));
    await hydrated(page.getByRole('heading', { name: 'Round 1' }));
    await player.page.goto(partyUrl(partyId));
    const mine = rowOf(player.page, 'Arani');
    await (await hydrated(mine.getByRole('button', { name: 'Conditions of Arani' }))).click();
    await player.page.getByRole('switch', { name: 'Poisoned' }).click();
    await player.page.keyboard.press('Escape');

    await expect(mine.getByRole('button', { name: 'Poisoned, condition' })).toBeVisible();
    await expect(order(player.page).getByRole('button', { name: /^Conditions of/ })).toHaveCount(1);

    // The GM sees it without reloading
    await expect(
      rowOf(page, 'Arani').getByRole('button', { name: 'Poisoned, condition' }),
    ).toBeVisible();
  });
});
