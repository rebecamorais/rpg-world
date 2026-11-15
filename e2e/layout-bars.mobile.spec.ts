import type { Locator } from '@playwright/test';

import { characterUrl, createCharacter, expect, hydrated, test } from './support/fixtures';
import { SPELLS } from './support/global-setup';
import { packBackpack } from './support/inventory';

// Phones (Pixel 7, touch): fixed bars that covered the page and names cut by fixed columns
// (causas 6 and 7 of the phase 1 review)

/** A name is whole on screen: neither cut by an ellipsis nor clipped past two lines. */
async function expectWholeName(locator: Locator) {
  const cut = await locator.evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
  );
  expect(cut, `${await locator.textContent()} is cut`).toBe(false);
}

const bottom = async (locator: Locator) => {
  const box = (await locator.boundingBox())!;
  return box.y + box.height;
};

test('no fim da ficha o rodapé não fica por baixo da barra de abas', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Footer Hero');
  await page.goto(characterUrl(id));
  const tabs = page.getByRole('navigation', { name: 'Sheet tabs' });
  await expect(tabs).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = page.getByRole('contentinfo');
  const lastLink = footer.getByRole('link').last();
  const barTop = (await tabs.boundingBox())!.y;
  expect(await bottom(lastLink)).toBeLessThanOrEqual(barTop);
});

test('o foco num campo não fica atrás da barra de vitais', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Focus Hero');
  await page.goto(characterUrl(id));
  const vitals = page.getByRole('region', { name: 'Combat at a glance' });
  await expect(vitals).toBeVisible();

  // From the end of the sheet, the keyboard goes back up to the AC field (scrolled into view)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const ac = await hydrated(page.getByLabel('AC', { exact: true }));
  await ac.focus();

  const field = (await ac.boundingBox())!;
  expect(field.y).toBeGreaterThanOrEqual(await bottom(vitals));
});

test.describe('janela baixa (celular deitado, zoom 400%)', () => {
  test.use({ viewport: { width: 640, height: 360 } });

  test('a barra de vitais rola com a página em vez de cobrir a tela', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Short Hero');
    await page.goto(characterUrl(id));
    const vitals = page.getByRole('region', { name: 'Combat at a glance' });
    await expect(vitals).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect(vitals).not.toBeInViewport();
  });
});

test('descanso com a barra de salvar aberta abre recolhido', async ({ page, user: _ }) => {
  const id = await createCharacter(page, 'Tired Hero');
  await page.goto(characterUrl(id));
  // A sheet edit opens the save bar
  await (await hydrated(page.getByLabel('AC', { exact: true }))).fill('15');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Short rest' }).click();

  const toggle = page.getByRole('button', { name: /^Short rest · / });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // The VitalsBar's numbers stay in view, not under the stacked bars
  await expect(page.getByRole('region', { name: 'Combat at a glance' })).toBeInViewport();
});

test('na grade do inventário, tocar num item traz o painel para a tela', async ({
  page,
  user: _,
}) => {
  const id = await createCharacter(page, 'Grid Hero');
  await packBackpack(page, id, [
    { id: 'rope', quantity: 1 },
    { id: 'torch', quantity: 3 },
    { id: 'bedroll', quantity: 1 },
  ]);
  await page.goto(characterUrl(id, '/inventory'));
  await (await hydrated(page.getByRole('radio', { name: 'Grid' }))).click();

  // The tile just above the tab bar, so the panel opens under it, out of sight
  const tile = page.getByRole('button', { name: /^Torch, 3/ });
  await tile.evaluate((el) => {
    const bar = document.querySelector('[data-scroll-pad="sheet-tabs"]')!.getBoundingClientRect();
    window.scrollBy(0, el.getBoundingClientRect().bottom - bar.top + 8);
  });
  await tile.tap();

  const panel = page.getByRole('region', { name: 'Torch' });
  const tabsTop = (await page.getByRole('navigation', { name: 'Sheet tabs' }).boundingBox())!.y;
  await expect.poll(async () => bottom(panel)).toBeLessThanOrEqual(tabsTop);
});

test.describe('em 320px', () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test('o nome da magia aparece inteiro, sem dar lugar aos ícones V/S/M', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Narrow Wizard');
    const delayed = { id: 'dnd5e:srd-5.1:spell:delayed-blast-fireball' };
    for (const spell of [SPELLS.fireball, delayed]) {
      const res = await page.request.post(`/api/characters/${id}/spells`, {
        data: { id: spell.id, action: 'learn' },
      });
      expect(res.ok()).toBe(true);
    }
    await page.goto(characterUrl(id, '/spells'));

    // Truncated, both read "B..." / "D..." here
    await expectWholeName(page.getByRole('heading', { name: 'Fireball', exact: true }));
    await expectWholeName(page.getByRole('heading', { name: 'Delayed Blast Fireball' }));
    await expect(page.getByRole('heading', { name: 'Delayed Blast Fireball' })).toHaveAttribute(
      'title',
      'Delayed Blast Fireball',
    );
  });

  test('o nome do item quebra em vez de ser cortado, e a página não rola de lado', async ({
    page,
    user: _,
  }) => {
    const id = await createCharacter(page, 'Narrow Packer');
    await packBackpack(page, id, [{ id: 'bedroll', quantity: 1 }]);
    await page.goto(characterUrl(id, '/inventory'));

    await expectWholeName(page.getByTitle('Bedroll').first());
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(sideways).toBe(false);
  });

  test('os números do card de combate cabem inteiros', async ({ page, user: _ }) => {
    const id = await createCharacter(page, 'Tiny Hero');
    await page.goto(characterUrl(id));

    const header = page.locator('#sheet-hit-dice').locator('xpath=../..');
    await expect(header).toBeVisible();
    const cut = await header
      .locator('.font-mono')
      .evaluateAll((els) =>
        els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent),
      );
    expect(cut).toEqual([]);

    // The HP card's − and + stay inside it (its overflow cut the + off)
    const card = (await page.locator('#sheet-hp').boundingBox())!;
    const plus = (await page.getByRole('button', { name: 'Heal 1 HP' }).boundingBox())!;
    expect(plus.x + plus.width).toBeLessThanOrEqual(card.x + card.width);
  });
});
