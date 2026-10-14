'use client';

import { useEffect, useRef } from 'react';

/**
 * While there are unsaved edits, asks before leaving: closing or reloading the tab
 * (beforeunload) and clicking an in-app link to a page outside `stayWithin`.
 */
export function useLeaveGuard(
  isDirty: boolean,
  stayWithin: (pathname: string) => boolean,
  message: string,
) {
  const stayWithinRef = useRef(stayWithin);
  useEffect(() => {
    stayWithinRef.current = stayWithin;
  });

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // Next's <Link> navigates without unloading the page, so links are checked on click
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // beforeunload covers it
      if (stayWithinRef.current(url.pathname)) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [isDirty, message]);
}

/** Ctrl+S / Cmd+S calls `onSave` instead of the browser's "save page". Pass null to disable. */
export function useSaveShortcut(onSave: (() => void) | null) {
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
      if (!onSaveRef.current) return;
      event.preventDefault();
      onSaveRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
