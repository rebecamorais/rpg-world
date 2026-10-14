import { ComponentType, ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderOptions, render, renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { TooltipProvider } from '@frontend/components/ui/tooltip';

import en from '../../messages/en.json';

/** Providers the app's client components expect (see `Providers`), with English messages. */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const { Wrapper, queryClient } = createWrapper();
  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}

/** `wrapper` (e.g. a context provider under test) is rendered inside the app providers. */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: { initialProps?: Props; wrapper?: ComponentType<{ children: ReactNode }> } = {},
) {
  const { Wrapper, queryClient } = createWrapper();
  const { wrapper: Inner, initialProps } = options;
  const wrapper = Inner
    ? ({ children }: { children: ReactNode }) => (
        <Wrapper>
          <Inner>{children}</Inner>
        </Wrapper>
      )
    : Wrapper;
  return { ...renderHook(hook, { wrapper, initialProps }), queryClient };
}

export { en as messages };
