import type { ItemCatalog } from '@backend/contexts/items/domain/item.repo';

import type { Coins } from '@shared/systems/dnd5e/coins';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import {
  CoinsDelta,
  InventoryDto,
  InventoryItem,
  InventoryRepo,
} from '../../domain/repository/inventory.repo';
import { assertOwnsCharacter } from '../find-owned-character';

/** Where the items themselves come from (the content catalog). */
export type ItemLookup = Pick<ItemCatalog, 'find' | 'findByKeys'>;

export interface AddInventoryItemInput {
  ref: string;
  containerId: string;
  quantity: number;
  /** Idempotency key: the same key twice adds once. */
  key?: string;
}

/** The character's containers and entries; an entry whose item left the catalog has `item: null`. */
export async function loadInventory(
  inventory: InventoryRepo,
  items: ItemLookup,
  characterId: string,
  locale?: string,
): Promise<InventoryDto> {
  const { containers, items: entries } = await inventory.find(characterId);
  const byKey = new Map(
    items
      .findByKeys(
        entries.map((entry) => entry.ref),
        locale,
      )
      .map((item) => [item.key, item]),
  );
  return {
    containers,
    items: entries.map((entry) => ({ ...entry, item: byKey.get(entry.ref) ?? null })),
  };
}

export class GetInventoryUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
    private readonly items: ItemLookup,
  ) {}

  async execute(characterId: string, requesterId: string, locale?: string): Promise<InventoryDto> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'read');
    return loadInventory(this.inventory, this.items, characterId, locale);
  }
}

export class AddInventoryItemUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
    private readonly items: ItemLookup,
  ) {}

  /** Adding what is already in the container sums the quantity (in the database). */
  async execute(
    characterId: string,
    requesterId: string,
    { ref, containerId, quantity, key }: AddInventoryItemInput,
    locale?: string,
  ): Promise<InventoryItem> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    if (!this.items.find(ref)) throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);

    const entry = await this.inventory.addItem(characterId, containerId, ref, quantity, key);
    if (!entry) throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);

    const [item] = this.items.findByKeys([ref], locale);
    return { ...entry, item: item ?? null };
  }
}

export class SetInventoryItemQuantityUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
  ) {}

  /** Writes the absolute value, so two tabs never add up each other's stale reads. */
  async execute(
    characterId: string,
    requesterId: string,
    itemId: string,
    quantity: number,
  ): Promise<void> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    if (!(await this.inventory.setQuantity(characterId, itemId, quantity))) {
      throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);
    }
  }
}

/** An operation (`delta`, with an idempotency `key`) instead of the final value. */
export interface QuantityChange {
  delta: number;
  key: string;
}

/**
 * A change to the coins, with an idempotency `key`: a `delta` to add (Pay, Receive), or the final
 * value of the coins typed by hand, written only if they still are `expected` (what the person
 * saw), so a stale screen can't overwrite what someone else did meanwhile.
 */
export type CoinsChange =
  | { delta: CoinsDelta; key: string }
  | { coins: Partial<Coins>; expected: Partial<Coins>; key: string };

/** Applies `change` to an owner's container (a character's or a party's); null: not theirs. */
export function applyCoinsChange(
  inventory: InventoryRepo,
  ownerId: string,
  containerId: string,
  change: CoinsChange,
): Promise<Coins | null> {
  return 'delta' in change
    ? inventory.changeCoins(ownerId, containerId, change.delta, change.key)
    : inventory.setCoinsIfUnchanged(
        ownerId,
        containerId,
        change.coins,
        change.expected,
        change.key,
      );
}

export class ChangeInventoryItemQuantityUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
  ) {}

  /** Adds `delta` in the database, so two tabs taking one each take two. */
  async execute(
    characterId: string,
    requesterId: string,
    itemId: string,
    { delta, key }: QuantityChange,
  ): Promise<{ quantity: number }> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    const quantity = await this.inventory.changeQuantity(characterId, itemId, delta, key);
    if (quantity === null) throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);
    return { quantity };
  }
}

export class RemoveInventoryItemUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
  ) {}

  async execute(characterId: string, requesterId: string, itemId: string): Promise<void> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    if (!(await this.inventory.remove(characterId, itemId))) {
      throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);
    }
  }
}

export class SetInventoryCoinsUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
  ) {}

  async execute(
    characterId: string,
    requesterId: string,
    containerId: string,
    coins: Coins,
  ): Promise<void> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    if (!(await this.inventory.setCoins(characterId, containerId, coins))) {
      throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);
    }
  }
}

export class ChangeInventoryCoinsUseCase {
  constructor(
    private readonly characters: CharacterRepo,
    private readonly inventory: InventoryRepo,
  ) {}

  /**
   * Adds `delta` to each coin in the database (spending more than there is is a conflict), or
   * writes the typed coins if they still are what the person saw (if not, a conflict too).
   */
  async execute(
    characterId: string,
    requesterId: string,
    containerId: string,
    change: CoinsChange,
  ): Promise<{ coins: Coins }> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    const coins = await applyCoinsChange(this.inventory, characterId, containerId, change);
    if (!coins) throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);
    return { coins };
  }
}
