import { NextRequest } from 'next/server';

import { vi } from 'vitest';

import type { User } from '@shared/types/user';

/**
 * Stand-in for `@api` in route tests. Use it with
 * `vi.mock('@api', () => import('@tests/helpers/mock-api'))` and configure `api` per test.
 */
export const api = {
  authApi: {
    getSessionUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithMagicLink: vi.fn(),
    updatePassword: vi.fn(),
    callbackExchange: vi.fn(),
    verifyEmailLink: vi.fn(),
    signOut: vi.fn(),
  },
  charactersApi: {
    getById: vi.fn(),
    getByOwner: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    uploadAvatar: vi.fn(),
    getSpells: vi.fn(),
    toggleSpell: vi.fn(),
    getInventory: vi.fn(),
    addItem: vi.fn(),
    setItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    setCoins: vi.fn(),
    getInventoryForPartyGm: vi.fn(),
    getSpellsForPartyGm: vi.fn(),
    duplicate: vi.fn(),
  },
  loreApi: { getByCharacterId: vi.fn(), update: vi.fn() },
  profileApi: { getProfile: vi.fn(), updateProfile: vi.fn(), uploadAvatar: vi.fn() },
  spellsApi: { getAllSpells: vi.fn() },
  conditionsApi: { list: vi.fn() },
  itemsApi: { list: vi.fn() },
  combatApi: {
    get: vi.fn(),
    create: vi.fn(),
    addParticipant: vi.fn(),
    updateParticipant: vi.fn(),
    removeParticipant: vi.fn(),
    setOrder: vi.fn(),
    start: vi.fn(),
    endTurn: vi.fn(),
    finish: vi.fn(),
    setConditions: vi.fn(),
  },
  partiesApi: { rename: vi.fn(), setEdition: vi.fn() },
};

export const getApi = async () => api;

export const SESSION_USER: User = { id: 'user-1', email: 'hero@example.com' };

/** Resets every mock and signs `SESSION_USER` in (pass `null` for a request without session). */
export function resetApi(user: User | null = SESSION_USER) {
  for (const group of Object.values(api)) {
    for (const fn of Object.values(group)) fn.mockReset();
  }
  api.authApi.getSessionUser.mockResolvedValue(user);
}

export function jsonRequest(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(new URL(url, 'http://localhost'), {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

export function formRequest(url: string, form: FormData) {
  return new NextRequest(new URL(url, 'http://localhost'), { method: 'POST', body: form });
}

export function routeContext<P extends Record<string, string | string[]>>(params = {} as P) {
  return { params: Promise.resolve(params) };
}
