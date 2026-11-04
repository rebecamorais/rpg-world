import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSheetSource } from './useSheetSource';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
const demo = vi.hoisted(() => ({ isDemo: false }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));
vi.mock('@frontend/demo/DemoContext', () => ({ useDemo: () => demo }));

describe('useSheetSource', () => {
  beforeEach(() => {
    params.value = {};
    demo.isDemo = false;
  });

  it('com partyId: só leitura e os caminhos da mesa', () => {
    params.value = { partyId: 'p1', id: 'c1' };

    const { result } = renderHook(() => useSheetSource('c1', 'dnd_5e'));

    expect(result.current).toEqual({
      readOnly: true,
      partyId: 'p1',
      apiPath: '/api/parties/p1/characters/c1',
      pagesPath: '/parties/p1/characters/c1',
    });
  });

  it('sem partyId: os caminhos do dono', () => {
    params.value = { id: 'c1', system_name: 'DnD_5e' };

    const { result } = renderHook(() => useSheetSource('c1', 'dnd_5e'));

    expect(result.current).toEqual({
      readOnly: false,
      partyId: null,
      apiPath: '/api/characters/c1',
      pagesPath: '/system/dnd_5e/character/c1',
    });
  });

  it('na demo: só leitura e os caminhos da demo', () => {
    demo.isDemo = true;

    const { result } = renderHook(() => useSheetSource('ada', 'dnd_5e'));

    expect(result.current).toEqual({
      readOnly: true,
      partyId: 'the-pioneers',
      apiPath: '/api/parties/the-pioneers/characters/ada',
      pagesPath: '/demo/characters/ada',
    });
  });
});
