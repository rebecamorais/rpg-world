import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { InventoryDto, InventoryRepo } from '../../domain/repository/inventory.repo';
import { ItemLookup, loadInventory } from '../inventory/inventory.use-cases';

/** The inventory of a character brought to the GM's party, read only. */
export class GetPartyCharacterInventoryUseCase {
  constructor(
    private readonly inventory: InventoryRepo,
    private readonly items: ItemLookup,
    private readonly access: PartyGmAccess,
  ) {}

  async execute(partyId: string, id: string, gmId: string, locale?: string): Promise<InventoryDto> {
    if (!(await this.access.isGmOfCharacter(partyId, id, gmId))) {
      throw new CharacterError(CharacterErrorCodes.ACCESS_NOT_FOUND);
    }
    return loadInventory(this.inventory, this.items, id, locale);
  }
}
