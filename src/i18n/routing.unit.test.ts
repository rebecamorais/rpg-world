import { describe, expect, it } from 'vitest';

import { localizedHref, withoutLocale } from './routing';

describe('withoutLocale', () => {
  it.each([
    ['/pt/features', '/features'],
    ['/pt', '/'],
    ['/en/login', '/login'],
    ['/features', '/features'],
    ['/', '/'],
    // Only a whole segment is a language
    ['/ptolemy', '/ptolemy'],
  ])('%s → %s', (pathname, expected) => {
    expect(withoutLocale(pathname)).toBe(expected);
  });
});

describe('localizedHref', () => {
  it('em português, as páginas públicas ganham o /pt', () => {
    expect(localizedHref('/', 'pt')).toBe('/pt');
    expect(localizedHref('/features', 'pt')).toBe('/pt/features');
    expect(localizedHref('/register', 'pt')).toBe('/pt/register');
  });

  it('mantém a query e o âncora', () => {
    expect(localizedHref('/login?next=%2Fparties', 'pt')).toBe('/pt/login?next=%2Fparties');
    expect(localizedHref('/privacy#cookies', 'pt')).toBe('/pt/privacy#cookies');
  });

  it('o app e as telas de conta fora da lista ficam sem prefixo', () => {
    expect(localizedHref('/characters', 'pt')).toBe('/characters');
    expect(localizedHref('/forgot-password', 'pt')).toBe('/forgot-password');
    expect(localizedHref('/demo', 'pt')).toBe('/demo');
  });

  it('em inglês, o idioma padrão, nada muda', () => {
    expect(localizedHref('/features', 'en')).toBe('/features');
    expect(localizedHref('/', 'en')).toBe('/');
  });
});
