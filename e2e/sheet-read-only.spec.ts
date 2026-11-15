import type { Locator, Page } from '@playwright/test';

import {
  bring,
  createCharacter,
  createParty,
  expect,
  joinParty,
  partyUrl,
  person,
  test,
} from './support/fixtures';

// Phase 2 review, cause 10 (ficha-so-leitura): a read-only sheet shows values as text, and no
// control that looks editable but does nothing

/** The button is there exactly once, and hidden: not just missing under another name. */
async function expectHiddenButton(scope: Locator | Page, name: string | RegExp) {
  const button = scope.getByRole('button', { name, exact: true, includeHidden: true });
  await expect(button).toHaveCount(1);
  await expect(button).toBeHidden();
}

test.describe('ficha só leitura', () => {
  test('o mestre lê a ficha da jogadora sem select, −/+ nem engrenagem', async ({
    page,
    browser,
    user: _,
  }) => {
    const { id: partyId, code } = await createParty(page, 'Mesa de Leitura');
    const player = await person(browser, 'read-only-player');
    await joinParty(page, player.page, player.user.id, partyId, code);
    const arani = await createCharacter(player.page, 'Arani');
    const update = await player.page.request.put(`/api/characters/${arani}`, {
      data: { updates: { race: 'elf', hpMax: 20, hpCurrent: 12 } },
    });
    expect(update.ok()).toBe(true);
    await bring(player.page, partyId, [arani]);

    await page.goto(partyUrl(partyId));
    await page.getByRole('button', { name: 'View sheet Arani' }).click();
    const viewer = page.getByRole('dialog', { name: 'Arani' });

    // The GM can't edit it: not told to "open the sheet" to change it
    await expect(viewer).toContainText(
      "Read only. Only the character's player can change the sheet.",
    );
    await expect(viewer).not.toContainText('To change anything, open the sheet');

    // Identity as text: no select with a chevron, no "Define…"
    await expect(viewer.getByRole('combobox', { name: 'Race' })).toHaveCount(0);
    await expect(viewer.getByText('Elf', { exact: true })).toBeVisible();
    await expect(viewer.getByText(/^Define /)).toHaveCount(0);

    // An explanation is reading, not editing: it opens in the read-only sheet too
    await viewer.getByRole('button', { name: 'What is Initiative?' }).click();
    await expect(page.getByRole('tooltip')).toContainText('Added to the d20');

    // The values stay; the buttons that would change them are on the page, and hidden (counted
    // first: a hidden-element check passes on a button that isn't there at all)
    await expect(viewer.getByLabel('Hit Points', { exact: true })).toHaveValue('12');
    for (const name of ['Lose 1 HP', 'Heal 1 HP', 'Configure hit points']) {
      await expectHiddenButton(viewer, name);
    }

    await viewer.getByRole('tab', { name: 'Inventory' }).click();
    await expectHiddenButton(viewer, /add item/i);
    for (const name of ['Pay', 'Receive']) {
      await expectHiddenButton(viewer, name);
    }

    // An empty spellbook says so, without asking to search and add spells
    await viewer.getByRole('tab', { name: 'Spellbook' }).click();
    await expect(viewer.getByText('No spells learned yet.')).toBeVisible();
    await expect(viewer.getByText(/Search your class/)).toHaveCount(0);

    await page.keyboard.press('Escape');

    // The party's sheet route: the way back is a button, the identity is text there too
    await page.goto(`${partyUrl(partyId)}/characters/${arani}`);
    const back = page.getByRole('link', { name: 'Back to the party' });
    await expect(back).toBeVisible();
    await expect(back).not.toHaveCSS('text-decoration-line', 'underline');
    await expect(page.getByRole('combobox', { name: 'Race' })).toHaveCount(0);
    await expectHiddenButton(page, 'Configure hit points');

    await back.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(partyUrl(partyId));

    await player.context.close();
  });
});
