import { useSyncExternalStore } from 'react';

import { useQuery } from '@tanstack/react-query';

import { APIError, rpgWorldApi } from '@client';

import { SESSION_QUERY_KEY } from '@frontend/lib/query-keys';

import type { User } from '@shared/types/user';

export type SessionStatus = 'loading' | 'signed-in' | 'signed-out';

// The session lives in the sb-* cookies: without one, nobody is signed in and nothing is asked
const hasSessionCookie = () => /(?:^|;\s*)sb-/.test(document.cookie);
const noSubscription = () => () => {};

/**
 * Who is signed in, for parts of prebuilt pages (the public header and footer). The server and
 * the hydration render it signed-out (the HTML is the same for everyone); the inline script in
 * the root layout hides the signed-out buttons meanwhile when there is a session cookie.
 * `known`: the session the server already read (signed-in pages); nothing is asked then.
 */
export function useSession(known?: User | null): { user: User | null; status: SessionStatus } {
  const cookie = useSyncExternalStore(noSubscription, hasSessionCookie, () => false);

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        return await rpgWorldApi.get<User>('/api/auth/session');
      } catch (error) {
        // Expired or invalid session: signed out, not an error
        if (error instanceof APIError && error.status === 401) return null;
        throw error;
      }
    },
    enabled: cookie && known === undefined,
    staleTime: 5 * 60 * 1000,
  });

  if (known !== undefined) return { user: known, status: known ? 'signed-in' : 'signed-out' };
  if (!cookie) return { user: null, status: 'signed-out' };
  if (query.isPending) return { user: null, status: 'loading' };
  return query.data
    ? { user: query.data, status: 'signed-in' }
    : { user: null, status: 'signed-out' };
}
