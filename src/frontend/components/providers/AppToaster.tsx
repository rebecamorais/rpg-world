'use client';

import { useEffect } from 'react';

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

/**
 * The app's toasts. On phones they sit at the top, under the notch: at the bottom they covered the
 * tab bar, the save bar and the HP panel that had just been used. `pointer-events-auto` because
 * an open Radix modal turns pointer events off on the body, and the toaster inherited it.
 */
export function AppToaster() {
  const phone = useMediaQuery(PHONE);
  useToastsKeepLayersOpen();

  return (
    <Toaster
      className="toaster group pointer-events-auto"
      position={phone ? 'top-center' : 'bottom-right'}
      mobileOffset={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
    />
  );
}
