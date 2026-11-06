import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadStoredImage, storedImagePath } from './stored-image';

const PROXIED = '/api/images/avatars/u/c-1.webp';

describe('storedImagePath', () => {
  it('troca o host de imagens pela rota do próprio domínio', () => {
    expect(storedImagePath('https://images.rpgworldapp.com/avatars/u/c-1.webp')).toBe(PROXIED);
  });

  it('um caminho relativo já é do próprio domínio', () => {
    expect(storedImagePath('/demo/pioneers/golden-oath.webp')).toBe(
      '/demo/pioneers/golden-oath.webp',
    );
  });

  it('não repete o prefixo quando a URL já passa pela rota', () => {
    expect(storedImagePath('http://localhost:3000/api/images/avatars/u/c-1.webp')).toBe(PROXIED);
  });
});

describe('loadStoredImage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('lê a imagem pela rota própria, nunca pelo host salvo', async () => {
    fetchMock.mockResolvedValue(
      new Response(new Blob(['img']), { headers: { 'Content-Type': 'image/webp' } }),
    );

    const blob = await loadStoredImage('https://images.rpgworldapp.com/avatars/u/c-1.webp');

    expect(fetchMock).toHaveBeenCalledWith(PROXIED);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('rejeita quando a imagem não existe', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));

    await expect(loadStoredImage(`https://x.test${PROXIED}`)).rejects.toThrow();
  });

  it('rejeita um arquivo que não é imagem', async () => {
    fetchMock.mockResolvedValue(
      new Response(new Blob(['<html>']), {
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    );

    await expect(loadStoredImage(`https://x.test${PROXIED}`)).rejects.toThrow();
  });
});
