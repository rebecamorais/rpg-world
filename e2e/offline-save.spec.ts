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

/*
 * Round 2 of the screen review, causes 1 (no connection) and 3 (play saves at once).
 * Offline a change fails at once, says so, and the screen goes back to what the server has;
 * nothing waits to be sent when the connection comes back.
 */

const NO_CONNECTION = 'No connection. Nothing was saved.';

async function sheetWith(page: Page, name: string, updates: Record<string, unknown>) {
  const id = await createCharacter(page, name);
  const res = await page.request.put(`/api/characters/${id}`, { data: { updates } });
  expect(res.ok()).toBe(true);
  return id;
}

/** The sheet's saves of this character, counted from now on. */
function countPuts(page: Page, id: string) {
  const puts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith(`/api/characters/${id}`)) {
      puts.push(request.url());
    }
  });
  return puts;
}

const hitPoints = (page: Page) => page.getByLabel('Hit Points', { exact: true });

async function openAdjustHp(page: Page) {
  await (
    await hydrated(page.getByRole('button', { name: 'Adjust HP', exact: true }).first())
  ).click();
  return page.getByRole('dialog', { name: 'Adjust HP' });
}

test.describe('sem conexão', () => {
  test('dano offline: diz que nada foi salvo e o PV fica o do servidor', async ({
    page,
    context,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Offline Hero', { hpMax: 38, hpCurrent: 33 });
    await page.goto(characterUrl(id));
    await expect(await hydrated(hitPoints(page))).toHaveValue('33');

    const sheet = await openAdjustHp(page);
    await context.setOffline(true);
    await sheet.getByLabel('How much?').fill('10');
    await sheet.getByRole('button', { name: 'Damage' }).click();

    await expect(page.getByText(NO_CONNECTION)).toBeVisible();
    await expect(page.getByText('No connection. Nothing you change now is saved.')).toBeVisible();
    // What was typed stays, to try again
    await expect(sheet.getByLabel('How much?')).toHaveValue('10');
    await page.keyboard.press('Escape');
    await expect(hitPoints(page)).toHaveValue('33');

    await context.setOffline(false);
    await page.reload();
    await expect(hitPoints(page)).toHaveValue('33');
  });

  test('salvar a ficha offline falha na hora, Descartar segue ativo e nada é salvo ao voltar', async ({
    page,
    context,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Unsent Hero', { ac: 12 });
    await page.goto(characterUrl(id));
    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('17');

    await context.setOffline(true);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText(NO_CONNECTION)).toBeVisible();
    await expect(page.getByText('No connection: your changes are still here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Discard' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
    await expect(page.getByLabel('AC', { exact: true })).toHaveValue('17');

    // Back online, nothing goes by itself
    await context.setOffline(false);
    await page.waitForTimeout(2_000);
    const saved = await (await page.request.get(`/api/characters/${id}`)).json();
    expect(saved.ac).toBe(12);
  });

  test('no combate, offline avisa e "Encerrar turno" não é enviado depois', async ({
    page,
    browser,
    user: _,
    consoleErrors,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa Offline');
    const goblinId = await createEnemySheet(page, 'Goblin', 7);
    const player = await person(browser, 'offline-player');
    const heroId = await createCharacter(player.page, 'Arani');
    await joinParty(page, player.page, player.user.id, partyId, code);
    await bring(player.page, partyId, [heroId]);

    // Arani first: it is the player's turn from the start
    const base = `/api/parties/${partyId}/encounter`;
    expect((await page.request.post(base)).status()).toBe(201);
    await page.request.post(`${base}/participants`, { data: { characterId: heroId } });
    await page.request.post(`${base}/participants`, { data: { characterId: goblinId } });
    type Row = { participantId: string; name: string | null; isCurrent: boolean };
    const view: { rows: Row[] } = await (await page.request.get(base)).json();
    const hero = view.rows.find((row) => row.name === 'Arani')!.participantId;
    const goblin = view.rows.find((row) => row.name !== 'Arani')!.participantId;
    await page.request.put(`${base}/order`, { data: { participantIds: [hero, goblin] } });
    expect((await page.request.post(`${base}/start`)).status()).toBe(204);

    await player.page.goto(partyUrl(partyId, '/combat'));
    const endTurn = await hydrated(player.page.getByRole('button', { name: "End Arani's turn" }));

    await player.context.setOffline(true);
    await expect(
      player.page.getByRole('status').filter({ hasText: 'No connection. The screen won’t update' }),
    ).toBeVisible();
    await expect(
      player.page.getByText('No connection. Nothing you change now is saved.'),
    ).toBeVisible();

    await endTurn.click();
    await expect(player.page.getByText(NO_CONNECTION)).toBeVisible();

    // Back online, the turn that failed is not sent late
    await player.context.setOffline(false);
    await player.page.waitForTimeout(2_000);
    const after: { rows: Row[] } = await (await page.request.get(base)).json();
    expect(after.rows.find((row) => row.isCurrent)?.participantId).toBe(hero);
    await expect(player.page.getByRole('button', { name: "End Arani's turn" })).toBeVisible();

    // The realtime socket complains while offline; that is the point of the test
    consoleErrors.splice(
      0,
      consoleErrors.length,
      ...consoleErrors.filter(
        (error) => !/websocket|realtime|ERR_INTERNET_DISCONNECTED/i.test(error),
      ),
    );
    await player.context.close();
  });
});

test.describe('o jogo salva na hora', () => {
  test('gastar um espaço de magia e fechar a aba: o espaço continua gasto', async ({
    page,
    context,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Caster Hero', {
      spellcastingSystem: 'slots',
      spellSlots: { '1': { max: 2, used: 0 } },
    });
    await page.goto(characterUrl(id));

    const saved = page.waitForResponse(
      (res) => res.request().method() === 'PUT' && res.url().endsWith(`/api/characters/${id}`),
    );
    await (await hydrated(page.getByRole('button', { name: 'Level 1 slot 1, available' }))).click();
    // A tap during play is not a draft: nothing asks to be saved
    await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toHaveCount(0);
    expect((await saved).ok()).toBe(true);
    await page.close();

    const again = await context.newPage();
    await again.goto(characterUrl(id));
    await expect(again.getByRole('button', { name: 'Level 1 slot 2, spent' })).toBeVisible();
  });

  test('testes contra a morte e o −/+ do PV não ficam no rascunho', async ({ page, user: _ }) => {
    const id = await sheetWith(page, 'Falling Hero', { hpMax: 10, hpCurrent: 5 });
    await page.goto(characterUrl(id));

    await (await hydrated(page.getByRole('button', { name: 'Lose 1 HP' }))).click();
    await page.getByRole('button', { name: 'Death save failure 1' }).click();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();

    await expect
      .poll(async () => (await (await page.request.get(`/api/characters/${id}`)).json()).hpCurrent)
      .toBe(4);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Death save failure 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('descanso longo: "Recuperar" aplica tudo numa vez e Desfazer devolve', async ({
    page,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Tired Hero', { hpMax: 30, hpCurrent: 5 });
    await page.goto(characterUrl(id));

    await (await hydrated(page.getByRole('button', { name: 'Long rest' }))).click();
    await page.getByRole('button', { name: 'Recover', exact: true }).click();

    await expect(hitPoints(page)).toHaveValue('30');
    await expect(page.getByRole('checkbox', { name: 'Full HP' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(hitPoints(page)).toHaveValue('5');
    await expect
      .poll(async () => (await (await page.request.get(`/api/characters/${id}`)).json()).hpCurrent)
      .toBe(5);
  });
});

test.describe('salvar sem envio duplicado', () => {
  test('clique duplo em Salvar manda um PUT só', async ({ page, user: _ }) => {
    const id = await sheetWith(page, 'Double Hero', { ac: 12 });
    await page.goto(characterUrl(id));
    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('15');
    const puts = countPuts(page, id);

    await page.getByRole('button', { name: 'Save Changes' }).dblclick();

    await expect(page.getByText('Character saved successfully!')).toBeVisible();
    expect(puts).toHaveLength(1);
  });

  test('Ajustar PV abre com o foco no número e Enter aplica Dano uma vez', async ({
    page,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Enter Hero', { hpMax: 38, hpCurrent: 33 });
    await page.goto(characterUrl(id));
    await expect(await hydrated(hitPoints(page))).toHaveValue('33');
    const puts = countPuts(page, id);

    const sheet = await openAdjustHp(page);
    await expect(sheet.getByLabel('How much?')).toBeFocused();
    await page.keyboard.type('7');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    await expect(page.getByText('HP 26 / 38')).toBeVisible();
    await expect(hitPoints(page)).toHaveValue('26');
    expect(puts).toHaveLength(1);
  });
});

test.describe('conflito entre abas', () => {
  // Needs the server side of the revision (front "concorrencia"): GET sends `revision`, a PUT
  // with an older one answers 409 { code: 'conflict' }
  test('a mesma ficha em duas abas: a segunda a salvar ouve que mudou em outro lugar', async ({
    page,
    context,
    user: _,
  }) => {
    const id = await sheetWith(page, 'Twin Hero', { ac: 12 });
    const other = await context.newPage();
    await page.goto(characterUrl(id));
    await other.goto(characterUrl(id));

    await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('20');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Character saved successfully!')).toBeVisible();

    await (await hydrated(other.getByLabel('AC', { exact: true }))).fill('18');
    await other.getByRole('button', { name: 'Save Changes' }).click();

    await expect(other.getByText(/^Changed somewhere else/)).toBeVisible();
    // The draft stays until the person chooses
    await expect(other.getByLabel('AC', { exact: true })).toHaveValue('18');
    const saved = await (await page.request.get(`/api/characters/${id}`)).json();
    expect(saved.ac).toBe(20);

    await other.getByRole('button', { name: 'Reload' }).click();
    await expect(other.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  });
});
