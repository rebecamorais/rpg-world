import { type Page, expect } from '@playwright/test';

/** Puts items straight into the character's backpack, through the API, in this order. */
export async function packBackpack(
  page: Page,
  characterId: string,
  items: { id: string; quantity: number }[],
) {
  const res = await page.request.get(`/api/characters/${characterId}/inventory?locale=en`);
  expect(res.ok()).toBe(true);
  const { containers } = (await res.json()) as { containers: { id: string; kind: string }[] };
  const backpack = containers.find((c) => c.kind === 'backpack');
  expect(backpack, 'the character has a backpack').toBeTruthy();

  for (const { id, quantity } of items) {
    const added = await page.request.post(
      `/api/characters/${characterId}/inventory/items?locale=en`,
      { data: { ref: `dnd5e:srd-5.2:item:${id}`, containerId: backpack!.id, quantity } },
    );
    expect(added.ok(), `adding ${id}`).toBe(true);
  }
}
