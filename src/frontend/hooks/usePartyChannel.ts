import { useEffect, useRef, useState } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

import { useDemo } from '@frontend/demo/DemoContext';
import { useOnline } from '@frontend/hooks/useOnline';
import { encounterQueryKey } from '@frontend/lib/query-keys';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

/**
 * Listens to the party's private channel. The database sends an empty "encounter" broadcast on
 * every change to the combat (and when a sheet in it is saved); the view is then fetched again
 * through the API, so nobody receives what they may not see. Every SUBSCRIBED, including after a
 * dropped connection, fetches again too. `live` is false while the channel isn't subscribed or
 * the browser is offline: the channel takes a while to notice a dropped network, and until then
 * the screen would look current while nothing reaches it.
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
    const queryKey = encounterQueryKey(partyId);
    // A fetch already in flight may have read the combat before this change: invalidating alone
    // would reuse it (TanStack dedupes a first load), so it's cancelled and fetched again
    // With one of this person's changes still on its way, that change refetches when it finishes
    // (useEncounter); refetching now would read the database before it's saved and undo it on screen
    const refresh = async () => {
      if (queryClient.isMutating({ mutationKey: queryKey }) > 0) return;
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    };
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    (async () => {
      // Private channels authorize with the user's token (the database decides who listens)
      await client.realtime.setAuth();
      if (cancelled) return;
      channel = client
        .channel(`party:${partyId}`, { config: { private: true } })
        .on('broadcast', { event: 'encounter' }, refresh)
        .subscribe((status) => {
          const isSubscribed = status === 'SUBSCRIBED';
          setSubscribed(isSubscribed);
          if (isSubscribed) refresh();
        });
    })();

    return () => {
      cancelled = true;
      if (channel) client.removeChannel(channel);
    };
  }, [partyId, queryClient, isDemo]);

  // Back online with the channel still subscribed (it never noticed): what changed meanwhile
  // came as broadcasts nobody heard, so the combat is fetched again
  const wasOnline = useRef(online);
  useEffect(() => {
    const cameBack = online && !wasOnline.current;
    wasOnline.current = online;
    if (!cameBack || isDemo) return;
    const queryKey = encounterQueryKey(partyId);
    if (queryClient.isMutating({ mutationKey: queryKey }) > 0) return;
    void queryClient.invalidateQueries({ queryKey });
  }, [online, partyId, queryClient, isDemo]);

  return { live: subscribed && online };
}
