import { NextRequest } from 'next/server';

import { routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const download = vi.fn();
const from = vi.fn(() => ({ download }));

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
    download.mockReset();
    from.mockClear();
  });

  it('serve o arquivo de um bucket público com cache longo', async () => {
    download.mockResolvedValue({ data: new Blob(['png'], { type: 'image/png' }), error: null });

    const res = await get(['avatars', 'user-1', 'avatar']);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await res.text()).toBe('png');
    expect(from).toHaveBeenCalledWith('avatars');
    expect(download).toHaveBeenCalledWith('user-1/avatar');
  });

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
    download.mockResolvedValue({ data: null, error: { message: 'Object not found' } });

    const res = await get(['avatars', 'missing']);

    expect(res.status).toBe(404);
  });

  it('responde 404 quando o download lança erro', async () => {
    download.mockRejectedValue(new Error('network'));

    const res = await get(['avatars', 'user-1', 'avatar']);

    expect(res.status).toBe(404);
  });
});
