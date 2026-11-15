import type { ItemDto } from '@backend/contexts/items/domain/item';

import type { Coins } from '@shared/systems/dnd5e/coins';

export interface InventoryContainer {
  id: string;
  kind: 'coin_pouch' | 'backpack' | 'chest' | 'party_chest';
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
 * One owner's containers and what is in them: a character's (coin pouch, backpack, chest) or a
 * party's (its chest). The writes answer `false`/`null` when no row changed: the container or
 * entry isn't this owner's.
 */
export interface InventoryRepo {
  find(ownerId: string): Promise<{ containers: InventoryContainer[]; items: InventoryEntry[] }>;
  /**
   * Adds to the entry already in the container, if any (summed in the database). A `key` already
   * used by this person adds nothing and answers the entry as it is.
   */
  addItem(
    ownerId: string,
    containerId: string,
    ref: string,
    quantity: number,
    key?: string,
  ): Promise<InventoryEntry | null>;
  setQuantity(ownerId: string, itemId: string, quantity: number): Promise<boolean>;
  /**
   * Adds `delta` to the quantity in the database, so two tabs add up. Answers the new quantity;
   * a repeated `key` changes nothing and answers the current one.
   */
  changeQuantity(
    ownerId: string,
    itemId: string,
    delta: number,
    key: string,
  ): Promise<number | null>;
  remove(ownerId: string, itemId: string): Promise<boolean>;
  setCoins(ownerId: string, containerId: string, coins: Coins): Promise<boolean>;
  /** Adds `delta` to each coin in the database (the same rules as `changeQuantity`). */
  changeCoins(
    ownerId: string,
    containerId: string,
    delta: CoinsDelta,
    key: string,
  ): Promise<Coins | null>;
}

/** How much each coin goes up (or down); coins left out don't change. */
export type CoinsDelta = Partial<Coins>;
