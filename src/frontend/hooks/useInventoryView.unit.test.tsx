import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INVENTORY_VIEW_KEYS, useInventoryView } from './useInventoryView';

const KEY = INVENTORY_VIEW_KEYS.backpack;

describe('useInventoryView', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('começa em lista', () => {
    const { result } = renderHook(() => useInventoryView(KEY));

    expect(result.current[0]).toBe('list');
  });

  it('persiste a escolha e uma nova montagem a lê', () => {
    const first = renderHook(() => useInventoryView(KEY));
    act(() => first.result.current[1]('grid'));
    expect(first.result.current[0]).toBe('grid');
    first.unmount();

    const second = renderHook(() => useInventoryView(KEY));
    expect(second.result.current[0]).toBe('grid');
  });

  it('chaves diferentes não se misturam', () => {
    const backpack = renderHook(() => useInventoryView(INVENTORY_VIEW_KEYS.backpack));
    const chest = renderHook(() => useInventoryView(INVENTORY_VIEW_KEYS.chest));

    act(() => backpack.result.current[1]('grid'));

    expect(backpack.result.current[0]).toBe('grid');
    expect(chest.result.current[0]).toBe('list');
  });

  it('se o localStorage lançar erro, fica em lista sem exceção', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useInventoryView(KEY));
    expect(result.current[0]).toBe('list');
    expect(() => act(() => result.current[1]('grid'))).not.toThrow();
  });

  it('valor desconhecido vira lista', () => {
    localStorage.setItem(KEY, 'banana');

    const { result } = renderHook(() => useInventoryView(KEY));

    expect(result.current[0]).toBe('list');
  });
});
