'use client';

import { createContext, useContext, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { InventoryApi, InventoryItem } from '@frontend/hooks/useInventory';

/** An entry that just left the list; its row keeps its place until the toast goes. */
interface Removed {
  entry: InventoryItem;
  /** Where it was in the list when removed. */
  index: number;
}

interface RemovedItems {
  isRemoved: (id: string) => boolean;
  undo: (id: string) => void;
}

const RemovedItemsContext = createContext<RemovedItems>({
  isRemoved: () => false,
  undo: () => {},
});

export const RemovedItemsProvider = RemovedItemsContext.Provider;

/** Tells the placeholders of removed entries apart from the live ones. */
export function useIsRemoved() {
  return useContext(RemovedItemsContext).isRemoved;
}

/** Whether this entry's row is the placeholder of a removed item, and how to bring it back. */
export function useRemovedItem(id: string) {
  const { isRemoved, undo } = useContext(RemovedItemsContext);
  return { removed: isRemoved(id), undo: () => undo(id) };
}

const nameOf = (entry: InventoryItem) => entry.item?.name ?? entry.ref;

/**
 * The removed entries back in their old places, weighing nothing, so the group and total weights
 * stay right. Inserted newest first: each index was taken from the list as it was then, without
 * the entries removed before it.
 */
function withRemoved(entries: InventoryItem[], removed: Removed[]): InventoryItem[] {
  const result = [...entries];
  for (const { entry, index } of [...removed].reverse()) {
    result.splice(Math.min(index, result.length), 0, {
      ...entry,
      item: entry.item && { ...entry.item, weight: null },
    });
  }
  return result;
}

/**
 * Removing from a list that stays still. Without it, the row left at once, the list moved up,
 * and a quick second tap landed on the item below. Now the row keeps its space (with its own
 * Undo) until the toast closes, and removals in a row share one toast ("2 items removed"), whose
 * Undo brings them all back: a second toast used to hide the first one's Undo.
 */
export function useRemovedItems({
  entries,
  removeItem,
  restoreItem,
  toastId,
}: {
  entries: InventoryItem[];
  removeItem: InventoryApi['removeItem'];
  restoreItem: InventoryApi['restoreItem'];
  /** One per list (backpack, party chest): their toasts don't merge. */
  toastId: string;
}) {
  const t = useTranslations('characters.inventory');
  const [removed, setRemoved] = useState<Removed[]>([]);
  // The toast's callbacks outlive the render that made them; they read the batch from here
  const current = useRef<Removed[]>([]);

  const commit = (next: Removed[]) => {
    current.current = next;
    setRemoved(next);
  };
  const clear = () => commit([]);

  const undoAll = () => {
    for (const { entry } of current.current) restoreItem(entry);
    clear();
  };

  const announce = (batch: Removed[]) => {
    if (batch.length === 0) {
      toast.dismiss(toastId);
      return;
    }
    const message =
      batch.length === 1
        ? t('removed', { name: nameOf(batch[0].entry) })
        : t('removedMany', { count: batch.length });
    // The same id updates the toast in place (and restarts its timer) instead of stacking another
    toast(message, {
      id: toastId,
      action: { label: t('undo'), onClick: undoAll },
      onDismiss: clear,
      onAutoClose: clear,
    });
  };

  const remove = (entry: InventoryItem) => {
    const index = entries.findIndex((e) => e.id === entry.id);
    removeItem(entry.id);
    const next = [...current.current, { entry, index }];
    commit(next);
    announce(next);
  };

  const undo = (id: string) => {
    const found = current.current.find((r) => r.entry.id === id);
    if (!found) return;
    restoreItem(found.entry);
    const next = current.current.filter((r) => r !== found);
    commit(next);
    announce(next);
  };

  // A removal the server refused puts the entry back in the list: it is no longer a placeholder
  const shown = removed.filter((r) => !entries.some((e) => e.id === r.entry.id));
  const removedIds = new Set(shown.map((r) => r.entry.id));

  return {
    /** The entries to draw: the list plus the placeholders. */
    display: withRemoved(entries, shown),
    remove,
    context: { isRemoved: (id: string) => removedIds.has(id), undo } satisfies RemovedItems,
  };
}
