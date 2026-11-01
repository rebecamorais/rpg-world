import { describe, expect, it } from 'vitest';

import { nextCookie } from './post-login-next';

const ORIGIN = 'https://www.rpgworldapp.com';

describe('nextCookie', () => {
  it('guarda um caminho interno vindo de ?next=', () => {
    expect(nextCookie('?next=%2Fparties%2Fjoin%2Fabc', ORIGIN)).toBe(
      'rw_next=%2Fparties%2Fjoin%2Fabc; path=/; max-age=1800; SameSite=Lax',
    );
  });

  it.each(['?next=https://evil.com', '?next=//evil.com', '?other=1', ''])('ignora %s', (search) => {
    expect(nextCookie(search, ORIGIN)).toBeNull();
  });
});
