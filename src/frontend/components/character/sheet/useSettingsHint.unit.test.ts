// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsHint } from './useSettingsHint';

const KEY = 'rpgworld:hint:sheet-settings-177';

describe('useSettingsHint', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('mostra a dica quando o armazenamento está vazio e some ao dispensar', () => {
    const { result } = renderHook(() => useSettingsHint());
    expect(result.current.show).toBe(true);

    act(() => result.current.dismiss());

    expect(result.current.show).toBe(false);
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('não mostra a dica se ela já foi dispensada', () => {
    localStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useSettingsHint());
    expect(result.current.show).toBe(false);
  });

  it('não mostra a dica nem quebra se ler o armazenamento falhar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useSettingsHint());
    expect(result.current.show).toBe(false);
  });

  it('dispensar não quebra se escrever no armazenamento falhar', () => {
    const { result } = renderHook(() => useSettingsHint());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    act(() => result.current.dismiss());
    expect(result.current.show).toBe(false);
  });
});
