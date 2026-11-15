import { useCallback, useSyncExternalStore } from 'react';

// TEMPORARY (#177): remove after 2027-02-01
const KEY = 'rpgworld:hint:sheet-settings-177';

const listeners = new Set<() => void>();
// Remembers a dismissal even when storage refuses the write
let dismissedInMemory = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True only when storage was read and holds nothing: any failure keeps the hint hidden. */
function getSnapshot() {
  if (dismissedInMemory) return false;
  try {
    return localStorage.getItem(KEY) === null;
  } catch {
    return false;
  }
}

/** Test-only: forgets the in-memory dismissal so each test starts clean. */
export function resetSettingsHintForTests() {
  dismissedInMemory = false;
}

/**
 * Whether to point at the sheet's gear because it now holds the edition setting. Shown once per
 * browser; every storage access can throw (private mode, blocked data), and then it stays hidden.
 */
// TEMPORARY (#177): remove after 2027-02-01
export function useSettingsHint(): { show: boolean; dismiss: () => void } {
  // The server renders it hidden; the client reads storage after hydration
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Storage unavailable: hide it for this session only
      dismissedInMemory = true;
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { show, dismiss };
}
