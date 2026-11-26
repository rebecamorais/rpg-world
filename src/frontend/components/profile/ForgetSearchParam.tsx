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
    window.history.replaceState(window.history.state, '', url);
  }, [name]);
  return null;
}
