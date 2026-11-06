import type { Coins } from '@shared/systems/dnd5e/coins';

import type { CharacterKind } from '../domain/entity/Character';
import { CharacterContext, CharacterUpdates, CreateCharacterInput } from '../index';

export const makeCharactersApi = (characterContext: CharacterContext) => ({
  getById: async (id: string, requesterId: string) => {
    const character = await characterContext.getById(id, requesterId);
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string, kind: CharacterKind = 'pc') => {
    const characters = await characterContext.getByOwner(ownerUsername, kind);
    return characters.map((c) => c.toJSON());
  },

  create: async (data: CreateCharacterInput) => {
    const character = await characterContext.create(data);
    return { id: character.id };
  },

  update: async ({
    id,
    ownerUsername,
    updates,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }) => {
    const character = await characterContext.update({
      id,
      ownerUsername,
      updates,
    });
    return { id: character.id };
  },

  duplicate: (id: string, name: string) => characterContext.duplicate(id, name),

  delete: async (id: string, ownerUsername: string) => {
    await characterContext.delete(id, ownerUsername);
    return { deleted: true };
  },
  uploadAvatar: async (id: string, userId: string, file: Blob, full?: Blob) => {
    return characterContext.uploadAvatar(id, userId, file, full);
  },
  getSpells: async (id: string, requesterId: string, locale?: string) => {
    return characterContext.getSpells(id, requesterId, locale);
  },
  toggleSpell: async (
    id: string,
    requesterId: string,
    spellId: string,
    action: 'learn' | 'forget' | 'prepare' | 'unprepare',
    locale?: string,
  ) => {
    return characterContext.toggleSpell(id, requesterId, spellId, action, locale);
  },

  getInventory: (id: string, requesterId: string, locale?: string) =>
    characterContext.getInventory(id, requesterId, locale),
  addItem: (
    id: string,
    requesterId: string,
    input: { ref: string; containerId: string; quantity: number },
    locale?: string,
  ) => characterContext.addItem(id, requesterId, input, locale),
  setItemQuantity: (id: string, requesterId: string, itemId: string, quantity: number) =>
    characterContext.setItemQuantity(id, requesterId, itemId, quantity),
  removeItem: (id: string, requesterId: string, itemId: string) =>
    characterContext.removeItem(id, requesterId, itemId),
  setCoins: (id: string, requesterId: string, containerId: string, coins: Coins) =>
    characterContext.setCoins(id, requesterId, containerId, coins),

  getPartyChest: (partyId: string, locale?: string) =>
    characterContext.getPartyChest(partyId, locale),
  addPartyChestItem: (
    partyId: string,
    input: { ref: string; containerId: string; quantity: number },
    locale?: string,
  ) => characterContext.addPartyChestItem(partyId, input, locale),
  setPartyChestItemQuantity: (partyId: string, itemId: string, quantity: number) =>
    characterContext.setPartyChestItemQuantity(partyId, itemId, quantity),
  removePartyChestItem: (partyId: string, itemId: string) =>
    characterContext.removePartyChestItem(partyId, itemId),
  setPartyChestCoins: (partyId: string, containerId: string, coins: Coins) =>
    characterContext.setPartyChestCoins(partyId, containerId, coins),

  getForPartyGm: async (partyId: string, id: string, gmId: string) => {
    const character = await characterContext.getForPartyGm(partyId, id, gmId);
    return character.toJSON();
  },
  getInventoryForPartyGm: (partyId: string, id: string, gmId: string, locale?: string) =>
    characterContext.getInventoryForPartyGm(partyId, id, gmId, locale),
  getSpellsForPartyGm: (partyId: string, id: string, gmId: string, locale?: string) =>
    characterContext.getSpellsForPartyGm(partyId, id, gmId, locale),
});
