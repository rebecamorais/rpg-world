import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from './safe-redirect-path';

const ORIGIN = 'https://rpgworldapp.com';
const FALLBACK = '/characters';

describe('safeRedirectPath', () => {
  it.each([
    ['/characters', '/characters'],
    ['/system/dnd_5e/character/1?tab=spells#top', '/system/dnd_5e/character/1?tab=spells#top'],
    ['/reset-password', '/reset-password'],
  ])('mantém caminhos internos: %s', (next, expected) => {
    expect(safeRedirectPath(next, ORIGIN, FALLBACK)).toBe(expected);
  });

  it.each([
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    'https://evil.com/characters',
    'javascript:alert(1)',
    'http://rpgworldapp.com/characters',
  ])('rejeita destinos externos: %s', (next) => {
    expect(safeRedirectPath(next, ORIGIN, FALLBACK)).toBe(FALLBACK);
  });

  it('usa o fallback quando next está ausente', () => {
    expect(safeRedirectPath(null, ORIGIN, FALLBACK)).toBe(FALLBACK);
  });
});
