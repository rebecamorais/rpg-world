import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import en from '../../../../../messages/en.json';
import pt from '../../../../../messages/pt.json';
import { useItemFormat } from './useItemFormat';

const formatIn = (locale: 'en' | 'pt') =>
  renderHook(() => useItemFormat(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale={locale} messages={locale === 'en' ? en : pt} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    ),
  }).result.current;

describe('useItemFormat: peso', () => {
  it('em inglês fica em libras, com uma casa', () => {
    const fmt = formatIn('en');
    expect(fmt.weight(65)).toBe('65 lb');
    expect(fmt.weight(0.75)).toBe('0.8 lb');
    // Total of the backpack: 10 x 2 + 1 x 5
    expect(fmt.weight(25)).toBe('25 lb');
  });

  it('em português vira quilos, como nos livros pt-BR (1 lb = 0,5 kg)', () => {
    const fmt = formatIn('pt');
    expect(fmt.weight(65)).toBe('32,5 kg');
    expect(fmt.weight(1)).toBe('0,5 kg');
    expect(fmt.weight(0.25)).toBe('0,13 kg');
    expect(fmt.weight(25)).toBe('12,5 kg');
  });
});
