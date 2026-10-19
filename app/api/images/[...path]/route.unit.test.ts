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
