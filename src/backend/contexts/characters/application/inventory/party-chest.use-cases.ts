import type { Coins } from '@shared/systems/dnd5e/coins';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { InventoryDto, InventoryItem, InventoryRepo } from '../../domain/repository/inventory.repo';
import { AddInventoryItemInput, ItemLookup, loadInventory } from './inventory.use-cases';

/*
 * The party chest: the same containers and entries as a character's inventory, owned by the party.
 * Who reads and writes it (the GM and the active players) is the database's call (RLS): anyone
 * else finds no chest, so every use case answers "not found" for them.
 */

export class GetPartyChestUseCase {
  constructor(
    private readonly chest: InventoryRepo,
    private readonly items: ItemLookup,
  ) {}

  async execute(partyId: string, locale?: string): Promise<InventoryDto> {
    const inventory = await loadInventory(this.chest, this.items, partyId, locale);
    if (inventory.containers.length === 0) {
      throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);
    }
    return inventory;
  }
}

export class AddPartyChestItemUseCase {
  constructor(
    private readonly chest: InventoryRepo,
    private readonly items: ItemLookup,
  ) {}

  /** Adding what is already in the chest sums the quantity (in the database). */
  async execute(
    partyId: string,
    { ref, containerId, quantity }: AddInventoryItemInput,
    locale?: string,
  ): Promise<InventoryItem> {
    if (!this.items.find(ref)) throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);

    const entry = await this.chest.addItem(partyId, containerId, ref, quantity);
    if (!entry) throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);

    const [item] = this.items.findByKeys([ref], locale);
    return { ...entry, item: item ?? null };
  }
}

export class SetPartyChestItemQuantityUseCase {
  constructor(private readonly chest: InventoryRepo) {}

  async execute(partyId: string, itemId: string, quantity: number): Promise<void> {
    if (!(await this.chest.setQuantity(partyId, itemId, quantity))) {
      throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);
    }
  }
}

export class RemovePartyChestItemUseCase {
  constructor(private readonly chest: InventoryRepo) {}

  async execute(partyId: string, itemId: string): Promise<void> {
    if (!(await this.chest.remove(partyId, itemId))) {
      throw new CharacterError(CharacterErrorCodes.ITEM_NOT_FOUND);
    }
  }
}

export class SetPartyChestCoinsUseCase {
  constructor(private readonly chest: InventoryRepo) {}

  async execute(partyId: string, containerId: string, coins: Coins): Promise<void> {
    if (!(await this.chest.setCoins(partyId, containerId, coins))) {
      throw new CharacterError(CharacterErrorCodes.CONTAINER_NOT_FOUND);
    }
  }
}
