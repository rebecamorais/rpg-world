import { NextRequest } from 'next/server';

import { routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const STORAGE_URL = 'https://supabase.test/storage/v1';
const from = vi.fn((bucket: string) => ({
  getPublicUrl: (path: string) => ({
    data: { publicUrl: `${STORAGE_URL}/object/public/${bucket}/${path}` },
  }),
}));
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

vi.mock('@lib/supabase', () => ({
  SupabaseFactory: { createAnon: () => ({ storage: { from } }) },
}));

function get(path: string[]) {
  return GET(
    new NextRequest(`http://localhost/api/images/${path.join('/')}`),
    routeContext({ path }),
  );
}

describe('GET /api/images/[...path]', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    from.mockClear();
  });

  it('serve o arquivo de um bucket público com cache longo', async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(['png'], { type: 'image/png' })));

    const res = await get(['avatars', 'user-1', 'avatar']);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await res.text()).toBe('png');
    expect(from).toHaveBeenCalledWith('avatars');
    // Public object endpoint, not the RLS-checked one: the bucket has no public SELECT policy.
    expect(fetchMock).toHaveBeenCalledWith(`${STORAGE_URL}/object/public/avatars/user-1/avatar`);
    expect(res.headers.get('content-disposition')).toBeNull();
  });

  it.each(['image/svg+xml', 'text/html', ''])(
    'serve arquivo do tipo "%s" como download, sem renderizar na origem do app',
    async (type) => {
      fetchMock.mockResolvedValue(
        new Response(new Blob(['<svg><script>alert(1)</script></svg>'], { type })),
      );

      const res = await get(['avatars', 'user-1', 'x.svg']);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/octet-stream');
      expect(res.headers.get('content-disposition')).toBe('attachment');
    },
  );

  it('responde 400 quando falta o caminho do arquivo', async () => {
    const res = await get(['avatars']);

    expect(res.status).toBe(400);
  });

  it('responde 404 para buckets que não são públicos, sem consultar o storage', async () => {
    const res = await get(['private-docs', 'secret.pdf']);

    expect(res.status).toBe(404);
    expect(from).not.toHaveBeenCalled();
  });

  // Next hands the route each segment already decoded: `..%2F..%2Frest` arrives as `../../rest`
  it.each([
    [['avatars', '..', 'rest', 'v1', 'profile']],
    [['avatars', '../../../../rest/v1/profile']],
    [['avatars', 'user-1', 'avatar?download=1']],
    [['avatars', 'user-1', 'avatar#x']],
    [['avatars', 'user-1', '.hidden']],
    [['avatars', 'user-1', 'a..b']],
    [['avatars', 'user-1', 'a\\b']],
  ])('responde 404 para caminhos fora do formato dos avatares (%j)', async (path) => {
    const res = await get(path);

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aceita os caminhos que os uploads geram', async () => {
    fetchMock.mockImplementation(
      async () => new Response(new Blob(['png'], { type: 'image/png' })),
    );
    const user = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';

    const profile = await get(['avatars', user, 'avatar-mf3k2a9b1c2d3e4.webp']);
    const character = await get(['avatars', user, 'characters', `${user}-mf3k2a9b1c2d3e4.png`]);

    expect(profile.status).toBe(200);
    expect(character.status).toBe(200);
  });

  it('responde 404 quando o arquivo não existe', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ statusCode: '404', error: 'not_found' }, { status: 400 }),
    );

    const res = await get(['avatars', 'missing']);

    expect(res.status).toBe(404);
  });

  it('responde 404 quando o download lança erro', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    const res = await get(['avatars', 'user-1', 'avatar']);

    expect(res.status).toBe(404);
  });
});
