import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

// What the language switcher relies on (LanguageSwitcher): the cookie is written by the answer to
// the prefixed path, so a page that is never left keeps the old language
describe('proxy: trocar de idioma pelo caminho', () => {
  it('/pt/<página> grava NEXT_LOCALE=pt por cima do en e volta para a página sem o prefixo', async () => {
    const request = new NextRequest('http://localhost/pt/characters?tab=spells');
    request.cookies.set('NEXT_LOCALE', 'en');

    const res = await proxy(request);

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/characters');
    expect(location.search).toBe('?tab=spells');
    expect(res.headers.get('set-cookie') ?? '').toMatch(/NEXT_LOCALE=pt/);
  });

  it('/pt, a página inicial em português, fica no próprio endereço e grava NEXT_LOCALE=pt', async () => {
    const request = new NextRequest('http://localhost/pt');
    request.cookies.set('NEXT_LOCALE', 'en');

    const res = await proxy(request);

    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('set-cookie') ?? '').toMatch(/NEXT_LOCALE=pt/);
  });

  it('/en/<página pública> volta para o endereço em inglês e grava NEXT_LOCALE=en', async () => {
    const request = new NextRequest('http://localhost/en/privacy');
    request.cookies.set('NEXT_LOCALE', 'pt');

    const res = await proxy(request);

    expect(new URL(res.headers.get('location')!).pathname).toBe('/privacy');
    expect(res.headers.get('set-cookie') ?? '').toMatch(/NEXT_LOCALE=en/);
  });
});
