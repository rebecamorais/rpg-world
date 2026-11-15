import {
  createEnemySheet,
  createParty,
  expect,
  hydrated,
  partyUrl,
  test,
} from './support/fixtures';

// Phase 2 of the screen review, on a phone: the tab bar and the journal at a narrow width
test.describe('aba Mesa no celular', () => {
  test('com combate rolando, a barra de baixo mostra a rodada no Combate', async ({
    page,
    user: _,
  }) => {
    const { id: partyId } = await createParty(page, 'Mesa do Selo');
    const goblinId = await createEnemySheet(page, 'Goblin', 7);
    const base = `/api/parties/${partyId}/encounter`;
    expect((await page.request.post(base)).status()).toBe(201);
    await page.request.post(`${base}/participants`, { data: { characterId: goblinId } });
    expect((await page.request.post(`${base}/start`)).status()).toBe(204);

    await page.goto(partyUrl(partyId, '/journal'));
    // Only the phone's bar is shown at this width
    const combat = (
      await hydrated(page.getByRole('navigation', { name: 'Party tabs' }).last())
    ).getByRole('link', { name: 'Combat, round 1' });
    await expect(combat).toBeVisible();
    await expect(combat.getByText('1', { exact: true })).toBeVisible();
  });

  test('diário configurado: abrir no Google Docs ocupa a largura toda, sem falar de aparelho', async ({
    page,
    user: _,
  }) => {
    const docUrl =
      'https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-abcd/edit';
    const { id: partyId } = await createParty(page, 'Mesa do Diário Estreito');
    expect(
      (await page.request.patch(`/api/parties/${partyId}`, { data: { journalUrl: docUrl } })).ok(),
    ).toBe(true);

    await page.goto(partyUrl(partyId, '/journal'));
    const open = await hydrated(page.getByRole('link', { name: 'Open in Google Docs' }));
    await expect(page.getByText(/At this width the journal opens straight/)).toBeVisible();
    await expect(page.locator('iframe[title="Party journal"]')).toHaveCount(0);
    // The button spans the content column: the screen's one action
    const button = await open.boundingBox();
    expect(button!.width).toBeGreaterThan(page.viewportSize()!.width * 0.8);
  });
});
