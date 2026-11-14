import { useSyncExternalStore } from 'react';

export type InventoryView = 'list' | 'grid';

export const INVENTORY_VIEW_KEYS = {
  backpack: 'rpg-world:inventory-view:backpack',
  chest: 'rpg-world:inventory-view:chest',
} as const;

const DEFAULT_VIEW: InventoryView = 'list';
const listeners = new Set<() => void>();

function read(key: string): InventoryView {
  try {
    return localStorage.getItem(key) === 'grid' ? 'grid' : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** List or grid for a part of the inventory, remembered in localStorage (server and first paint: list). */
export function useInventoryView(storageKey: string): [InventoryView, (v: InventoryView) => void] {
  const view = useSyncExternalStore(
    subscribe,
    () => read(storageKey),
    () => DEFAULT_VIEW,
  );
  const setView = (next: InventoryView) => {
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Storage blocked: the choice just won't be remembered
    }
    listeners.forEach((l) => l());
  };
  return [view, setView];
}
