import { characterUrl, createCharacter, expect, signIn, test } from './support/fixtures';
import { createUser } from './support/supabase';

test('um usuário não vê nem altera o personagem de outro', async ({ page, browser, user: _ }) => {
  const id = await createCharacter(page, 'Secret Owner Hero');

  // A second user, in a separate browser context (separate cookies)
  const intruderContext = await browser.newContext();
  const intruder = await intruderContext.newPage();
  await signIn(intruder, await createUser('intruder'));

  await intruder.goto('/characters');
  await expect(intruder.getByText('No characters yet')).toBeVisible();

  await intruder.goto(characterUrl(id));
  await expect(intruder.getByText('Secret Owner Hero')).toHaveCount(0);

  for (const path of ['', '/lore', '/spells']) {
    const res = await intruder.request.get(`/api/characters/${id}${path}`);
    expect([403, 404], `GET ${path || '/'} answered ${res.status()}`).toContain(res.status());
  }
  const update = await intruder.request.put(`/api/characters/${id}`, {
    data: { updates: { name: 'Hijacked' } },
  });
  expect([403, 404]).toContain(update.status());
  const remove = await intruder.request.delete(`/api/characters/${id}`);
  expect([403, 404]).toContain(remove.status());

  // The owner still sees the character untouched
  await page.goto(characterUrl(id));
  await expect(page.getByText('Secret Owner Hero').first()).toBeVisible();

  await intruderContext.close();
});
