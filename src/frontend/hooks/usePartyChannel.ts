import { useEffect, useRef, useState } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { type QueryClient, type QueryKey, useQueryClient } from '@tanstack/react-query';

import { useDemo } from '@frontend/demo/DemoContext';
import { useOnline } from '@frontend/hooks/useOnline';
import {
  PARTIES_QUERY_KEY,
  encounterQueryKey,
  partyChestMutationKey,
  partyChestQueryKey,
  partyQueryKey,
} from '@frontend/lib/query-keys';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

/** What each broadcast of the party's channel makes stale, and the writes it waits for. */
type Notice = { queries: QueryKey[]; pendingWrite?: QueryKey };

const notices = (partyId: string): Record<'encounter' | 'party' | 'chest', Notice> => ({
  // Combat changes, and sheets saved while in it
  encounter: {
    queries: [encounterQueryKey(partyId)],
    pendingWrite: encounterQueryKey(partyId),
  },
  // Who is at the table, the characters they brought, the party itself; the party list shows the
  // pending requests and the names too
  party: { queries: [partyQueryKey(partyId), PARTIES_QUERY_KEY] },
  // The chest's coins and items
  chest: { queries: [partyChestQueryKey(partyId)], pendingWrite: partyChestMutationKey(partyId) },
});

/**
 * A fetch already in flight may have read before this change: invalidating alone would reuse it
 * (TanStack dedupes a first load), so it's cancelled and fetched again. With one of this person's
 * writes still on its way, that write refetches when it finishes (useEncounter, useInventory);
 * refetching now would read the database before it's saved and undo it on screen.
 */
async function refresh(queryClient: QueryClient, { queries, pendingWrite }: Notice) {
  if (pendingWrite && queryClient.isMutating({ mutationKey: pendingWrite }) > 0) return;
  await Promise.all(
    queries.map(async (queryKey) => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    }),
  );
}

/**
 * Listens to the party's private channel. The database sends an empty broadcast on every change:
 * "encounter" for the combat (and a sheet in it being saved), "party" for who is at the table and
 * what they brought, "chest" for the chest. The view is then fetched again through the API, so
 * nobody receives what they may not see. Every SUBSCRIBED, including after a dropped connection,
 * fetches all of them again too. `live` is false while the channel isn't subscribed or the
 * browser is offline: the channel takes a while to notice a dropped network, and until then the
 * screen would look current while nothing reaches it.
 */
export function usePartyChannel(partyId: string) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();
  const online = useOnline();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // The demo is a fixed catalog: there is no channel to listen to
    if (isDemo) return;
    const client = getSupabaseBrowserClient();
    const byEvent = notices(partyId);
    const refreshAll = () =>
      Promise.all(Object.values(byEvent).map((notice) => refresh(queryClient, notice)));
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      // Private channels authorize with the user's token (the database decides who listens)
      await client.realtime.setAuth();
      if (cancelled) return;
      channel = client.channel(`party:${partyId}`, { config: { private: true } });
      for (const [event, notice] of Object.entries(byEvent)) {
        channel.on('broadcast', { event }, () => refresh(queryClient, notice));
      }
      channel.subscribe((status) => {
        const isSubscribed = status === 'SUBSCRIBED';
        setSubscribed(isSubscribed);
        if (isSubscribed) refreshAll();
      });
    })();

    return () => {
      cancelled = true;
      if (channel) client.removeChannel(channel);
    };
  }, [partyId, queryClient, isDemo]);

  // Back online with the channel still subscribed (it never noticed): what changed meanwhile
  // came as broadcasts nobody heard, so everything is fetched again
  const wasOnline = useRef(online);
  useEffect(() => {
    const cameBack = online && !wasOnline.current;
    wasOnline.current = online;
    if (!cameBack || isDemo) return;
    for (const { queries, pendingWrite } of Object.values(notices(partyId))) {
      if (pendingWrite && queryClient.isMutating({ mutationKey: pendingWrite }) > 0) continue;
      for (const queryKey of queries) void queryClient.invalidateQueries({ queryKey });
    }
  }, [online, partyId, queryClient, isDemo]);

  return { live: subscribed && online };
}
