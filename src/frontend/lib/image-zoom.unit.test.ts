import { describe, expect, it } from 'vitest';

import { INITIAL_ZOOM, panBy, zoomTo } from './image-zoom';

const viewport = { width: 400, height: 400 };

describe('zoomTo', () => {
  it('não passa de 5x', () => {
    expect(zoomTo(INITIAL_ZOOM, 9, viewport).zoom).toBe(5);
  });

  it('não fica abaixo de 1x', () => {
    expect(zoomTo(INITIAL_ZOOM, 0.2, viewport).zoom).toBe(1);
  });

  it('recentraliza ao voltar para 1x', () => {
    expect(zoomTo({ zoom: 3, x: 300, y: -300 }, 1, viewport)).toEqual(INITIAL_ZOOM);
  });

  it('mantém o ponto sob o cursor no lugar', () => {
    expect(zoomTo(INITIAL_ZOOM, 2, viewport, { x: 100, y: 0 })).toEqual({ zoom: 2, x: -100, y: 0 });
  });
});

describe('panBy', () => {
  it('não move a imagem em 1x', () => {
    expect(panBy(INITIAL_ZOOM, 50, 50, viewport)).toEqual(INITIAL_ZOOM);
  });

  it('não deixa a imagem sair da área', () => {
    expect(panBy({ zoom: 2, x: 0, y: 0 }, 500, -500, viewport)).toEqual({
      zoom: 2,
      x: 200,
      y: -200,
    });
  });
});
