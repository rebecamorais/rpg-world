'use client';

import { useEffect, useRef } from 'react';

/**
 * Events already answered by one guard. A sheet can hold two drafts (the character and the
 * lore), each with its own guard: the second must not ask again what the first just asked.
 */
const answered = new WeakSet<Event>();

/** The bits of the Navigation API the guard uses (not in every browser, nor in TS's DOM lib yet). */
interface TraverseEvent extends Event {
  navigationType: string;
  destination: { url: string };
}

/**
 * While there are unsaved edits, asks before leaving: closing or reloading the tab
 * (beforeunload), clicking an in-app link and going Back/Forward (browser button, Android
 * back gesture) to a page outside `stayWithin`. Back/Forward needs the Navigation API: without
 * it, there's no asking (popstate comes after Next has already rendered the other page).
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

      if (answered.has(event)) return;
      answered.add(event);
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Back/Forward: popstate is too late (Next renders the other page on it, unmounting this
    // draft), but the Navigation API's navigate event comes first and can be cancelled. The
    // browser only allows that after the user interacted with the page, which editing is.
    const navigation = (window as { navigation?: EventTarget }).navigation;
    const onNavigate = (event: Event) => {
      const { navigationType, destination, cancelable } = event as TraverseEvent;
      if (navigationType !== 'traverse' || !cancelable) return;
      const url = new URL(destination.url);
      if (url.origin !== window.location.origin) return; // beforeunload covers it
      if (stayWithinRef.current(url.pathname)) return;
      if (answered.has(event)) return;
      answered.add(event);
      if (!window.confirm(message)) event.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    navigation?.addEventListener('navigate', onNavigate);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
      navigation?.removeEventListener('navigate', onNavigate);
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
