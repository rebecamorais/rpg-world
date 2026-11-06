import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FULL_MAX_BYTES,
  FULL_MAX_SIDE,
  ImageDecodeError,
  centeredSquare,
  encodeWithinLimit,
  fitWithin,
  fullImage,
} from './crop-image';

const blob = (size: number, type = 'image/webp') => new Blob([new Uint8Array(size)], { type });
const canvas = () => ({}) as HTMLCanvasElement;

describe('fitWithin', () => {
  it('reduz mantendo a proporção', () => {
    expect(fitWithin(4000, 3000, 1024)).toEqual({ width: 1024, height: 768 });
  });

  it('não aumenta imagens pequenas', () => {
    expect(fitWithin(300, 200, 1024)).toEqual({ width: 300, height: 200 });
  });
});

describe('centeredSquare', () => {
  it('pega o quadrado do centro', () => {
    expect(centeredSquare(400, 200)).toEqual({ x: 100, y: 0, width: 200, height: 200 });
  });
});

describe('encodeWithinLimit', () => {
  it('devolve a primeira tentativa que cabe no limite', async () => {
    const encode = vi.fn(async () => blob(100));

    const result = await encodeWithinLimit(canvas, { width: 10, height: 10 }, 200, encode);

    expect(result.size).toBe(100);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  it('baixa a qualidade e depois a dimensão até caber', async () => {
    const draw = vi.fn(canvas);
    const sizes = [900, 800, 700, 150];
    const encode = vi.fn(async (_c: HTMLCanvasElement, _t: string, _q: number) =>
      blob(sizes.shift()!),
    );

    const result = await encodeWithinLimit(draw, { width: 1000, height: 800 }, 200, encode);

    expect(result.size).toBe(150);
    expect(encode.mock.calls.map(([, , quality]) => quality)).toEqual([0.85, 0.75, 0.6, 0.85]);
    expect(draw).toHaveBeenLastCalledWith(750, 600);
  });

  it('usa JPEG quando o navegador não gera WebP', async () => {
    const encode = vi.fn(async (_c: HTMLCanvasElement, type: string) =>
      type === 'image/webp' ? blob(100, 'image/png') : blob(100, 'image/jpeg'),
    );

    const result = await encodeWithinLimit(canvas, { width: 10, height: 10 }, 200, encode);

    expect(result.type).toBe('image/jpeg');
  });

  it('devolve a menor tentativa se nada couber', async () => {
    let size = 1000;
    const encode = vi.fn(async () => blob(size--));

    const result = await encodeWithinLimit(canvas, { width: 10, height: 10 }, 1, encode);

    expect(result.size).toBe(1000 - encode.mock.calls.length + 1);
  });

  it('falha com erro de decodificação quando o canvas não gera nada', async () => {
    await expect(
      encodeWithinLimit(canvas, { width: 10, height: 10 }, 200, async () => null),
    ).rejects.toBeInstanceOf(ImageDecodeError);
  });
});

describe('fullImage', () => {
  const drawImage = vi.fn();

  function stubBitmap(width: number, height: number) {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width, height, close: vi.fn() })),
    );
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => ({ drawImage }),
        toBlob: (done: (blob: Blob) => void) => done(new Blob(['x'], { type: 'image/webp' })),
      }),
    });
  }

  beforeEach(() => drawImage.mockClear());

  afterEach(() => vi.unstubAllGlobals());

  it('mantém a imagem inteira e a proporção dentro do limite', async () => {
    stubBitmap(4000, 2000);

    const file = await fullImage(new Blob(['img']));

    expect(drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 4000, 2000, 0, 0, FULL_MAX_SIDE, 1024]);
    expect(file.type).toBe('image/webp');
  });

  it('não aumenta imagem pequena', async () => {
    stubBitmap(800, 600);

    await fullImage(new Blob(['img']));

    expect(drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 800, 600, 0, 0, 800, 600]);
  });

  it('os limites são 2048px e 2 MB', () => {
    expect(FULL_MAX_SIDE).toBe(2048);
    expect(FULL_MAX_BYTES).toBe(2 * 1024 * 1024);
  });
});
