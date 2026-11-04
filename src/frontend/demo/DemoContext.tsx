'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { rpgWorldApi } from '@frontend/lib/api-client/rpgWorldApi';

import { createDemoTransport } from './transport';
import type { DemoData } from './types';

interface DemoState {
  isDemo: boolean;
  data: DemoData | null;
  openInvite(): void;
  inviteOpen: boolean;
  setInviteOpen(open: boolean): void;
}

const OUTSIDE: DemoState = {
  isDemo: false,
  data: null,
  openInvite: () => {},
  inviteOpen: false,
  setInviteOpen: () => {},
};

const DemoContext = createContext<DemoState>(OUTSIDE);

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ data, children }: { data: DemoData; children: React.ReactNode }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const transport = useMemo(() => createDemoTransport(data, () => setInviteOpen(true)), [data]);
  // Own cache: nothing from the real app leaks in, and nothing of the demo leaks out
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } }),
  );
  // Layout effect: runs at commit, before the children's passive effects start their queries,
  // and never for a render that is discarded
  useLayoutEffect(() => {
    rpgWorldApi.setTransport(transport);
    return () => rpgWorldApi.setTransport(null);
  }, [transport]);

  const value = useMemo<DemoState>(
    () => ({
      isDemo: true,
      data,
      openInvite: () => setInviteOpen(true),
      inviteOpen,
      setInviteOpen,
    }),
    [data, inviteOpen],
  );

  return (
    <DemoContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DemoContext.Provider>
  );
}
