import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSheetSource } from './useSheetSource';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({ useParams: () => params.value }));

describe('useSheetSource', () => {
  beforeEach(() => {
    params.value = {};
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
});
