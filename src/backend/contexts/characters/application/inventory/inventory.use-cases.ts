import type { ItemCatalog } from '@backend/contexts/items/domain/item';

import type { Coins } from '@shared/systems/dnd5e/coins';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterRepo } from '../../domain/repository';
import { InventoryDto, InventoryItem, InventoryRepo } from '../../domain/repository/inventory.repo';
import { assertOwnsCharacter } from '../find-owned-character';

/** Where the items themselves come from (the content catalog). */
export type ItemLookup = Pick<ItemCatalog, 'find' | 'findByKeys'>;

export interface AddInventoryItemInput {
  ref: string;
  containerId: string;
  quantity: number;
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
    { ref, containerId, quantity }: AddInventoryItemInput,
    locale?: string,
  ): Promise<InventoryItem> {
    await assertOwnsCharacter(this.characters, characterId, requesterId, 'write');
    if (!this.items.find(ref)) throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);

    const entry = await this.inventory.addItem(characterId, containerId, ref, quantity);
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
