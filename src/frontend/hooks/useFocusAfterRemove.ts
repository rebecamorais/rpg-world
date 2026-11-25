import { useEffect, useRef } from 'react';

/** Marks an element the focus can move to; its value names it (a row's id, a heading). */
const FOCUS_KEY = 'data-focus-key';

interface Pending {
  removed: string;
  targets: string[];
}

/**
 * After a confirmation, the focus goes back to the button that opened it. When the change then
 * removes that button (its row leaves the list), the focus would fall to the page's start. This
 * moves it to the first of `targets` still on the page instead: the next row, the one before, a
 * heading.
 *
 * The elements live under `root` and carry `data-focus-key` . Call `next(removed,
 * targets)` before the change, and `cancel()` when it failed and the row stays. The data can arrive
 * a render or more after the request (RULES_REFERENCE, section 11), so the check runs on every
 * render until the removed element is gone. If the person has moved the focus somewhere else by
 * then, it stays where they put it.
 */
export function useFocusAfterRemove<T extends HTMLElement = HTMLDivElement>() {
  const root = useRef<T>(null);
  const pending = useRef<Pending | null>(null);

  useEffect(() => {
    const current = pending.current;
    if (!current || !root.current) return;
    const keyed = [...root.current.querySelectorAll<HTMLElement>(`[${FOCUS_KEY}]`)];
    const byKey = (key: string) => keyed.find((el) => el.getAttribute(FOCUS_KEY) === key);
    if (byKey(current.removed)) return;
    pending.current = null;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    current.targets
      .map(byKey)
      .find((el) => el !== undefined)
      ?.focus();
  });

  const next = (removed: string, targets: string[]) => {
    pending.current = { removed, targets };
  };
  const cancel = () => {
    pending.current = null;
  };

  return { root, next, cancel };
}

/** Where to go when `id` leaves `ids`: the next one, else the one before, then `fallbacks`. */
export function neighbours(
  ids: string[],
  id: string,
  ...fallbacks: (string | undefined)[]
): string[] {
  const index = ids.indexOf(id);
  return [ids[index + 1], ids[index - 1], ...fallbacks].filter(
    (key): key is string => key !== undefined && key !== id,
  );
}
