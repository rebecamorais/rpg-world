'use client';

import { type RefObject, useEffect, useRef } from 'react';

import { Toaster } from '@frontend/components/ui/sonner';
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';

/** Sonner's own breakpoint for its full-width phone layout. */
const PHONE = '(max-width: 600px)';

/**
 * Fired by Radix on the element pressed (or focused) outside an open dialog, popover or menu,
 * right before it closes. They don't bubble, but they do go through the capture phase.
 */
const OUTSIDE_EVENTS = ['dismissableLayer.pointerDownOutside', 'dismissableLayer.focusOutside'];

const TOASTER = '[data-sonner-toaster]';

/**
 * A press on a toast isn't a press "outside" the open modal: clicking Undo in the spell search
 * fell through to the overlay, and the modal closed with the spell still forgotten.
 */
function useToastsKeepLayersOpen() {
  useEffect(() => {
    const keepOpen = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(TOASTER)) event.preventDefault();
    };
    for (const name of OUTSIDE_EVENTS) document.addEventListener(name, keepOpen, true);
    return () => {
      for (const name of OUTSIDE_EVENTS) document.removeEventListener(name, keepOpen, true);
    };
  }, []);
}

/** What a modal library sets on the rest of the page to hide it from screen readers. */
const HIDING = ['aria-hidden', 'data-aria-hidden'];

/**
 * An open modal hides everything else from screen readers (Radix's `hideOthers`). The toasts
 * must stay out of that: they announce the save that just happened and carry the Undo, which
 * has to stay reachable while the modal is open. Whatever hides the toaster gets undone.
 */
function useToasterNeverHidden(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const region = ref.current;
    if (!region) return;
    const reveal = () => {
      for (const name of HIDING) if (region.hasAttribute(name)) region.removeAttribute(name);
    };
    reveal();
    const observer = new MutationObserver(reveal);
    observer.observe(region, { attributes: true, attributeFilter: HIDING });
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * The app's toasts. On phones they sit at the top, under the notch: at the bottom they covered the
 * tab bar, the save bar and the HP panel that had just been used. `pointer-events-auto` because
 * an open Radix modal turns pointer events off on the body, and the toaster inherited it.
 */
export function AppToaster() {
  const phone = useMediaQuery(PHONE);
  // Sonner forwards the ref to its <section aria-live>, the region the toasts live in
  const region = useRef<HTMLElement>(null);
  useToastsKeepLayersOpen();
  useToasterNeverHidden(region);

  return (
    <Toaster
      ref={region}
      className="toaster group pointer-events-auto"
      position={phone ? 'top-center' : 'bottom-right'}
      mobileOffset={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
    />
  );
}
