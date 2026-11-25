import { useEffect, useRef } from 'react';

/** Marks an element the focus can move to; its value names it (a row's id, a heading). */
const FOCUS_KEY = 'data-focus-key';

interface Pending {
  targets: string[];
  /** The change failed: the row stays, and the focus goes back to it once it can take it. */
  failed: boolean;
}

const CLOSING_DIALOG =
  '[role="dialog"][data-state="closed"], [role="alertdialog"][data-state="closed"]';

/**
 * Whether the focus is nowhere the person chose: on the page's body, or still inside a dialog that
 * is closing (its exit animation keeps it mounted, and the button it would give the focus back to
 * may already be gone).
 */
function focusIsLost() {
  const active = document.activeElement;
  return !active || active === document.body || !!active.closest(CLOSING_DIALOG);
}

/**
 * After a confirmation, the focus goes back to the button that opened it. When the change then
 * removes that button (its row leaves the list), the focus would fall to the page's start. This
 * moves it to the first of `targets` that can take it: the next row, the one before, a heading.
 *
 * The elements live under `root` and carry `data-focus-key`. Call `next(removed, targets)` before
 * the change, and `cancel(removed)` when it failed and the row stays. Several rows can wait at
 * once, each with its own entry. The data can arrive a render or more after the request
 * (RULES_REFERENCE, section 11), so the check runs on every render. If the person has moved the
 * focus somewhere else by then, it stays where they put it.
 */
export function useFocusAfterRemove<T extends HTMLElement = HTMLDivElement>() {
  const root = useRef<T>(null);
  const pending = useRef(new Map<string, Pending>());

  useEffect(() => {
    if (pending.current.size === 0 || !root.current) return;
    const keyed = [...root.current.querySelectorAll<HTMLElement>(`[${FOCUS_KEY}]`)];
    const byKey = (key: string) => keyed.find((el) => el.getAttribute(FOCUS_KEY) === key);
    const usable = (el: HTMLElement | undefined): el is HTMLElement =>
      !!el && !el.matches(':disabled');

    for (const [removed, entry] of pending.current) {
      const row = byKey(removed);
      if (entry.failed) {
        // Back to the row's button once it is enabled again, if the focus was lost meanwhile
        if (!row) pending.current.delete(removed);
        else if (usable(row)) {
          pending.current.delete(removed);
          if (focusIsLost()) row.focus();
        }
        continue;
      }
      if (row) continue;
      pending.current.delete(removed);
      if (focusIsLost()) entry.targets.map(byKey).find(usable)?.focus();
    }
  });

  const next = (removed: string, targets: string[]) => {
    pending.current.set(removed, { targets, failed: false });
  };
  const cancel = (removed: string) => {
    const entry = pending.current.get(removed);
    if (entry) entry.failed = true;
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
  const around = index === -1 ? [] : [ids[index + 1], ids[index - 1]];
  return [...around, ...fallbacks].filter((key): key is string => key !== undefined && key !== id);
}
