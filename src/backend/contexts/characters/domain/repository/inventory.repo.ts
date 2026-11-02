import type { ItemDto } from '@backend/contexts/items/domain/item';

import type { Coins } from '@shared/systems/dnd5e/coins';

export interface InventoryContainer {
  id: string;
  kind: 'coin_pouch' | 'backpack' | 'chest';
  name: string | null;
  position: number;
  coins: Coins;
}

/** An entry as stored: the item is only a content key (`ref`), the catalog resolves it. */
export interface InventoryEntry {
  id: string;
  containerId: string;
  ref: string;
  quantity: number;
}

export interface InventoryItem extends InventoryEntry {
  /** `null` when the ref is no longer in the catalog. */
  item: ItemDto | null;
}

export interface InventoryDto {
  containers: InventoryContainer[];
  items: InventoryItem[];
}

/**
 * A character's own containers and what is in them (the party chest is not here). The writes
 * answer `false`/`null` when no row changed: the container or entry isn't this character's.
 */
export interface InventoryRepo {
  find(characterId: string): Promise<{ containers: InventoryContainer[]; items: InventoryEntry[] }>;
  /** Adds to the entry already in the container, if any (summed in the database). */
  addItem(
    characterId: string,
    containerId: string,
    ref: string,
    quantity: number,
  ): Promise<InventoryEntry | null>;
  setQuantity(characterId: string, itemId: string, quantity: number): Promise<boolean>;
  remove(characterId: string, itemId: string): Promise<boolean>;
  setCoins(characterId: string, containerId: string, coins: Coins): Promise<boolean>;
}
