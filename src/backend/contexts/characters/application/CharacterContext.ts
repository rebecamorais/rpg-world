import type { Coins } from '@shared/systems/dnd5e/coins';

import { Character, CharacterKind } from '../domain/entity/Character';
import { DnD5eCharacter } from '../domain/entity/DnD5eCharacter';
import { CharacterSpellRelation } from '../domain/repository/character-spell.repo';
import { InventoryDto, InventoryItem } from '../domain/repository/inventory.repo';
import { CreateCharacterInput } from './create-character/create-character.use-case';
import { ToggleSpellAction } from './spells/toggle-character-spell.use-case';
import { CharacterUpdates } from './update-character/update-character.use-case';

export type { CharacterUpdates, CreateCharacterInput };

/** Operations the characters context exposes to the interface layer. */
export interface CharacterContext {
  getById(id: string, requesterId: string): Promise<Character>;
  getByOwner(ownerUsername: string, kind?: CharacterKind): Promise<Character[]>;
  create(data: CreateCharacterInput): Promise<DnD5eCharacter>;
  update(input: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }): Promise<DnD5eCharacter>;
  delete(id: string, ownerUsername: string): Promise<boolean>;
  duplicate(id: string, name: string): Promise<{ id: string }>;
  uploadAvatar(id: string, userId: string, file: Blob): Promise<string>;
  isOwner(id: string, userId: string): Promise<boolean>;

  // Spells
  getSpells(id: string, requesterId: string, locale?: string): Promise<CharacterSpellRelation[]>;
  toggleSpell(
    id: string,
    requesterId: string,
    spellId: string,
    action: ToggleSpellAction,
    locale?: string,
  ): Promise<CharacterSpellRelation | null>;

  // Inventory (the character's own containers; the party chest is not here)
  getInventory(id: string, requesterId: string, locale?: string): Promise<InventoryDto>;
  addItem(
    id: string,
    requesterId: string,
    input: { ref: string; containerId: string; quantity: number },
    locale?: string,
  ): Promise<InventoryItem>;
  setItemQuantity(id: string, requesterId: string, itemId: string, quantity: number): Promise<void>;
  removeItem(id: string, requesterId: string, itemId: string): Promise<void>;
  setCoins(id: string, requesterId: string, containerId: string, coins: Coins): Promise<void>;

  // Read only, for the GM of a party the character was brought to
  getForPartyGm(partyId: string, id: string, gmId: string): Promise<Character>;
  getSpellsForPartyGm(
    partyId: string,
    id: string,
    gmId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]>;
  getInventoryForPartyGm(
    partyId: string,
    id: string,
    gmId: string,
    locale?: string,
  ): Promise<InventoryDto>;
}
