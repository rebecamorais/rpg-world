'use client';

import { useEffect } from 'react';

/**
 * Takes `name` out of the address once the page has read it, without a navigation: a one-time
 * notice (`?passwordChanged=1`) would otherwise come back on every reload or shared link.
 */
export function ForgetSearchParam({ name }: { name: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(name)) return;
    url.searchParams.delete(name);
    // `null`, not `history.state`: that state carries Next's `__NA` flag, and with it Next's
    // patched replaceState skips the router sync, so `useSearchParams` and the router's URL keep
    // the param and the next router commit writes it back. With `null`, Next copies its own
    // internal state and syncs (Native History API, linking-and-navigating docs).
    window.history.replaceState(null, '', url);
  }, [name]);
  return null;
}
