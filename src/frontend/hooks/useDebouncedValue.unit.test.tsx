import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('só atualiza depois que o valor para de mudar', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'f' },
    });

    rerender({ value: 'fi' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'fir' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('f');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('fir');
  });
});
