import { useRef } from 'react';

/**
 * Props for the content of a dialog opened without a DialogTrigger: Radix has nothing to give the
 * focus back to, so a keyboard user would land at the top of the page when it closes.
 */
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      opener.current?.focus();
    },
  };
}
