import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useOnline } from './useOnline';

function goOffline(offline: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!offline);
  window.dispatchEvent(new Event(offline ? 'offline' : 'online'));
}

describe('useOnline', () => {
  afterEach(() => vi.restoreAllMocks());

  it('começa com o estado do navegador', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(false);
  });

  it('acompanha os eventos offline e online', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);

    act(() => goOffline(true));
    expect(result.current).toBe(false);

    act(() => goOffline(false));
    expect(result.current).toBe(true);
  });
});
