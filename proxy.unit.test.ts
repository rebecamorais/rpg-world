import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config, proxy } from './proxy';

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: object }[]) => void;
};

const getUser = vi.fn();
let cookieAdapter: CookieAdapter;

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: CookieAdapter }) => {
    cookieAdapter = options.cookies;
    return { auth: { getUser } };
  },
}));

function request(cookies: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost/characters');
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

describe('proxy', () => {
  beforeEach(() => getUser.mockReset().mockResolvedValue({ data: { user: null } }));

  it('não consulta o Supabase para visitantes sem cookie de sessão', async () => {
    const res = await proxy(request({ NEXT_LOCALE: 'pt' }));

    expect(getUser).not.toHaveBeenCalled();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('renova a sessão quando há cookie do Supabase', async () => {
    await proxy(request({ 'sb-127-auth-token': 'token' }));

    expect(getUser).toHaveBeenCalledOnce();
  });

  it('devolve ao navegador os cookies renovados pelo Supabase', async () => {
    getUser.mockImplementation(async () => {
      cookieAdapter.setAll([{ name: 'sb-127-auth-token', value: 'fresh', options: { path: '/' } }]);
      return { data: { user: { id: 'u1' } } };
    });

    const res = await proxy(request({ 'sb-127-auth-token': 'stale' }));

    expect(res.cookies.get('sb-127-auth-token')?.value).toBe('fresh');
  });

  it('expõe os cookies da requisição ao cliente do Supabase', async () => {
    await proxy(request({ 'sb-127-auth-token': 'token', other: 'x' }));

    expect(cookieAdapter.getAll()).toEqual(
      expect.arrayContaining([{ name: 'sb-127-auth-token', value: 'token' }]),
    );
  });

  it('não roda em assets estáticos nem no proxy de imagens', () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test('/characters')).toBe(true);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/api/images/avatars/u1/a.png')).toBe(false);
    expect(matcher.test('/logo.svg')).toBe(false);
  });
});
