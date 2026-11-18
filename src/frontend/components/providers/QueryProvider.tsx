'use client';

import { useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { retryQuery } from '@frontend/lib/error-message';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute Cache
            refetchOnWindowFocus: false,
            // A 4xx comes back the same: a character that isn't yours shows "not found" at once
            retry: retryQuery,
          },
          // Offline, a change fails at once instead of waiting for the connection: a damage or
          // an "End turn" sent minutes later would land on a combat that has moved on. Queries
          // still wait, keeping what is on screen
          mutations: {
            networkMode: 'always',
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
