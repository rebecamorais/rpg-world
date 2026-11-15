import type { Page } from '@playwright/test';

import { createParty, expect, hydrated, partyUrl, test } from './support/fixtures';
import { adminClient } from './support/supabase';

// Causa 2 da fase 2 (bau-conflito-sem-saida): a coin typed by hand is the FINAL value. If someone
// changed it after the person started typing, nothing is written and the screen says what it is
// now, instead of adding to an old screen (she saw 50, the GM gave +5, she typed 70 and got 75).

const gold = (tab: Page) => tab.getByRole('textbox', { name: 'Gold pieces' });

async function setChestGold(partyId: string, gp: number) {
  const { error } = await adminClient()
    .from('containers')
    .update({ coins: { cp: 0, sp: 0, ep: 0, gp, pp: 0 } })
    .eq('party_id', partyId)
    .eq('kind', 'party_chest');
  expect(error).toBeNull();
}

async function chest(partyId: string) {
  const { data } = await adminClient()
    .from('containers')
    .select('id, coins')
    .eq('party_id', partyId)
    .eq('kind', 'party_chest')
    .single();
  return { id: data?.id as string, gp: (data?.coins as { gp: number }).gp };
}
const chestGold = async (partyId: string) => (await chest(partyId)).gp;

test.describe('baú: moeda digitada à mão', () => {
  test('o número digitado é o valor final, não uma diferença', async ({ page, user: _ }) => {
    const { id: partyId } = await createParty(page, 'Mesa do Valor Final');
    await setChestGold(partyId, 50);
    await page.goto(partyUrl(partyId, '/inventory'));
    await expect(page.getByText(/^Shared with the party/)).toBeVisible();
    await expect(gold(page)).toHaveValue('50');

    await (await hydrated(gold(page))).fill('70');
    const saved = page.waitForResponse(
      (r) => r.url().includes('/chest/coins') && r.request().method() === 'PATCH' && r.ok(),
    );
    await gold(page).press('Enter');
    await saved;

    expect(await chestGold(partyId)).toBe(70);
  });

  test('mudou em outro lugar enquanto digitava: não grava, diz quanto há e não oferece tentar de novo', async ({
    page,
    user: _,
  }) => {
    const { id: partyId } = await createParty(page, 'Mesa do Conflito');
    await setChestGold(partyId, 50);
    await page.goto(partyUrl(partyId, '/inventory'));
    await expect(gold(page)).toHaveValue('50');

    // Starts typing while the chest still has 50 (the field keeps what was typed even if the
    // chest updates on screen meanwhile)
    await (await hydrated(gold(page))).fill('70');

    // Meanwhile 5 GP come in, the way Receive sends them (straight to the API, so this tab's
    // field keeps its focus and its typed value)
    const received = await page.request.patch(`/api/parties/${partyId}/chest/coins`, {
      data: { containerId: (await chest(partyId)).id, delta: { gp: 5 }, key: crypto.randomUUID() },
    });
    expect(received.ok()).toBe(true);
    expect(await chestGold(partyId)).toBe(55);

    // The 70 goes based on the 50 it saw: refused
    const refused = page.waitForResponse(
      (r) => r.url().includes('/chest/coins') && r.request().method() === 'PATCH',
    );
    await gold(page).press('Enter');
    expect((await refused).status()).toBe(409);

    await expect(
      page.getByText("Changed somewhere else: it's now 55 GP. What you typed was not saved."),
    ).toBeVisible();
    // Sending it again would fail the same way
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await expect(gold(page)).toHaveValue('55');
    expect(await chestGold(partyId)).toBe(55);
  });
});
