import { useEffect, useState } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

import { encounterQueryKey } from '@frontend/lib/query-keys';

import { getSupabaseBrowserClient } from '@lib/supabase-browser';

/**
 * Listens to the party's private channel. The database sends an empty "encounter" broadcast on
 * every change to the combat (and when a sheet in it is saved); the view is then fetched again
 * through the API, so nobody receives what they may not see. Every SUBSCRIBED, including after a
 * dropped connection, fetches again too. `live` is false while the channel isn't subscribed.
 */
export function usePartyChannel(partyId: string) {
  const queryClient = useQueryClient();
  const [live, setLive] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    const refresh = () => queryClient.invalidateQueries({ queryKey: encounterQueryKey(partyId) });
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
          const subscribed = status === 'SUBSCRIBED';
          setLive(subscribed);
          if (subscribed) refresh();
        });
    })();

    return () => {
      cancelled = true;
      if (channel) client.removeChannel(channel);
    };
  }, [partyId, queryClient]);

  return { live };
}
