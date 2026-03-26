import { Lore, LoreContext } from '../index';

export const makeLoreApi = (loreContext: LoreContext) => ({
  getByCharacterId: async (characterId: string) => {
    const lore = await loreContext.getByCharacterId(characterId);
    return lore ? lore.toJSON() : null;
  },

  update: async (characterId: string, data: Record<string, unknown>) => {
    const lore = Lore.fromJSON(data);
    await loreContext.save(characterId, lore);
    return { characterId };
  },

  delete: async (characterId: string) => {
    await loreContext.delete(characterId);
    return { deleted: true };
  },
});
