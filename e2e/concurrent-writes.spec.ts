import type { Page } from '@playwright/test';

import {
  bring,
  characterUrl,
  createCharacter,
  createParty,
  expect,
  hydrated,
  joinParty,
  openRow,
  partyUrl,
  person,
  test,
} from './support/fixtures';
import { adminClient } from './support/supabase';

// Causa 2 da fase 1 (ultima-escrita-vence): two tabs, or the GM and a player, writing the same
// thing at once. Each blocker of docs/revisao-telas/fase-1-resultados.md has its test here.

/** Waits for the write `action` triggers to succeed (the screen changes before the server does). */
async function written(page: Page, path: string, method: string, action: () => Promise<void>) {
  const response = page.waitForResponse(
    (r) => r.url().includes(path) && r.request().method() === method && r.ok(),
  );
  await action();
  await response;
}

async function receiveOneGold(page: Page) {
  await (await hydrated(page.getByRole('button', { name: 'Receive' }))).click();
  const dialog = page.getByRole('dialog', { name: 'Receive' });
  await dialog.getByLabel('Amount').fill('1');
  await written(page, '/chest/coins', 'PATCH', () =>
    dialog.getByRole('button', { name: 'Confirm' }).click(),
  );
  await expect(dialog).toBeHidden();
}

test.describe('escritas concorrentes', () => {
  test('baú em duas abas: +1 PO em cada uma, partindo de 250, dá 252', async ({
    page,
    user: _,
  }) => {
    const { id: partyId } = await createParty(page, 'Mesa do Baú Disputado');
    const { error } = await adminClient()
      .from('containers')
      .update({ coins: { cp: 0, sp: 0, ep: 0, gp: 250, pp: 0 } })
      .eq('party_id', partyId)
      .eq('kind', 'party_chest');
    expect(error).toBeNull();

    // Both tabs open (and showing 250) before either one writes
    const other = await page.context().newPage();
    for (const tab of [page, other]) {
      await tab.goto(partyUrl(partyId, '/inventory'));
      await expect(tab.getByRole('textbox', { name: 'Gold pieces' })).toHaveValue('250');
    }

    await receiveOneGold(page);
    await receiveOneGold(other);

    const { data } = await adminClient()
      .from('containers')
      .select('coins')
      .eq('party_id', partyId)
      .eq('kind', 'party_chest')
      .single();
    expect((data?.coins as { gp: number }).gp).toBe(252);
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Gold pieces' })).toHaveValue('252');
  });

  test('a mesma ficha em duas abas: A salva CA 20, B (ainda com 12) salva 18 e é avisada', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Twin Tabs');
    const ac = (tab: Page) => tab.getByLabel('AC', { exact: true });
    const other = await page.context().newPage();
    for (const tab of [page, other]) await tab.goto(characterUrl(id));
    await expect(ac(other)).toHaveValue(/\d+/);
    const before = await ac(other).inputValue();

    await (await hydrated(ac(page))).fill('20');
    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.getByText('Character saved successfully!')).toBeVisible();

    // B still shows the old value and saves on top of it
    await expect(ac(other)).toHaveValue(before);
    await (await hydrated(ac(other))).fill('18');
    const conflict = other.waitForResponse(
      (r) => r.url().endsWith(`/api/characters/${id}`) && r.request().method() === 'PUT',
    );
    await other.keyboard.press('ControlOrMeta+s');
    expect((await conflict).status()).toBe(409);
    await expect(other.getByText(/^Changed somewhere else/)).toBeVisible();

    // The server kept A's save
    const { data } = await adminClient()
      .from('characters')
      .select('system_data')
      .eq('id', id)
      .single();
    expect((data?.system_data as { ac: number }).ac).toBe(20);
  });

  test('mestre e jogadora com Condições do mesmo participante abertas: cada um liga uma, ficam as duas', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa das Condições');
    const player = await person(browser, 'cond-race-player');
    const heroId = await createCharacter(player.page, 'Arani');
    await joinParty(page, player.page, player.user.id, partyId, code);
    await bring(player.page, partyId, [heroId]);
    const base = `/api/parties/${partyId}/encounter`;
    expect((await page.request.post(base)).status()).toBe(201);
    await page.request.post(`${base}/participants`, { data: { characterId: heroId } });
    expect((await page.request.post(`${base}/start`)).status()).toBe(204);

    // Both pickers open before either switch is touched
    await page.goto(partyUrl(partyId, '/combat'));
    const edits = await openRow(page, 'Arani');
    await (await hydrated(edits.getByRole('button', { name: 'Conditions of Arani' }))).click();
    const gmPicker = page.getByRole('dialog', { name: 'Conditions' });

    await player.page.goto(partyUrl(partyId, '/combat'));
    const mine = player.page
      .getByRole('list', { name: 'Combat order' })
      .getByRole('listitem')
      .filter({ hasText: 'Arani' });
    await (await hydrated(mine.getByRole('button', { name: 'Conditions of Arani' }))).click();
    const playerPicker = player.page.getByRole('dialog', { name: 'Conditions' });

    await written(page, '/conditions', 'PATCH', () =>
      gmPicker.getByRole('switch', { name: 'Prone' }).click(),
    );
    await written(player.page, '/conditions', 'PATCH', () =>
      playerPicker.getByRole('switch', { name: 'Poisoned' }).click(),
    );

    const { data } = await adminClient()
      .from('encounter_participants')
      .select('conditions')
      .eq('party_id', partyId)
      .single();
    const keys = (data?.conditions as { key: string }[]).map((c) => c.key.split(':').pop()).sort();
    expect(keys).toEqual(['poisoned', 'prone']);

    // Both screens end up with both, without reloading
    await page.keyboard.press('Escape');
    await player.page.keyboard.press('Escape');
    for (const tab of [page, player.page]) {
      const row = tab
        .getByRole('list', { name: 'Combat order' })
        .getByRole('listitem')
        .filter({ hasText: 'Arani' });
      await expect(row.getByRole('button', { name: 'Prone, condition' })).toBeVisible();
      await expect(row.getByRole('button', { name: 'Poisoned, condition' })).toBeVisible();
    }

    await player.context.close();
  });
});
