import { CharacterContext, CharacterUpdates, CreateCharacterInput } from '../index';

export const makeCharactersApi = (characterContext: CharacterContext) => ({
  getById: async (id: string) => {
    const character = await characterContext.getById(id);
    return character.toJSON();
  },

  getByOwner: async (ownerUsername: string) => {
    const characters = await characterContext.getByOwner(ownerUsername);
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

  delete: async (id: string, ownerUsername: string) => {
    await characterContext.delete(id, ownerUsername);
    return { deleted: true };
  },
});
