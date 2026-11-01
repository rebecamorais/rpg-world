import { Lore, LoreContext } from '../index';

export const makeLoreApi = (loreContext: LoreContext) => ({
  getByCharacterId: async (characterId: string, requesterId: string) => {
    const lore = await loreContext.getByCharacterId(characterId, requesterId);
    return lore ? lore.toJSON() : null;
  },

  update: async (characterId: string, requesterId: string, data: Record<string, unknown>) => {
    const lore = Lore.fromJSON(data);
    await loreContext.save(characterId, requesterId, lore);
    return { characterId };
  },

  getForPartyGm: async (partyId: string, characterId: string, gmId: string) => {
    const lore = await loreContext.getForPartyGm(partyId, characterId, gmId);
    return lore ? lore.toJSON() : null;
  },

  delete: async (characterId: string, requesterId: string) => {
    await loreContext.delete(characterId, requesterId);
    return { deleted: true };
  },
});
