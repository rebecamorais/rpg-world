import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { config, proxy } from './proxy';

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: object }[]) => void;
};

const getClaims = vi.fn();
let cookieAdapter: CookieAdapter;

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: CookieAdapter }) => {
    cookieAdapter = options.cookies;
    return { auth: { getClaims } };
  },
}));

function request(
  cookies: Record<string, string> = {},
  { path = '/characters', acceptLanguage }: { path?: string; acceptLanguage?: string } = {},
) {
  const req = new NextRequest(`http://localhost${path}`, {
    headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
  });
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

const rewrittenTo = (res: Response) => {
  const target = res.headers.get('x-middleware-rewrite');
  return target ? new URL(target).pathname : null;
};

const signedIn = () =>
  getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } }, error: null });

describe('proxy', () => {
  beforeEach(() => getClaims.mockReset().mockResolvedValue({ data: null, error: null }));

  it('não consulta o Supabase para visitantes sem cookie de sessão', async () => {
    await proxy(request({ NEXT_LOCALE: 'pt' }));

    expect(getClaims).not.toHaveBeenCalled();
  });

  describe('idioma', () => {
    it('reescreve / para /pt com Accept-Language pt-BR e sem cookie', async () => {
      const res = await proxy(
        request({}, { path: '/', acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' }),
      );

      expect(rewrittenTo(res)).toBe('/pt');
    });

    it('fr-FR cai em /en', async () => {
      const res = await proxy(request({}, { path: '/features', acceptLanguage: 'fr-FR,fr;q=0.9' }));

      expect(rewrittenTo(res)).toBe('/en/features');
    });

    it('NEXT_LOCALE=en vence Accept-Language pt-BR', async () => {
      const res = await proxy(
        request({ NEXT_LOCALE: 'en' }, { path: '/', acceptLanguage: 'pt-BR' }),
      );

      expect(rewrittenTo(res)).toBe('/en');
    });

    it('NEXT_LOCALE=de é ignorado e vale o navegador', async () => {
      const res = await proxy(
        request({ NEXT_LOCALE: 'de' }, { path: '/', acceptLanguage: 'pt-BR' }),
      );

      expect(rewrittenTo(res)).toBe('/pt');
    });

    it('redireciona /pt/features para /features', async () => {
      const res = await proxy(request({}, { path: '/pt/features' }));

      expect([307, 308]).toContain(res.status);
      expect(new URL(res.headers.get('location')!).pathname).toBe('/features');
    });

    it('corrige um NEXT_LOCALE inválido e guarda por um ano', async () => {
      const res = await proxy(
        request({ NEXT_LOCALE: 'de' }, { path: '/', acceptLanguage: 'pt-BR' }),
      );
      const cookie = res.headers.get('set-cookie') ?? '';

      expect(cookie).toMatch(/NEXT_LOCALE=pt/);
      expect(cookie).toMatch(/Max-Age=31536000/i);
    });

    it('não grava cookie quando o idioma veio do próprio navegador', async () => {
      const res = await proxy(request({}, { path: '/', acceptLanguage: 'pt-BR' }));

      expect(res.headers.get('set-cookie') ?? '').not.toMatch(/NEXT_LOCALE/);
    });
  });

  it('o host de imagens não passa pelo roteamento de idioma (avatares antigos sem extensão)', async () => {
    const req = new NextRequest('http://images.rpgworldapp.com/avatars/u1/avatar', {
      headers: { host: 'images.rpgworldapp.com', 'accept-language': 'pt-BR' },
    });

    const res = await proxy(req);

    expect(rewrittenTo(res)).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('os cookies renovados chegam aos Server Components do mesmo pedido', async () => {
    getClaims.mockImplementation(async () => {
      cookieAdapter.setAll([{ name: 'sb-127-auth-token', value: 'fresh', options: { path: '/' } }]);
      return { data: { claims: { sub: 'u1' } }, error: null };
    });

    const res = await proxy(request({ 'sb-127-auth-token': 'stale' }));

    expect(res.headers.get('x-middleware-request-cookie')).toContain('sb-127-auth-token=fresh');
  });

  describe('volta ao link depois de entrar (rw_next)', () => {
    it('com sessão, /characters com rw_next redireciona para lá e apaga o cookie', async () => {
      signedIn();

      const res = await proxy(
        request(
          { 'sb-127-auth-token': 'token', rw_next: '/settings/profile' },
          { path: '/characters' },
        ),
      );

      expect(new URL(res.headers.get('location')!).pathname).toBe('/settings/profile');
      expect(res.headers.get('set-cookie')).toMatch(
        /rw_next=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i,
      );
    });

    it('um rw_next com % inválido não derruba a página', async () => {
      signedIn();

      const res = await proxy(
        request({ 'sb-127-auth-token': 'token', rw_next: '/x%zz' }, { path: '/characters' }),
      );

      expect(new URL(res.headers.get('location')!).pathname).toBe('/x%zz');
    });

    it('rw_next para fora do site é ignorado', async () => {
      signedIn();

      const res = await proxy(
        request({ 'sb-127-auth-token': 'token', rw_next: '//evil.com' }, { path: '/characters' }),
      );

      expect(res.headers.get('location')).toBeNull();
    });

    it('sem sessão, rw_next não redireciona', async () => {
      const res = await proxy(request({ rw_next: '/settings/profile' }, { path: '/characters' }));

      expect(res.headers.get('location')).toBeNull();
    });
  });

  it('passa o caminho pedido aos Server Components (x-pathname)', async () => {
    const res = await proxy(request({}, { path: '/system/DnD_5e/character/abc' }));

    expect(res.headers.get('x-middleware-request-x-pathname')).toBe('/system/DnD_5e/character/abc');
  });

  describe('quem já está logado', () => {
    it.each(['/login', '/register'])(
      'com sessão válida, %s redireciona para /characters',
      async (path) => {
        signedIn();

        const res = await proxy(request({ 'sb-127-auth-token': 'token' }, { path }));

        expect([307, 308]).toContain(res.status);
        expect(new URL(res.headers.get('location')!).pathname).toBe('/characters');
      },
    );

    it('o redirect leva também o cookie de idioma que o next-intl corrigiu', async () => {
      signedIn();

      const res = await proxy(
        request(
          { 'sb-127-auth-token': 'token', NEXT_LOCALE: 'de' },
          { path: '/login', acceptLanguage: 'pt-BR' },
        ),
      );

      expect(new URL(res.headers.get('location')!).pathname).toBe('/characters');
      expect(res.cookies.get('NEXT_LOCALE')?.value).toBe('pt');
    });

    it('sem sessão válida, /login abre normalmente', async () => {
      const res = await proxy(request({ 'sb-127-auth-token': 'expired' }, { path: '/login' }));

      expect(res.headers.get('location')).toBeNull();
      expect(rewrittenTo(res)).toBe('/en/login');
    });

    it('o redirect leva os cookies de sessão renovados', async () => {
      getClaims.mockImplementation(async () => {
        cookieAdapter.setAll([
          { name: 'sb-127-auth-token', value: 'fresh', options: { path: '/' } },
        ]);
        return { data: { claims: { sub: 'u1' } }, error: null };
      });

      const res = await proxy(request({ 'sb-127-auth-token': 'stale' }, { path: '/login' }));

      expect(res.cookies.get('sb-127-auth-token')?.value).toBe('fresh');
    });
  });

  it('renova a sessão quando há cookie do Supabase', async () => {
    await proxy(request({ 'sb-127-auth-token': 'token' }));

    expect(getClaims).toHaveBeenCalledOnce();
  });

  it('devolve ao navegador os cookies renovados pelo Supabase', async () => {
    getClaims.mockImplementation(async () => {
      cookieAdapter.setAll([{ name: 'sb-127-auth-token', value: 'fresh', options: { path: '/' } }]);
      return { data: { claims: { sub: 'u1' } }, error: null };
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
    expect(matcher.test('/api/characters')).toBe(false);
    expect(matcher.test('/_vercel/insights/script.js')).toBe(false);
  });
});
