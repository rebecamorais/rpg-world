'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@frontend/lib/api-client/rpg-world-api';

import { createDemoTransport } from './transport';
import type { DemoData } from './types';

interface DemoState {
  isDemo: boolean;
  data: DemoData | null;
  /**
   * The visitor tried to change something: the invite the first time in the visit, a single
   * toast after that (never stacked, never with the invite open).
   */
  refuseWrite(): void;
  inviteOpen: boolean;
  setInviteOpen(open: boolean): void;
}

const OUTSIDE: DemoState = {
  isDemo: false,
  data: null,
  refuseWrite: () => {},
  inviteOpen: false,
  setInviteOpen: () => {},
};

const DemoContext = createContext<DemoState>(OUTSIDE);

export const useDemo = () => useContext(DemoContext);

/** Sonner id of the read-only toast: a new refusal replaces it instead of stacking another. */
const READ_ONLY_TOAST = 'demo-read-only';

/**
 * Wraps the handler of a button that opens a write form (Pay, Add item, Delete): in the demo the
 * click is refused at once, instead of after the visitor filled the whole form in.
 */
export function useWriteGuard() {
  const { isDemo, refuseWrite } = useDemo();
  return useCallback(
    <Args extends unknown[]>(open: (...args: Args) => void) =>
      (...args: Args) =>
        isDemo ? refuseWrite() : open(...args),
    [isDemo, refuseWrite],
  );
}

export function DemoProvider({ data, children }: { data: DemoData; children: React.ReactNode }) {
  const t = useTranslations('demo');
  const [inviteOpen, setInviteOpenState] = useState(false);
  // Refs, not state: the transport calls refuseWrite from a request, outside the render
  const invited = useRef(false);
  const open = useRef(false);
  const setInviteOpen = useCallback((next: boolean) => {
    open.current = next;
    setInviteOpenState(next);
  }, []);
  const refuseWrite = useCallback(() => {
    if (!invited.current) {
      invited.current = true;
      setInviteOpen(true);
    } else if (!open.current) {
      toast(t('readOnly'), { id: READ_ONLY_TOAST });
    }
  }, [setInviteOpen, t]);
  // Own cache: nothing from the real app leaks in, and nothing of the demo leaks out
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } }),
  );
  // Layout effect: runs at commit, before the children's passive effects start their queries,
  // and never for a render that is discarded
  useLayoutEffect(() => {
    rpgWorldApi.setTransport(createDemoTransport(data, refuseWrite));
    return () => rpgWorldApi.setTransport(null);
  }, [data, refuseWrite]);

  const value = useMemo<DemoState>(
    () => ({ isDemo: true, data, refuseWrite, inviteOpen, setInviteOpen }),
    [data, refuseWrite, inviteOpen, setInviteOpen],
  );

  return (
    <DemoContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DemoContext.Provider>
  );
}
