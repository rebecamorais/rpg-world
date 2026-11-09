import { type Browser, type Locator, type Page, test as base, expect } from '@playwright/test';

import { BASE_URL, supabaseTestEnv } from './env';
import { PASSWORD, type TestUser, createUser } from './supabase';

/** Signs in through the real login endpoint; the session cookies land in the page's context. */
export async function signIn(page: Page, user: TestUser, password = PASSWORD) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password },
  });
  expect(res.ok(), `login of ${user.email} failed with ${res.status()}`).toBe(true);
}

export async function createCharacter(page: Page, name: string): Promise<string> {
  const res = await page.request.post('/api/characters', { data: { name } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  return id;
}

/**
 * Waits until React has hydrated the element. Text typed into server-rendered HTML before that
 * is wiped by hydration, which made form tests flaky under load.
 */
export async function hydrated(locator: Locator): Promise<Locator> {
  await expect
    .poll(() =>
      locator.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith('__reactProps')),
      ),
    )
    .toBe(true);
  return locator;
}

/** A party created through the API by the user signed in on `page`, with its invite code. */
export async function createParty(page: Page, name: string): Promise<{ id: string; code: string }> {
  const res = await page.request.post('/api/parties', { data: { name } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  const party = await (await page.request.get(`/api/parties/${id}`)).json();
  return { id, code: party.gm.inviteCode };
}

/** Another person, signed in on their own browser context (separate cookies). */
export async function person(browser: Browser, label: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = await createUser(label);
  await signIn(page, user);
  return { context, page, user };
}

/** Through the API: asks with the link and the GM approves. */
export async function joinParty(
  gm: Page,
  player: Page,
  playerId: string,
  partyId: string,
  code: string,
) {
  expect((await player.request.post(`/api/parties/join/${code}`)).ok()).toBe(true);
  expect((await gm.request.patch(`/api/parties/${partyId}/members/${playerId}`)).status()).toBe(
    204,
  );
}

export async function bring(player: Page, partyId: string, characterIds: string[]) {
  const res = await player.request.put(`/api/parties/${partyId}/my-characters`, {
    data: { characterIds },
  });
  expect(res.status()).toBe(204);
}

/** One of the user's enemy sheets (an npc character) with the given max HP. */
export async function createEnemySheet(page: Page, name: string, hpMax: number): Promise<string> {
  const res = await page.request.post('/api/characters', { data: { name, kind: 'npc' } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  const update = await page.request.put(`/api/characters/${id}`, {
    data: { updates: { hpMax, hpCurrent: hpMax } },
  });
  expect(update.ok()).toBe(true);
  return id;
}

/** The GM shows a hidden NPC to the players, from its row in the combat order (new NPCs start hidden). */
export async function revealNpc(gm: Page, name: string) {
  const row = gm
    .getByRole('list', { name: 'Combat order' })
    .getByRole('listitem')
    .filter({ hasText: name });
  const show = await hydrated(row.getByRole('button', { name: 'Show', exact: true }));
  await show.click();
  await expect(show).toHaveAttribute('aria-pressed', 'true');
}

export const partyUrl = (id: string, path = '') => `/parties/${id}${path}`;

export const characterUrl = (id: string, tab = '') => `/system/DnD_5e/character/${id}${tab}`;

interface Fixtures {
  /** A fresh user, already signed in on `page`. */
  user: TestUser;
  /** Console errors and uncaught exceptions; any of them fails the test (CSP, hydration...). */
  consoleErrors: string[];
  /** Requests to hosts other than the app and Supabase; any of them fails the test (privacy). */
  thirdPartyRequests: string[];
}

export const test = base.extend<Fixtures>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        // Chrome also logs every 4xx/5xx response; tests assert expected statuses themselves
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await use(errors);

      expect(errors, 'errors in the browser console').toEqual([]);
    },
    { auto: true },
  ],

  thirdPartyRequests: [
    async ({ page }, use) => {
      const allowed = new Set([
        new URL(BASE_URL).origin,
        new URL(supabaseTestEnv().url).origin,
        // GitHub Sponsors button: an iframe the site embeds on purpose (see frame-src in the CSP)
        'https://github.com',
        'https://github.githubassets.com',
        // Cloudflare Turnstile on the sign-up and password recovery forms
        'https://challenges.cloudflare.com',
      ]);
      const requests: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol.startsWith('http') && !allowed.has(url.origin)) requests.push(url.href);
      });

      await use(requests);

      expect(requests, 'requests to third-party hosts').toEqual([]);
    },
    { auto: true },
  ],

  user: async ({ page }, use, testInfo) => {
    const label = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const user = await createUser(label);
    await signIn(page, user);
    await use(user);
  },
});

export { expect };
